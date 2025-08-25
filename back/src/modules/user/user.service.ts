import { I18nService } from 'nestjs-i18n';
import { TokenPayload } from 'src/utils/common.types';
import { encryptPassword } from 'src/utils/helpers';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { Repository } from 'typeorm';
import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../role/role.entity';
import { User } from './user.entity';
import {
  UserCreateProps,
  UserDeleteProps,
  UserGetByIdProps,
  UserGetByUsernameProps,
  UserQuery,
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

    private readonly i18n: I18nService,
  ) {}

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
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });

    if (!result)
      throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    if (!includePassword) delete result.password;
    return {
      ...cleanColumns<User>(result),
      roles: result.roles.filter((r) => r.enabled),
    };
  }

  async getByUsername({
    username,
    includePassword = false,
  }: UserGetByUsernameProps) {
    const result = await this.repository.findOne({
      where: { username },
      withDeleted: true,
      relations: {
        roles: true,
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });

    if (!result)
      throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    if (result && !includePassword) delete result.password;
    return {
      ...cleanColumns<User>(result),
      roles: result?.roles.filter((r) => r.enabled) ?? [],
    } as User;
  }

  async create({ data, userId }: UserCreateProps) {
    const created_by = await this.repository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    const exists = await this.repository.findOne({
      where: { username: data.username },
    });
    if (exists)
      throw new NotAcceptableException(
        `${this.i18n.t('errors.user.usernameExists')}: ${data.username}`,
      );

    const roles: Role[] = [];

    if (data.roles_ids) {
      for (const id of data.roles_ids) {
        const found = await this.roleRepository.findOne({
          where: { id },
        });
        if (!found)
          throw new NotAcceptableException(
            `${this.i18n.t('errors.role.notFound')}. ID: ${id}`,
          );

        roles.push(found);
      }
      delete data.roles_ids;
    }
    data.roles = roles;

    if (data.password) data.password = await encryptPassword(data.password);

    const created = this.repository.create({ ...data, created_by });
    const result = await this.repository.save(created);

    delete result.password;
    return cleanColumns<User>(result);
  }

  async update({ id, data, userId }: UserUpdateProps) {
    const updated_by = await this.repository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    // get existing user
    const existing = await this.repository.findOne({
      where: { id },
    });

    if (!existing)
      throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    // if username changed
    if (data.username && existing.username !== data.username) {
      const exists = await this.repository.findOne({
        where: { username: data.username },
      });
      if (exists)
        throw new NotAcceptableException(
          `${this.i18n.t('errors.user.usernameExists')}: ${data.username}`,
        );
    }

    const roles: Role[] = [];

    if (data.roles_ids?.length) {
      for (const id of data.roles_ids) {
        const found = await this.roleRepository.findOne({
          where: { id },
        });
        if (!found)
          throw new NotAcceptableException(
            `${this.i18n.t('errors.role.notFound')}. ID: ${id}`,
          );

        roles.push(found);
      }

      delete data.roles_ids;
    }

    existing.roles = roles;
    existing.updated_by = updated_by;

    if (data.username) existing.username = data.username;
    if (data.password) existing.password = await encryptPassword(data.password);
    if (data.name) existing.name = data.name;
    if ('enabled' in data) existing.enabled = data.enabled;

    const result = await this.repository.save(existing);

    delete result.password;
    return cleanColumns<User>(result);
  }

  async remove({ id, userId }: UserDeleteProps) {
    const deleted_by = await this.repository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, { deleted_by });
    await this.repository.softDelete(id);
    return { deleted: true };
  }

  async validate(data: UserValidateProps) {
    try {
      const token = data?.token;

      if (!token)
        throw new UnauthorizedException(
          this.i18n.t('errors.token.notIncluded'),
        );

      const base64Payload = token.split('.')[1];
      const payloadBuffer = Buffer.from(base64Payload, 'base64');
      const payload = JSON.parse(payloadBuffer.toString()) as TokenPayload;
      const user = await this.get({ id: payload.user.id });
      return !!user;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
