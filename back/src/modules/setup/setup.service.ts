import { I18nService } from 'nestjs-i18n';
import { encryptPassword } from 'src/utils/helpers';
import { IsNull, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Role } from '../role/role.entity';
import { User } from '../user/user.entity';
import { SetupProps } from './setup.types';

export class SetupService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Congregation)
    private congregationRepository: Repository<Congregation>,

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

  async setup(data: SetupProps) {
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
    if (!user.username)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} User: username`,
      );
    if (!user.password)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} User: password`,
      );
    if (!user.name)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} User: name`,
      );

    if (!role)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missing')} role`,
      );
    if (!role.name)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Role: name`,
      );

    if (!congregation)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missing')} congregation`,
      );
    if (!congregation.name)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: name`,
      );
    if (!congregation.type)
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
    if (congregation.locations.some((l) => !l.name))
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: location.name`,
      );
    if (congregation.locations.some((l) => !l.address))
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: location.address`,
      );
    if (!congregation.features || !congregation.features.length)
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: features`,
      );
    if (congregation.features.some((l) => !l))
      throw new BadRequestException(
        `${this.i18n.t('errors.setup.missingProp')} Congregation: feature`,
      );

    const userCreated = this.userRepository.create({
      username: user.username,
      password: await encryptPassword(user.password),
      name: user.name,
    });
    if (!userCreated)
      throw new InternalServerErrorException(
        `${this.i18n.t('errors.setup.errorCreating')} userRepository`,
      );
    await this.userRepository.save(userCreated);

    const roleCreated = this.roleRepository.create({
      name: role.name,
      full_access: true,
      created_by: userCreated,
    });
    if (!roleCreated)
      throw new InternalServerErrorException(
        `${this.i18n.t('errors.setup.errorCreating')} roleRepository`,
      );
    await this.roleRepository.save(roleCreated);

    userCreated.roles = [roleCreated];
    await this.userRepository.save(userCreated);

    const congregationCreated = this.congregationRepository.create({
      name: congregation.name,
      type: congregation.type,
      created_by: userCreated,
      locations: congregation.locations.map((l) => ({
        order: l.order,
        name: l.name,
        address: l.address,
        created_by: userCreated,
      })),
      features: congregation.features,
    });
    if (!congregationCreated)
      throw new InternalServerErrorException(
        `${this.i18n.t('errors.setup.errorCreating')} congregationRepository`,
      );
    await this.congregationRepository.save(congregationCreated);

    return { success: true };
  }
}
