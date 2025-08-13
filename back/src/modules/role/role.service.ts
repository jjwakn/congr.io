import {
  caseInsensitiveWhere,
  cleanColumns,
  getListVariables,
} from 'src/utils/query';
import { Raw, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Role } from './role.entity';
import { RoleQuery } from './role.types';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private repository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async list(query: RoleQuery) {
    const { paginate, sort, find } = getListVariables(query, ['full_access']);

    const [result, total] = await this.repository.findAndCount({
      ...(paginate && { take: query.size, skip: query.size * query.page }),
      ...(sort && { order: { [query.order]: query.direction } }),
      ...(find && {
        where: {
          ...('search' in query &&
            Number.isNaN(Number(query.search)) && {
              name: Raw((alias) => caseInsensitiveWhere(alias, query.search)),
            }),
          ...('search' in query &&
            !Number.isNaN(Number(query.search)) && {
              id: Number(query.search),
            }),
          ...('full_access' in query && {
            full_access: query.full_access,
          }),
          ...('enabled' in query && {
            enabled: query.enabled,
          }),
        },
      }),
    });

    return { result, total };
  }

  async get(id: number) {
    const result = await this.repository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });

    if (!result) throw new NotFoundException('Role not found');

    return cleanColumns<Role>(result);
  }

  async create(data: Role, user_id: number) {
    const created_by = await this.userRepository.findOne({
      where: { id: user_id },
      withDeleted: true,
    });

    const created = this.repository.create({ ...data, created_by });
    return this.repository.save(created);
  }

  async update(id: number, data: Role, user_id: number) {
    const updated_by = await this.userRepository.findOne({
      where: { id: user_id },
      withDeleted: true,
    });

    await this.repository.update(id, { ...data, updated_by });
    return cleanColumns<Role>(
      this.repository.findOne({
        where: { id },
      }),
    );
  }

  async remove(id: number, user_id: number) {
    const deleted_by = await this.userRepository.findOne({
      where: { id: user_id },
      withDeleted: true,
    });

    await this.repository.update(id, { deleted_by });
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
