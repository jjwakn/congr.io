import { compare } from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { TokenPayload } from 'src/common/common.types';
import { encryptPassword } from 'src/utils/helpers';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { Repository } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';
import { Role } from '../role/role.entity';
import { User } from './user.entity';
import {
  UserChangeOwnPasswordProps,
  UserCompleteTemporaryPasswordProps,
  UserCreateProps,
  UserDeleteProps,
  UserGetByIdProps,
  UserGetByUsernameProps,
  UserQuery,
  UserSetTemporaryPasswordProps,
  UserUpdateProps,
  UserValidateProps,
} from './user.types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,

    @InjectRepository(Role)
    private roleRepository: Repository<Role>,

    @InjectRepository(Congregation)
    private congregationRepository: Repository<Congregation>,

    @InjectRepository(Location)
    private locationRepository: Repository<Location>,

    private readonly i18n: I18nService,
  ) {}

  private ensurePasswordConfirmation(password: string, confirmation: string) {
    if (password !== confirmation)
      throw new BadRequestException(this.i18n.t('errors.user.passwordConfirmationMismatch'));
  }

  private async getExistingUser(id: string) {
    const existing = await this.repository.findOne({
      where: { id },
    });

    if (!existing) throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    return existing;
  }

  private async mapRoles(roleIds: string[] = []) {
    const roles: Role[] = [];

    for (const id of roleIds) {
      const found = await this.roleRepository.findOne({
        where: { id },
      });
      if (!found)
        throw new NotAcceptableException(
          this.i18n.t('errors.role.notFoundWithId', {
            args: { id },
          }),
        );

      roles.push(found);
    }

    return roles;
  }

  private async mapCongregations(congregationIds: string[] = []) {
    const congregations: Congregation[] = [];

    for (const id of congregationIds) {
      const found = await this.congregationRepository.findOne({
        where: { id },
      });
      if (!found)
        throw new NotAcceptableException(
          this.i18n.t('errors.congregation.notFoundWithId', {
            args: { id },
          }),
        );

      congregations.push(found);
    }

    return congregations;
  }

  private async mapLocations(locationIds: string[] = []) {
    const locations: Location[] = [];

    for (const id of locationIds) {
      const found = await this.locationRepository.findOne({
        where: { id },
      });
      if (!found)
        throw new NotAcceptableException(
          this.i18n.t('errors.location.notFoundWithId', {
            args: { id },
          }),
        );

      locations.push(found);
    }

    return locations;
  }

  async list(query: UserQuery) {
    const { result, total } = await findWithFilters<User, UserQuery>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name', 'username'],
      booleanFields: ['enabled'],
    });

    return {
      result: result.map((r) => {
        delete r.password;
        return r;
      }),
      total,
    };
  }

  async get({ id, includePassword = false }: UserGetByIdProps) {
    const result = await this.repository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        roles: true,
        locations: true,
        congregations: true,
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    if (!includePassword) delete result.password;
    return {
      ...cleanColumns<User>(result),
      roles: result.roles.filter((r) => r.enabled),
    };
  }

  async getByUsername({ username, includePassword = false }: UserGetByUsernameProps) {
    const result = await this.repository.findOne({
      where: { username },
      withDeleted: true,
      relations: {
        roles: true,
        locations: true,
        congregations: true,
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    if (result && !includePassword) delete result.password;
    return {
      ...cleanColumns<User>(result),
      roles: result?.roles.filter((r) => r.enabled) ?? [],
    };
  }

  async create({ data, userId }: UserCreateProps) {
    data = data ?? ({} as User);

    const created_by = await this.repository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    const exists = await this.repository.findOne({
      where: { username: data.username },
    });
    if (exists)
      throw new NotAcceptableException(
        this.i18n.t('errors.user.usernameExistsWithValue', {
          args: { username: data.username },
        }),
      );

    if (data.roles_ids) {
      data.roles = await this.mapRoles(data.roles_ids);
      delete data.roles_ids;
    }

    if (data.congregations_ids) {
      data.congregations = await this.mapCongregations(data.congregations_ids);
      delete data.congregations_ids;
    }

    if (data.locations_ids) {
      data.locations = await this.mapLocations(data.locations_ids);
      delete data.locations_ids;
    }

    if (data.password) data.password = await encryptPassword(data.password);
    data.password_change_required = false;

    const created = this.repository.create({ ...data, created_by });
    const result = await this.repository.save(created);

    delete result.password;
    return cleanColumns<User>(result);
  }

  async update({ id, data, userId }: UserUpdateProps) {
    data = data ?? ({} as User);

    const updated_by = await this.repository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    const existing = await this.getExistingUser(id);
    const isSelfUpdate = id === userId;

    if (isSelfUpdate) {
      const restrictedFields = [
        'username',
        'password',
        'enabled',
        'roles',
        'roles_ids',
        'congregations',
        'congregations_ids',
        'locations',
        'locations_ids',
      ];
      const hasRestrictedField = restrictedFields.some((field) => field in data);

      if (hasRestrictedField) throw new ForbiddenException(this.i18n.t('errors.user.selfUpdateRestricted'));

      existing.updated_by = updated_by;
      if (data.name) existing.name = data.name.trim();

      const result = await this.repository.save(existing);

      delete result.password;
      return cleanColumns<User>(result);
    }

    if ('password' in data) throw new BadRequestException(this.i18n.t('errors.user.usePasswordAction'));

    // if username changed
    if (data.username && existing.username !== data.username) {
      const exists = await this.repository.findOne({
        where: { username: data.username },
      });
      if (exists)
        throw new NotAcceptableException(
          this.i18n.t('errors.user.usernameExistsWithValue', {
            args: { username: data.username },
          }),
        );
    }

    if ('roles_ids' in data) {
      existing.roles = await this.mapRoles(data.roles_ids);
      delete data.roles_ids;
    }

    if ('congregations_ids' in data) {
      existing.congregations = await this.mapCongregations(data.congregations_ids);
      delete data.congregations_ids;
    }

    if ('locations_ids' in data) {
      existing.locations = await this.mapLocations(data.locations_ids);
      delete data.locations_ids;
    }

    existing.updated_by = updated_by;

    if (data.username) existing.username = data.username.trim();
    if (data.name) existing.name = data.name.trim();
    if ('enabled' in data) existing.enabled = data.enabled;

    const result = await this.repository.save(existing);

    delete result.password;
    return cleanColumns<User>(result);
  }

  async remove({ id, userId }: UserDeleteProps) {
    if (id === userId) throw new ForbiddenException(this.i18n.t('errors.user.cannotDeleteSelf'));

    const deleted_by = await this.repository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, { deleted_by });
    await this.repository.softDelete(id);
    return { deleted: true };
  }

  async changeOwnPassword({ data, userId }: UserChangeOwnPasswordProps) {
    this.ensurePasswordConfirmation(data.password, data.password_confirmation);

    const [existing, updated_by] = await Promise.all([
      this.getExistingUser(userId),
      this.repository.findOne({
        where: { id: userId },
        withDeleted: true,
      }),
    ]);
    const isCurrentPasswordValid = await compare(data.current_password, existing.password ?? '');

    if (!isCurrentPasswordValid) throw new UnauthorizedException(this.i18n.t('errors.user.currentPasswordInvalid'));

    const isNewPasswordSame = await compare(data.password, existing.password ?? '');

    if (isNewPasswordSame) throw new BadRequestException(this.i18n.t('errors.user.newPasswordMustBeDifferent'));

    existing.password = await encryptPassword(data.password);
    existing.password_change_required = false;
    existing.failed_login_attempts = 0;
    existing.locked_at = null;
    existing.updated_by = updated_by;

    const result = await this.repository.save(existing);

    delete result.password;
    return cleanColumns<User>(result);
  }

  async completeTemporaryPassword({ data, userId }: UserCompleteTemporaryPasswordProps) {
    this.ensurePasswordConfirmation(data.password, data.password_confirmation);

    const [existing, updated_by] = await Promise.all([
      this.getExistingUser(userId),
      this.repository.findOne({
        where: { id: userId },
        withDeleted: true,
      }),
    ]);

    if (!existing.password_change_required)
      throw new BadRequestException(this.i18n.t('errors.user.passwordChangeNotRequired'));

    const isNewPasswordSame = await compare(data.password, existing.password ?? '');

    if (isNewPasswordSame) throw new BadRequestException(this.i18n.t('errors.user.newPasswordMustBeDifferent'));

    existing.password = await encryptPassword(data.password);
    existing.password_change_required = false;
    existing.failed_login_attempts = 0;
    existing.locked_at = null;
    existing.updated_by = updated_by;

    const result = await this.repository.save(existing);

    delete result.password;
    return cleanColumns<User>(result);
  }

  async setTemporaryPassword({ id, data, userId }: UserSetTemporaryPasswordProps) {
    if (id === userId) throw new ForbiddenException(this.i18n.t('errors.user.cannotSetTemporaryPasswordForSelf'));

    this.ensurePasswordConfirmation(data.password, data.password_confirmation);

    const [existing, updated_by] = await Promise.all([
      this.getExistingUser(id),
      this.repository.findOne({
        where: { id: userId },
        withDeleted: true,
      }),
    ]);

    existing.password = await encryptPassword(data.password);
    existing.password_change_required = true;
    existing.failed_login_attempts = 0;
    existing.locked_at = null;
    existing.updated_by = updated_by;

    const result = await this.repository.save(existing);

    delete result.password;
    return cleanColumns<User>(result);
  }

  async validate(data: UserValidateProps) {
    try {
      const token = data?.token;

      if (!token) throw new UnauthorizedException(this.i18n.t('errors.token.notIncluded'));

      const base64Payload = token.split('.')[1];
      const payloadBuffer = Buffer.from(base64Payload, 'base64');
      const payload = JSON.parse(payloadBuffer.toString()) as TokenPayload;
      const user = await this.get({ id: payload.user.id });
      return !!user;
    } catch (e) {
      console.error(this.i18n.t('errors.token.validationError'), e);
      return false;
    }
  }
}
