import { I18nService } from 'nestjs-i18n';
import { Feature } from 'src/utils/constants';
import { encryptPassword } from 'src/utils/helpers';
import { IsNull, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';
import { Role } from '../role/role.entity';
import { User } from '../user/user.entity';
import { SetupProps, SetupResponse } from './setup.types';

@Injectable()
export class SetupService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Congregation)
    private congregationRepository: Repository<Congregation>,

    @InjectRepository(Location)
    private locationRepository: Repository<Location>,

    private readonly i18n: I18nService,
  ) {}

  async isSetup() {
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

    return { isSetup: !!userCount && !!roleCount && !!congregationCount };
  }

  async setup(data: SetupProps): Promise<SetupResponse> {
    if (!data)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missing')} body`,
      );

    const { role, user, congregation } = data;

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

    if (userCount || roleCount || congregationCount)
      throw new ConflictException(this.i18n.t('errors.setup.alreadySetup'));

    if (!user)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missing')} user`,
      );
    if (!user.username?.trim())
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} User: username`,
      );
    if (!user.password)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} User: password`,
      );
    if (!user.name?.trim())
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} User: name`,
      );

    if (!role)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missing')} role`,
      );
    if (!role.name?.trim())
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Role: name`,
      );

    if (!congregation)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missing')} congregation`,
      );
    if (!congregation.name?.trim())
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: name`,
      );
    if (!congregation.type?.trim())
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: type`,
      );
    if (!congregation.locations || !congregation.locations.length)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: locations`,
      );
    if (
      congregation.locations.some(
        (l) => l.order === undefined || l.order === null,
      )
    )
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: location.order`,
      );
    if (congregation.locations.some((l) => !l.name?.trim()))
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: location.name`,
      );

    if (!congregation.features || !congregation.features.length)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: features`,
      );
    if (congregation.features.some((l) => !l))
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: feature`,
      );
    if (!congregation.logo_small?.length)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: logo_small`,
      );
    if (!congregation.logo_large?.length)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: logo_large`,
      );

    const userCreated = this.userRepository.create({
      username: user.username.trim(),
      password: await encryptPassword(user.password),
      name: user.name.trim(),
    });
    if (!userCreated)
      throw new InternalServerErrorException(
        `${this.i18n.t('errors.setup.errorCreating')} userRepository`,
      );
    await this.userRepository.save(userCreated);

    const roleCreated = this.roleRepository.create({
      name: role.name.trim(),
      full_access: true,
      created_by: userCreated,
    });
    if (!roleCreated)
      throw new InternalServerErrorException(
        `${this.i18n.t('errors.setup.errorCreating')} roleRepository`,
      );
    await this.roleRepository.save(roleCreated);

    const locationsCreated = this.locationRepository.create(
      congregation.locations.map((l) => ({
        order: l.order,
        name: l.name.trim(),
        address: l.address.trim(),
        created_by: userCreated,
      })),
    );
    if (!locationsCreated.length)
      throw new InternalServerErrorException(
        `${this.i18n.t('errors.setup.errorCreating')} locationRepository`,
      );
    await this.locationRepository.save(locationsCreated);

    const congregationCreated = this.congregationRepository.create({
      name: congregation.name.trim(),
      type: congregation.type.trim(),
      created_by: userCreated,
      locations: locationsCreated,
      features: congregation.features
        .map((f) => f.toString().trim())
        .filter(Boolean) as Feature[],
      logo_small: congregation.logo_small,
      logo_large: congregation.logo_large,
    });
    if (!congregationCreated)
      throw new InternalServerErrorException(
        `${this.i18n.t('errors.setup.errorCreating')} congregationRepository`,
      );
    await this.congregationRepository.save(congregationCreated);

    userCreated.roles = [roleCreated];
    userCreated.congregations = [congregationCreated];
    userCreated.locations = locationsCreated;
    await this.userRepository.save(userCreated);

    return {
      isSetup: true,
      congregation: {
        id: congregationCreated.id,
        name: congregationCreated.name,
        type: congregationCreated.type,
        features: congregationCreated.features,
        locations: locationsCreated.map((location) => ({
          id: location.id,
          order: location.order,
          name: location.name,
          address: location.address,
        })),
        has_logo_small: Boolean(congregationCreated.logo_small?.length),
        has_logo_large: Boolean(congregationCreated.logo_large?.length),
      },
    };
  }
}
