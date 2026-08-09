import { I18nContext, I18nService } from 'nestjs-i18n';
import { secretsMatch } from 'src/config/security';
import { Feature } from 'src/utils/constants';
import { isValidTimeZone, normalizeTimeZone } from 'src/utils/datetime';
import { encryptPassword } from 'src/utils/helpers';
import { DataSource, IsNull, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Configuration } from '../configurations/configurations.entity';
import { ConfigurationsService } from '../configurations/configurations.service';
import {
  DEFAULT_THEME_PALETTE_CONFIG,
  THEME_PALETTE_CONFIG_KEY,
  ThemePaletteConfig,
} from '../configurations/configurations.types';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';
import { Role } from '../role/role.entity';
import { SecurityAuditService } from '../security/security-audit.service';
import { SecurityAuditEvent } from '../security/security.types';
import { User } from '../user/user.entity';
import { IsSetupResponse, SetupCongregationData, SetupProps, SetupResponse } from './setup.types';

@Injectable()
export class SetupService {
  private setupInProgress = false;

  constructor(
    private dataSource: DataSource,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Congregation)
    private congregationRepository: Repository<Congregation>,

    @InjectRepository(Location)
    private locationRepository: Repository<Location>,

    private readonly configurationsService: ConfigurationsService,

    private readonly i18n: I18nService,

    @Optional()
    private readonly securityAudit?: SecurityAuditService,
  ) {}

  private translate(key: string, lang?: string): string {
    return this.i18n.t(key, { lang: lang ?? I18nContext.current()?.lang });
  }

  private async mapCongregation(
    congregation: Congregation,
    themePalette?: ThemePaletteConfig,
  ): Promise<SetupCongregationData> {
    const resolvedThemePalette =
      themePalette ?? (await this.configurationsService.getThemePaletteConfigByCongregationId(congregation.id));

    return {
      id: congregation.id,
      name: congregation.name,
      type: congregation.type,
      timezone: congregation.timezone,
      features: congregation.features,
      updated_at: congregation.updated_at,
      locations: (congregation.locations ?? []).map((location) => ({
        id: location.id,
        order: location.order,
        name: location.name,
        address: location.address,
      })),
      theme_palette: resolvedThemePalette,
    };
  }

  async isSetup(): Promise<IsSetupResponse> {
    const [userCount, roleCount, congregationCount] = await Promise.all([
      this.userRepository.count({
        where: { deleted_at: IsNull(), deleted_by: IsNull() },
      }),
      this.roleRepository.count({
        where: { deleted_at: IsNull(), deleted_by: IsNull() },
      }),
      this.congregationRepository.count({
        where: { deleted_at: IsNull(), deleted_by: IsNull() },
      }),
    ]);

    const isSetup = !!userCount && !!roleCount && !!congregationCount;
    if (!isSetup) return { isSetup: false };

    const congregation = await this.congregationRepository.findOne({
      where: { deleted_at: IsNull(), deleted_by: IsNull() },
      relations: {
        locations: true,
      },
    });

    if (!congregation) return { isSetup: false };

    return {
      isSetup: true,
      congregation: await this.mapCongregation(congregation),
    };
  }

  async setup(data: SetupProps, lang?: string, bootstrapSecret?: string): Promise<SetupResponse> {
    if (!secretsMatch(bootstrapSecret, process.env.SETUP_BOOTSTRAP_SECRET?.trim() ?? '')) {
      throw new UnauthorizedException(this.translate('errors.setup.invalidBootstrapSecret', lang));
    }

    if (this.setupInProgress) throw new ConflictException(this.translate('errors.setup.alreadySetup', lang));

    this.setupInProgress = true;

    try {
      if (!data) throw new BadRequestException(this.translate('errors.setup.missingBody', lang));

      const { role, user, congregation } = data;

      if (!user) throw new BadRequestException(this.translate('errors.setup.missingUser', lang));
      if (!user.username?.trim())
        throw new BadRequestException(this.translate('errors.setup.missingUserUsername', lang));
      if (!user.password) throw new BadRequestException(this.translate('errors.setup.missingUserPassword', lang));
      if (!user.name?.trim()) throw new BadRequestException(this.translate('errors.setup.missingUserName', lang));

      if (!role) throw new BadRequestException(this.translate('errors.setup.missingRole', lang));
      if (!role.name?.trim()) throw new BadRequestException(this.translate('errors.setup.missingRoleName', lang));

      if (!congregation) throw new BadRequestException(this.translate('errors.setup.missingCongregation', lang));
      if (!congregation.name?.trim())
        throw new BadRequestException(this.translate('errors.setup.missingCongregationName', lang));
      if (!congregation.type?.trim())
        throw new BadRequestException(this.translate('errors.setup.missingCongregationType', lang));
      if (!congregation.timezone?.trim())
        throw new BadRequestException(this.translate('errors.setup.missingCongregationTimezone', lang));
      if (!isValidTimeZone(congregation.timezone.trim()))
        throw new BadRequestException(this.translate('errors.setup.invalidCongregationTimezone', lang));
      if (!congregation.locations || !congregation.locations.length)
        throw new BadRequestException(this.translate('errors.setup.missingCongregationLocations', lang));
      if (congregation.locations.some((location) => location.order === undefined || location.order === null))
        throw new BadRequestException(this.translate('errors.setup.missingCongregationLocationOrder', lang));
      if (congregation.locations.some((location) => !location.name?.trim()))
        throw new BadRequestException(this.translate('errors.setup.missingCongregationLocationName', lang));

      if (!congregation.features || !congregation.features.length)
        throw new BadRequestException(this.translate('errors.setup.missingCongregationFeatures', lang));
      if (congregation.features.some((feature) => !feature))
        throw new BadRequestException(this.translate('errors.setup.missingCongregationFeature', lang));

      const encryptedPassword = await encryptPassword(user.password);

      return this.dataSource.transaction(async (manager) => {
        await manager.query('SELECT pg_advisory_xact_lock($1)', [737_170_001]);
        const userRepository = manager.getRepository(User);
        const roleRepository = manager.getRepository(Role);
        const congregationRepository = manager.getRepository(Congregation);
        const configurationsRepository = manager.getRepository(Configuration);
        const locationRepository = manager.getRepository(Location);

        const [userCount, roleCount, congregationCount] = await Promise.all([
          userRepository.count({ withDeleted: true }),
          roleRepository.count({ withDeleted: true }),
          congregationRepository.count({ withDeleted: true }),
        ]);

        if (userCount || roleCount || congregationCount)
          throw new ConflictException(this.translate('errors.setup.alreadySetup', lang));

        const userCreated = userRepository.create({
          username: user.username.trim(),
          password: encryptedPassword,
          name: user.name.trim(),
        });
        if (!userCreated)
          throw new InternalServerErrorException(this.translate('errors.setup.errorCreatingUserRepository', lang));
        await userRepository.save(userCreated);

        const roleCreated = roleRepository.create({
          name: role.name.trim(),
          full_access: true,
          created_by: userCreated,
        });
        if (!roleCreated)
          throw new InternalServerErrorException(this.translate('errors.setup.errorCreatingRoleRepository', lang));
        await roleRepository.save(roleCreated);

        const locationsCreated = locationRepository.create(
          congregation.locations.map((location) => ({
            order: location.order,
            name: location.name.trim(),
            address: location.address?.trim() ?? '',
            created_by: userCreated,
          })),
        );
        if (!locationsCreated.length)
          throw new InternalServerErrorException(this.translate('errors.setup.errorCreatingLocationRepository', lang));
        await locationRepository.save(locationsCreated);

        const congregationCreated = congregationRepository.create({
          name: congregation.name.trim(),
          type: congregation.type.trim(),
          timezone: normalizeTimeZone(congregation.timezone),
          created_by: userCreated,
          locations: locationsCreated,
          features: congregation.features.map((feature) => feature.toString().trim()).filter(Boolean) as Feature[],
        });
        if (!congregationCreated)
          throw new InternalServerErrorException(
            this.translate('errors.setup.errorCreatingCongregationRepository', lang),
          );
        await congregationRepository.save(congregationCreated);

        const themePaletteConfig = configurationsRepository.create({
          congregation_id: congregationCreated.id,
          congregation: congregationCreated,
          config_key: THEME_PALETTE_CONFIG_KEY,
          config_value: DEFAULT_THEME_PALETTE_CONFIG,
          created_by: userCreated,
        });
        await configurationsRepository.save(themePaletteConfig);

        userCreated.roles = [roleCreated];
        userCreated.congregations = [congregationCreated];
        userCreated.locations = locationsCreated;
        await userRepository.save(userCreated);

        const congregationWithRelations = await congregationRepository.findOne({
          where: { id: congregationCreated.id },
          relations: {
            locations: true,
          },
        });

        if (!congregationWithRelations)
          throw new InternalServerErrorException(
            this.translate('errors.setup.errorCreatingCongregationRepository', lang),
          );

        this.securityAudit?.record(SecurityAuditEvent.setupCompleted, {
          user_id: userCreated.id,
          congregation_id: congregationWithRelations.id,
          role_id: roleCreated.id,
        });

        return {
          isSetup: true,
          congregation: await this.mapCongregation(congregationWithRelations, DEFAULT_THEME_PALETTE_CONFIG),
        };
      });
    } finally {
      this.setupInProgress = false;
    }
  }
}
