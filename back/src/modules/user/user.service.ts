import { TokenPayload } from 'src/utils/common.types';
import { encryptPassword } from 'src/utils/helpers';
import {
  caseInsensitiveWhere,
  cleanColumns,
  getListVariables,
} from 'src/utils/query';
import { Raw, Repository } from 'typeorm';
import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '../role/role.entity';
import { User } from './user.entity';
import { UserQuery, UserValidateProps } from './user.types';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,

    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async list(query: UserQuery) {
    const { paginate, sort, find } = getListVariables(query);

    const common = {
      ...('enabled' in query && {
        enabled: query.enabled,
      }),
    };

    const [result, total] = await this.repository.findAndCount({
      ...(paginate && { take: query.size, skip: query.size * query.page }),
      ...(sort && { order: { [query.order]: query.direction } }),
      ...(find && {
        where: [
          ...('search' in query
            ? [
                {
                  id: Raw((alias) =>
                    caseInsensitiveWhere(
                      `CAST(${alias} AS CHAR(10000))`,
                      query.search,
                    ),
                  ),
                  ...common,
                },
                {
                  name: Raw((alias) =>
                    caseInsensitiveWhere(alias, query.search),
                  ),
                  ...common,
                },
                {
                  username: Raw((alias) =>
                    caseInsensitiveWhere(alias, query.search),
                  ),
                  ...common,
                },
              ]
            : [{ ...common }]),
        ],
      }),
      relations: ['roles'],
    });

    return {
      result: result.map((r) => {
        delete r.password;
        return r;
      }),
      total,
    };
  }

  async get(id: number, includePassword: boolean = false) {
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

    if (!result) throw new NotFoundException('User not found');

    if (!includePassword) delete result.password;
    return {
      ...cleanColumns<User>(result),
      roles: result.roles.filter((r) => r.enabled),
    };
  }

  async getByUsername(username: string, includePassword: boolean = false) {
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

    if (!result) throw new NotFoundException('User not found');

    if (result && !includePassword) delete result.password;
    return {
      ...cleanColumns<User>(result),
      roles: result?.roles.filter((r) => r.enabled) ?? [],
    } as User;
  }

  async create(data: User, user_id: number) {
    const created_by = await this.repository.findOne({
      where: { id: user_id },
      withDeleted: true,
    });

    const exists = await this.repository.findOne({
      where: { username: data.username },
    });
    if (exists)
      throw new NotAcceptableException(
        `username ${data.username} already exists`,
      );

    const roles: Role[] = [];

    if (data.roles_ids) {
      for (const id of data.roles_ids) {
        const found = await this.rolesRepository.findOne({
          where: { id },
        });
        if (!found)
          throw new NotAcceptableException(`Role with id ${id} not found`);

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

  async update(id: number, data: User, user_id: number) {
    const updated_by = await this.repository.findOne({
      where: { id: user_id },
      withDeleted: true,
    });

    // get existing user
    const existing = await this.repository.findOne({
      where: { id },
    });

    if (!existing) throw new NotFoundException('User not found');

    // if username changed
    if (data.username && existing.username !== data.username) {
      const exists = await this.repository.findOne({
        where: { username: data.username },
      });
      if (exists)
        throw new NotAcceptableException(
          `username ${data.username} already exists`,
        );
    }

    const roles: Role[] = [];

    if (data.roles_ids?.length) {
      for (const id of data.roles_ids) {
        const found = await this.rolesRepository.findOne({
          where: { id },
        });
        if (!found)
          throw new NotAcceptableException(`Role with id ${id} not found`);

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

  async remove(id: number, user_id: number) {
    const deleted_by = await this.repository.findOne({
      where: { id: user_id },
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
        throw new UnauthorizedException('Authorization token not included');

      const base64Payload = token.split('.')[1];
      const payloadBuffer = Buffer.from(base64Payload, 'base64');
      const payload = JSON.parse(payloadBuffer.toString()) as TokenPayload;
      const user = await this.get(payload.user.id);
      return !!user;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
