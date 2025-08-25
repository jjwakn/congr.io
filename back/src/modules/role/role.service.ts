import { I18nService } from 'nestjs-i18n';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Role } from './role.entity';
import {
  RoleCreateProps,
  RoleDeleteProps,
  RoleQuery,
  RoleUpdateProps,
} from './role.types';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private repository: Repository<Role>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly i18n: I18nService,
  ) {}

  async list(query: RoleQuery) {
    const { result, total } = await findWithFilters<Role, RoleQuery>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name'],
      booleanFields: ['enabled', 'full_access'],
    });

    return { result, total };
  }

  async get(id: string) {
    const result = await this.repository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });

    if (!result)
      throw new NotFoundException(this.i18n.t('errors.role.notFound'));

    return cleanColumns<Role>(result);
  }

  async create({ data, userId }: RoleCreateProps) {
    const created_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    const created = this.repository.create({ ...data, created_by });
    return this.repository.save(created);
  }

  async update({ id, data, userId }: RoleUpdateProps) {
    const updated_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, { ...data, updated_by });
    return cleanColumns<Role>(
      this.repository.findOne({
        where: { id },
      }),
    );
  }

  async remove({ id, userId }: RoleDeleteProps) {
    const deleted_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, { deleted_by });
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
