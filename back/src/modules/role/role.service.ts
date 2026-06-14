import { I18nService } from 'nestjs-i18n';
import { DefaultGetData, Direction } from 'src/common/common.types';
import { ModuleAction } from 'src/utils/constants';
import { cleanColumns } from 'src/utils/query';
import { IsNull, Not, Repository } from 'typeorm';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Role } from './role.entity';
import { RoleCreateProps, RoleDeleteProps, RoleQuery, RoleUpdateProps } from './role.types';

const PERMISSION_ACTIONS = Object.values(ModuleAction);

const hasRolePermission = (role: Role, sectionId: string, action: ModuleAction): boolean => {
  if (role.full_access) return true;

  return role.permissions?.[sectionId]?.includes(action) ?? false;
};

const parsePermissionSort = (order?: string): { sectionId: string; action: ModuleAction } | null => {
  if (!order) return null;

  const separatorIndex = order.lastIndexOf('-');
  if (separatorIndex <= 0) return null;

  const sectionId = order.slice(0, separatorIndex);
  const action = order.slice(separatorIndex + 1) as ModuleAction;

  return PERMISSION_ACTIONS.includes(action)
    ? {
        sectionId,
        action,
      }
    : null;
};

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
    const roles = await this.repository.find({
      where: {
        ...(query.enabled !== undefined ? { enabled: query.enabled } : {}),
        ...(query.full_access !== undefined ? { full_access: query.full_access } : {}),
      },
    });

    const normalizedSearch = query.search?.trim().toLowerCase() ?? '';
    const filtered = normalizedSearch
      ? roles.filter((role) =>
          [role.id, role.name, role.full_access ? 'true' : 'false'].join(' ').toLowerCase().includes(normalizedSearch),
        )
      : roles;

    const order = query.order?.toString() ?? 'name';
    const sortDirection = query.direction === Direction.DESC ? -1 : 1;
    const compareNames = (left: Role, right: Role) =>
      left.name.localeCompare(right.name, undefined, {
        sensitivity: 'base',
      });
    const permissionSort = parsePermissionSort(order);

    const sorted = [...filtered].sort((left, right) => {
      if (order === 'id') return left.id.localeCompare(right.id) * sortDirection;
      if (permissionSort) {
        const leftValue = Number(hasRolePermission(left, permissionSort.sectionId, permissionSort.action));
        const rightValue = Number(hasRolePermission(right, permissionSort.sectionId, permissionSort.action));
        const permissionComparison = (leftValue - rightValue) * sortDirection;

        return permissionComparison || compareNames(left, right);
      }

      return compareNames(left, right) * sortDirection;
    });

    const size = Number.isFinite(query.size) && query.size > 0 ? query.size : sorted.length;
    const page = Number.isFinite(query.page) && query.page >= 0 ? query.page : 0;
    const start = page * size;
    const result = sorted.slice(start, start + size);
    const total = filtered.length;

    return { result, total };
  }

  async get({ id }: DefaultGetData) {
    const result = await this.repository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        created_by: true,
        updated_by: true,
        deleted_by: true,
      },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.role.notFound'));

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
    const result = await this.repository.findOne({
      where: { id },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.role.notFound'));

    return cleanColumns<Role>(result);
  }

  async remove({ id, userId }: RoleDeleteProps) {
    const role = await this.repository.findOne({
      where: {
        id,
        deleted_at: IsNull(),
        deleted_by: IsNull(),
      },
    });

    if (!role) throw new NotFoundException(this.i18n.t('errors.role.notFound'));

    if (role.full_access && role.enabled) {
      const remainingFullAccessRoles = await this.repository.count({
        where: {
          id: Not(id),
          full_access: true,
          enabled: true,
          deleted_at: IsNull(),
          deleted_by: IsNull(),
        },
      });

      if (!remainingFullAccessRoles) throw new ConflictException(this.i18n.t('errors.role.cannotDeleteLastFullAccess'));
    }

    const deleted_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, { deleted_by });
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
