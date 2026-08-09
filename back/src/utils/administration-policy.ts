import { Role } from 'src/modules/role/role.entity';
import { User } from 'src/modules/user/user.entity';
import { mergePermissions } from './helpers';

type PermissionMap = Record<string, string[]>;

const normalizePermissions = (permissions: Role['permissions'] | undefined): PermissionMap =>
  Object.fromEntries(
    Object.entries(permissions ?? {}).map(([moduleId, actions]) => [moduleId, Array.from(new Set(actions))]),
  );

const hasEveryPermission = (actorPermissions: PermissionMap, targetPermissions: PermissionMap): boolean =>
  Object.entries(targetPermissions).every(([moduleId, actions]) =>
    actions.every((action) => actorPermissions[moduleId]?.includes(action)),
  );

const countPermissions = (permissions: PermissionMap): number =>
  Object.values(permissions).reduce((total, actions) => total + actions.length, 0);

export const userHasFullAccess = (user: User): boolean =>
  (user.roles ?? []).some((role) => role.enabled && role.full_access);

export const hasSharedCongregation = (actor: User, target: User): boolean => {
  const actorCongregations = new Set((actor.congregations ?? []).map(({ id }) => id));
  return (target.congregations ?? []).some(({ id }) => actorCongregations.has(id));
};

export const isRoleAuthorityStrictlyLower = (actor: User, roles: Role[]): boolean => {
  const actorAuthority = mergePermissions((actor.roles ?? []).filter((role) => role.enabled));
  const targetAuthority = mergePermissions(roles.filter((role) => role.enabled));

  if (actorAuthority.fullAccess) return !targetAuthority.fullAccess;
  if (targetAuthority.fullAccess) return false;

  const actorPermissions = normalizePermissions(actorAuthority.permissions);
  const targetPermissions = normalizePermissions(targetAuthority.permissions);
  return (
    hasEveryPermission(actorPermissions, targetPermissions) &&
    countPermissions(targetPermissions) < countPermissions(actorPermissions)
  );
};

export const isRoleDefinitionStrictlyLower = (actor: User, role: Pick<Role, 'full_access' | 'permissions'>): boolean =>
  isRoleAuthorityStrictlyLower(actor, [{ ...role, enabled: true } as Role]);
