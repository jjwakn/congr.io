import { I18nService } from 'nestjs-i18n';
import { DefaultGetData, Direction } from 'src/common/common.types';
import { MAX_PAGE_SIZE } from 'src/config/security';
import { isRoleDefinitionStrictlyLower, userHasFullAccess } from 'src/utils/administration-policy';
import { Module, ModuleAction } from 'src/utils/constants';
import { cleanColumns } from 'src/utils/query';
import { IsNull, Not, Repository } from 'typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SecurityAuditService } from '../security/security-audit.service';
import { SecurityAuditEvent } from '../security/security.types';
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

    @Optional()
    private readonly securityAudit?: SecurityAuditService,
  ) {}

  private async getActor(userId: string): Promise<User> {
    const actor = await this.userRepository.findOne({
      where: { id: userId, enabled: true, deleted_at: IsNull(), deleted_by: IsNull() },
      relations: { roles: true, congregations: true },
    });
    if (!actor) throw new ForbiddenException(this.i18n.t('errors.auth.unauthorized'));
    return actor;
  }

  private normalizePermissions(permissions: Role['permissions'] | undefined): Role['permissions'] {
    const validModules = new Set(Object.values(Module));
    const entries = Object.entries(permissions ?? {});
    const isInvalid = entries.some(
      ([moduleId, actions]) =>
        !validModules.has(moduleId as Module) ||
        !Array.isArray(actions) ||
        actions.some((action) => typeof action !== 'string' || !PERMISSION_ACTIONS.includes(action as ModuleAction)),
    );
    if (isInvalid) throw new BadRequestException(this.i18n.t('errors.role.invalidPermissions'));

    return Object.fromEntries(entries.map(([moduleId, actions]) => [moduleId, Array.from(new Set(actions))]));
  }

  private assertCanManageRole(actor: User, role: Role): void {
    if (userHasFullAccess(actor)) return;
    if ((actor.roles ?? []).some(({ id }) => id === role.id) || !isRoleDefinitionStrictlyLower(actor, role)) {
      throw new ForbiddenException(this.i18n.t('errors.role.higherAuthority'));
    }
  }

  private async revokeRoleSessions(roleId: string): Promise<void> {
    if (!this.userRepository.createQueryBuilder) return;
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ session_version: () => '"session_version" + 1' })
      .where('id IN (SELECT "user_id" FROM "user_role" WHERE "role_id" = :roleId)', { roleId })
      .execute();
  }

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

    const size = Number.isFinite(query.size) && query.size > 0 ? Math.min(query.size, MAX_PAGE_SIZE) : 50;
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
    const created_by = await this.getActor(userId);
    const permissions = this.normalizePermissions(data.permissions);
    if (data.full_access && !userHasFullAccess(created_by)) {
      throw new ForbiddenException(this.i18n.t('errors.role.higherAuthority'));
    }
    const fullAccess = Boolean(data.full_access);
    if (
      !userHasFullAccess(created_by) &&
      !isRoleDefinitionStrictlyLower(created_by, { permissions, full_access: false })
    ) {
      throw new ForbiddenException(this.i18n.t('errors.role.higherAuthority'));
    }

    const created = this.repository.create({
      name: data.name.trim(),
      permissions,
      full_access: fullAccess,
      created_by,
    });
    const result = await this.repository.save(created);
    this.securityAudit?.record(SecurityAuditEvent.roleChanged, {
      action: 'created',
      actor_id: created_by.id,
      role_id: result.id,
      full_access: result.full_access,
    });
    return result;
  }

  async update({ id, data, userId }: RoleUpdateProps) {
    const [updated_by, existing] = await Promise.all([
      this.getActor(userId),
      this.repository.findOne({ where: { id, deleted_at: IsNull(), deleted_by: IsNull() } }),
    ]);
    if (!existing) throw new NotFoundException(this.i18n.t('errors.role.notFound'));
    this.assertCanManageRole(updated_by, existing);

    const nextRole = {
      ...existing,
      name: data.name?.trim() || existing.name,
      permissions: data.permissions ? this.normalizePermissions(data.permissions) : existing.permissions,
      full_access: data.full_access === undefined ? existing.full_access : Boolean(data.full_access),
      enabled: data.enabled === undefined ? existing.enabled : Boolean(data.enabled),
    };
    if (!userHasFullAccess(updated_by) && !isRoleDefinitionStrictlyLower(updated_by, nextRole)) {
      throw new ForbiddenException(this.i18n.t('errors.role.higherAuthority'));
    }
    if (existing.full_access && existing.enabled && (!nextRole.full_access || !nextRole.enabled)) {
      const remainingFullAccessRoles = await this.repository.count({
        where: {
          id: Not(id),
          full_access: true,
          enabled: true,
          deleted_at: IsNull(),
          deleted_by: IsNull(),
        },
      });
      if (!remainingFullAccessRoles) {
        throw new ConflictException(this.i18n.t('errors.role.cannotDeleteLastFullAccess'));
      }
    }

    await this.repository.update(id, {
      name: nextRole.name,
      permissions: nextRole.permissions,
      full_access: nextRole.full_access,
      enabled: nextRole.enabled,
      updated_by,
    });
    await this.revokeRoleSessions(id);
    this.securityAudit?.record(SecurityAuditEvent.roleChanged, {
      action: 'updated',
      actor_id: updated_by.id,
      role_id: id,
      full_access: nextRole.full_access,
      enabled: nextRole.enabled,
    });
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

    const actor = await this.getActor(userId);
    this.assertCanManageRole(actor, role);

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

    const deleted_by = actor;

    await this.repository.update(id, { deleted_by });
    await this.repository.softDelete(id);
    await this.revokeRoleSessions(id);
    this.securityAudit?.record(SecurityAuditEvent.roleChanged, {
      action: 'deleted',
      actor_id: actor.id,
      role_id: id,
    });
    return { deleted: true };
  }
}
