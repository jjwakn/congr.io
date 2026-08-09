import { compare } from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from 'src/config/security';
import {
  hasSharedCongregation,
  isRoleAuthorityStrictlyLower,
  isRoleDefinitionStrictlyLower,
  userHasFullAccess,
} from 'src/utils/administration-policy';
import { encryptPassword } from 'src/utils/helpers';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { In, IsNull, Repository } from 'typeorm';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotAcceptableException,
  NotFoundException,
  Optional,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';
import { Person } from '../person/person.entity';
import { Role } from '../role/role.entity';
import { SecurityAuditService } from '../security/security-audit.service';
import { SecurityAuditEvent } from '../security/security.types';
import { User } from './user.entity';
import {
  UserChangeOwnPasswordProps,
  UserCompleteTemporaryPasswordProps,
  UserCreateProps,
  UserDeleteProps,
  UserGetByIdProps,
  UserListProps,
  UserPreferencesProps,
  UserQuery,
  UserSetTemporaryPasswordProps,
  UserUpdateProps,
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

    @InjectRepository(Person)
    private personRepository: Repository<Person>,

    private readonly i18n: I18nService,

    @Optional()
    private readonly securityAudit?: SecurityAuditService,
  ) {}

  private ensurePasswordPolicy(password: string): void {
    if (password.length < MIN_PASSWORD_LENGTH)
      throw new BadRequestException(this.i18n.t('errors.user.passwordTooShort'));
    if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_LENGTH)
      throw new BadRequestException(this.i18n.t('errors.user.passwordTooLong'));
  }

  private ensurePasswordConfirmation(password: string, confirmation: string) {
    if (password !== confirmation)
      throw new BadRequestException(this.i18n.t('errors.user.passwordConfirmationMismatch'));
  }

  private async getExistingUser(id: string, includePassword = false) {
    const existing =
      includePassword && this.repository.createQueryBuilder
        ? await this.repository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .leftJoinAndSelect('user.roles', 'roles')
            .leftJoinAndSelect('user.congregations', 'congregations')
            .leftJoinAndSelect('user.locations', 'locations')
            .where('user.id = :id', { id })
            .andWhere('user.deleted_at IS NULL')
            .getOne()
        : await this.repository.findOne({
            where: { id, deleted_at: IsNull(), deleted_by: IsNull() },
            relations: { roles: true, congregations: true, locations: true },
          });

    if (!existing) throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    return existing;
  }

  private async getActor(userId: string): Promise<User> {
    const actor = await this.repository.findOne({
      where: { id: userId, enabled: true, deleted_at: IsNull(), deleted_by: IsNull() },
      relations: { roles: true, congregations: true, locations: true },
    });
    if (!actor) throw new ForbiddenException(this.i18n.t('errors.auth.unauthorized'));
    return actor;
  }

  private getAuthorizedCongregationIds(actor: User, congregationId?: string): string[] {
    const actorCongregationIds = (actor.congregations ?? []).map(({ id }) => id);
    if (!congregationId) return actorCongregationIds;
    if (!userHasFullAccess(actor) && !actorCongregationIds.includes(congregationId)) {
      throw new ForbiddenException(this.i18n.t('errors.user.outsideCongregation'));
    }
    return [congregationId];
  }

  private assertCanReadUser(actor: User, target: User, congregationId?: string): void {
    if (userHasFullAccess(actor)) return;
    if (!hasSharedCongregation(actor, target)) {
      throw new NotFoundException(this.i18n.t('errors.user.notFound'));
    }
    if (congregationId && !(target.congregations ?? []).some(({ id }) => id === congregationId)) {
      throw new NotFoundException(this.i18n.t('errors.user.notFound'));
    }
  }

  private assertCanManageUser(actor: User, target: User, congregationId?: string): void {
    this.assertCanReadUser(actor, target, congregationId);
    if (userHasFullAccess(actor)) return;
    if (!isRoleAuthorityStrictlyLower(actor, target.roles ?? [])) {
      throw new ForbiddenException(this.i18n.t('errors.user.higherAuthority'));
    }
  }

  async getPreferences(userId: string) {
    const user = await this.getExistingUser(userId);
    return user.preferences ?? {};
  }

  async updatePreferences({ data, userId }: UserPreferencesProps) {
    const user = await this.getExistingUser(userId);
    const pageSizes = Object.fromEntries(
      Object.entries(data.page_sizes ?? user.preferences?.page_sizes ?? {})
        .filter(([, value]) => Number.isInteger(value) && value >= 5 && value <= 500)
        .map(([key, value]) => [key, Number(value)]),
    );
    user.preferences = {
      ...(user.preferences ?? {}),
      ...(data.page_sizes ? { page_sizes: pageSizes } : {}),
      ...(data.sidebar_order ? { sidebar_order: Array.from(new Set(data.sidebar_order)) } : {}),
      ...(data.favorites ? { favorites: Array.from(new Set(data.favorites)).slice(0, 50) } : {}),
      ...(data.time_format ? { time_format: data.time_format } : {}),
      ...(data.column_visibility ? { column_visibility: data.column_visibility } : {}),
    };
    user.updated_by = user;
    await this.repository.save(user);
    return user.preferences;
  }

  private async mapRoles(roleIds: string[] = [], actor?: User) {
    const roles: Role[] = [];

    for (const id of roleIds) {
      const found = await this.roleRepository.findOne({
        where: { id, enabled: true, deleted_at: IsNull(), deleted_by: IsNull() },
      });
      if (!found)
        throw new NotAcceptableException(
          this.i18n.t('errors.role.notFoundWithId', {
            args: { id },
          }),
        );

      if (
        actor &&
        !userHasFullAccess(actor) &&
        (!isRoleDefinitionStrictlyLower(actor, found) ||
          (actor.roles ?? []).some(({ id: actorRoleId }) => actorRoleId === id))
      ) {
        throw new ForbiddenException(this.i18n.t('errors.user.higherAuthority'));
      }

      roles.push(found);
    }

    return roles;
  }

  private async mapCongregations(congregationIds: string[] = [], actor?: User) {
    const congregations: Congregation[] = [];

    for (const id of congregationIds) {
      const found = await this.congregationRepository.findOne({
        where: { id, enabled: true, deleted_at: IsNull(), deleted_by: IsNull() },
      });
      if (!found)
        throw new NotAcceptableException(
          this.i18n.t('errors.congregation.notFoundWithId', {
            args: { id },
          }),
        );

      if (
        actor &&
        !userHasFullAccess(actor) &&
        !(actor.congregations ?? []).some(({ id: actorId }) => actorId === id)
      ) {
        throw new ForbiddenException(this.i18n.t('errors.user.invalidRelationship'));
      }

      congregations.push(found);
    }

    return congregations;
  }

  private async mapLocations(locationIds: string[] = [], actor?: User) {
    const locations: Location[] = [];

    for (const id of locationIds) {
      const found = await this.locationRepository.findOne({
        where: { id, enabled: true, deleted_at: IsNull(), deleted_by: IsNull() },
      });
      if (!found)
        throw new NotAcceptableException(
          this.i18n.t('errors.location.notFoundWithId', {
            args: { id },
          }),
        );

      if (actor && !userHasFullAccess(actor) && !(actor.locations ?? []).some(({ id: actorId }) => actorId === id)) {
        throw new ForbiddenException(this.i18n.t('errors.user.invalidRelationship'));
      }

      locations.push(found);
    }

    return locations;
  }

  private async updatePersonLink({
    user,
    personId,
    updatedBy,
    actor,
  }: {
    user: User;
    personId?: string | null;
    updatedBy?: User | null;
    actor: User;
  }) {
    if (personId === undefined) return;

    const current = await this.personRepository.findOne({ where: { user_id: user.id } });
    if (!personId) {
      if (current) {
        current.user_id = null;
        current.user = null;
        current.updated_by = updatedBy;
        await this.personRepository.save(current);
      }
      return;
    }

    const next = await this.personRepository.findOne({ where: { id: personId } });
    if (!next) throw new NotFoundException(this.i18n.t('errors.person.notFound'));
    if (!userHasFullAccess(actor) && !(actor.congregations ?? []).some(({ id }) => id === next.congregation_id)) {
      throw new ForbiddenException(this.i18n.t('errors.user.invalidRelationship'));
    }
    if (next.user_id && next.user_id !== user.id)
      throw new NotAcceptableException(this.i18n.t('errors.person.userInUse'));
    const linked = await this.personRepository.findOne({ where: { user_id: user.id } });
    if (linked && linked.id !== next.id) {
      linked.user_id = null;
      linked.user = null;
      linked.updated_by = updatedBy;
      await this.personRepository.save(linked);
    }
    next.user_id = user.id;
    next.user = user;
    next.updated_by = updatedBy;
    await this.personRepository.save(next);
  }

  private async getVisibleUserIds(actor: User, congregationId?: string): Promise<string[] | null> {
    const scopeIds = this.getAuthorizedCongregationIds(actor, congregationId);
    if (userHasFullAccess(actor) && !congregationId) return null;
    if (!scopeIds.length) return [];

    const rows = await this.repository
      .createQueryBuilder('scoped_user')
      .innerJoin('scoped_user.congregations', 'scoped_congregation')
      .select('scoped_user.id', 'id')
      .where('scoped_congregation.id IN (:...scopeIds)', { scopeIds })
      .andWhere('scoped_user.deleted_at IS NULL')
      .getRawMany<{ id: string }>();
    return Array.from(new Set(rows.map(({ id }) => id)));
  }

  async list({ query, userId, congregationId }: UserListProps) {
    const actor = await this.getActor(userId);
    const visibleUserIds = await this.getVisibleUserIds(actor, congregationId);
    const { result, total } = await findWithFilters<User, UserQuery>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name', 'username'],
      allowedSearchFields: ['id', 'name', 'username'],
      booleanFields: ['enabled'],
      baseWhere: visibleUserIds ? { id: In(visibleUserIds), deleted_at: IsNull() } : { deleted_at: IsNull() },
    });
    const requestedColumns = new Set(
      (query.columns ?? '')
        .split(',')
        .map((column) => column.trim())
        .filter(Boolean),
    );
    const needsRoles = requestedColumns.has('roles');
    const needsPerson = requestedColumns.has('person');
    const ids = result.map((user) => user.id);
    const rolesByUserId = new Map<string, Role[]>();
    const personByUserId = new Map<string, Person>();

    if (ids.length && needsRoles) {
      const usersWithRoles = await this.repository.find({
        where: { id: In(ids) },
        relations: { roles: true },
      });
      usersWithRoles.forEach((user) =>
        rolesByUserId.set(
          user.id,
          user.roles.filter((role) => role.enabled),
        ),
      );
    }

    if (ids.length && needsPerson) {
      const authorizedCongregationIds = this.getAuthorizedCongregationIds(actor, congregationId);
      const people = await this.personRepository.find({
        where: {
          user_id: In(ids),
          ...(userHasFullAccess(actor) && !congregationId ? {} : { congregation_id: In(authorizedCongregationIds) }),
        },
      });
      people.forEach((person) => {
        if (person.user_id) personByUserId.set(person.user_id, person);
      });
    }

    return {
      result: result.map((user) => {
        const listedUser = user as User & { person?: Person | null };
        delete listedUser.password;
        if (needsRoles) listedUser.roles = rolesByUserId.get(listedUser.id) ?? [];
        if (needsPerson) listedUser.person = personByUserId.get(listedUser.id) ?? null;
        return listedUser;
      }),
      total,
    };
  }

  async get({ id, includePassword = false, userId, congregationId }: UserGetByIdProps) {
    const result = await this.repository.findOne({
      where: { id, deleted_at: IsNull(), deleted_by: IsNull() },
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

    const actor = userId ? await this.getActor(userId) : null;
    if (actor) {
      this.assertCanReadUser(actor, result, congregationId);
    }

    if (!includePassword) delete result.password;
    const authorizedCongregationIds = actor
      ? this.getAuthorizedCongregationIds(actor, congregationId)
      : congregationId
        ? [congregationId]
        : [];
    if (actor && (!userHasFullAccess(actor) || congregationId)) {
      const allowedCongregations = new Set(authorizedCongregationIds);
      const allowedLocations = new Set((actor.locations ?? []).map(({ id: locationId }) => locationId));
      result.congregations = result.congregations.filter(({ id: resultCongregationId }) =>
        allowedCongregations.has(resultCongregationId),
      );
      result.locations = result.locations.filter(({ id: locationId }) => allowedLocations.has(locationId));
    }
    const person = await this.personRepository.findOne({
      where: {
        user_id: result.id,
        ...(actor && (!userHasFullAccess(actor) || congregationId)
          ? { congregation_id: In(authorizedCongregationIds) }
          : congregationId
            ? { congregation_id: congregationId }
            : {}),
      },
    });
    return {
      ...cleanColumns<User>(result),
      roles: result.roles.filter((r) => r.enabled),
      person,
    };
  }

  async create({ data, userId, congregationId }: UserCreateProps) {
    const created_by = await this.getActor(userId);
    const hasPersonId = data.person_id !== undefined;
    const personId = data.person_id;

    const exists = await this.repository.findOne({
      where: { username: data.username.trim() },
    });
    if (exists)
      throw new NotAcceptableException(
        this.i18n.t('errors.user.usernameExistsWithValue', {
          args: { username: data.username },
        }),
      );

    this.ensurePasswordPolicy(data.password);
    const defaultCongregationIds = this.getAuthorizedCongregationIds(created_by, congregationId);
    const [roles, congregations, locations] = await Promise.all([
      this.mapRoles(data.roles_ids ?? [], created_by),
      this.mapCongregations(data.congregations_ids ?? defaultCongregationIds, created_by),
      this.mapLocations(data.locations_ids ?? [], created_by),
    ]);
    if (!userHasFullAccess(created_by) && !isRoleAuthorityStrictlyLower(created_by, roles)) {
      throw new ForbiddenException(this.i18n.t('errors.user.higherAuthority'));
    }

    const created = this.repository.create({
      username: data.username.trim(),
      name: data.name.trim(),
      password: await encryptPassword(data.password),
      password_change_required: false,
      session_version: 0,
      roles,
      congregations,
      locations,
      created_by,
    });
    const result = await this.repository.save(created);
    if (hasPersonId) await this.updatePersonLink({ user: result, personId, updatedBy: created_by, actor: created_by });

    this.securityAudit?.record(SecurityAuditEvent.userChanged, {
      action: 'created',
      actor_id: created_by.id,
      user_id: result.id,
    });
    delete result.password;
    return cleanColumns<User>(result);
  }

  async update({ id, data, userId, congregationId }: UserUpdateProps) {
    const hasPersonId = data.person_id !== undefined;
    const personId = data.person_id;
    const [updated_by, existing] = await Promise.all([this.getActor(userId), this.getExistingUser(id)]);
    const isSelfUpdate = id === userId;

    if (isSelfUpdate) {
      const restrictedFields = ['username', 'enabled', 'roles_ids', 'congregations_ids', 'locations_ids', 'person_id'];
      const hasRestrictedField = restrictedFields.some((field) => field in data) || hasPersonId;

      if (hasRestrictedField) throw new ForbiddenException(this.i18n.t('errors.user.selfUpdateRestricted'));

      existing.updated_by = updated_by;
      if (data.name) existing.name = data.name.trim();

      const result = await this.repository.save(existing);
      delete result.password;
      return cleanColumns<User>(result);
    }

    this.assertCanManageUser(updated_by, existing, congregationId);

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

    if (data.roles_ids) {
      existing.roles = await this.mapRoles(data.roles_ids, updated_by);
      if (!userHasFullAccess(updated_by) && !isRoleAuthorityStrictlyLower(updated_by, existing.roles)) {
        throw new ForbiddenException(this.i18n.t('errors.user.higherAuthority'));
      }
    }

    if (data.congregations_ids) {
      existing.congregations = await this.mapCongregations(data.congregations_ids, updated_by);
    }

    if (data.locations_ids) {
      existing.locations = await this.mapLocations(data.locations_ids, updated_by);
    }

    existing.updated_by = updated_by;

    if (data.username) existing.username = data.username.trim();
    if (data.name) existing.name = data.name.trim();
    if (data.enabled !== undefined) existing.enabled = data.enabled;
    existing.session_version = (existing.session_version ?? 0) + 1;

    const result = await this.repository.save(existing);
    if (hasPersonId) await this.updatePersonLink({ user: result, personId, updatedBy: updated_by, actor: updated_by });

    this.securityAudit?.record(SecurityAuditEvent.userChanged, {
      action: 'updated',
      actor_id: updated_by.id,
      user_id: result.id,
      relationships_changed: Boolean(data.roles_ids || data.congregations_ids || data.locations_ids || hasPersonId),
    });
    delete result.password;
    return cleanColumns<User>(result);
  }

  async remove({ id, userId, congregationId }: UserDeleteProps) {
    if (id === userId) throw new ForbiddenException(this.i18n.t('errors.user.cannotDeleteSelf'));

    const [deleted_by, target] = await Promise.all([this.getActor(userId), this.getExistingUser(id)]);
    this.assertCanManageUser(deleted_by, target, congregationId);

    await this.repository.update(id, { deleted_by, session_version: () => '"session_version" + 1' });
    await this.repository.softDelete(id);
    this.securityAudit?.record(SecurityAuditEvent.userChanged, {
      action: 'deleted',
      actor_id: deleted_by.id,
      user_id: id,
    });
    return { deleted: true };
  }

  async changeOwnPassword({ data, userId }: UserChangeOwnPasswordProps) {
    this.ensurePasswordConfirmation(data.password, data.password_confirmation);
    this.ensurePasswordPolicy(data.password);

    const existing = await this.getExistingUser(userId, true);
    const updated_by = existing;
    const isCurrentPasswordValid = await compare(data.current_password, existing.password ?? '');

    if (!isCurrentPasswordValid) throw new UnauthorizedException(this.i18n.t('errors.user.currentPasswordInvalid'));

    const isNewPasswordSame = await compare(data.password, existing.password ?? '');

    if (isNewPasswordSame) throw new BadRequestException(this.i18n.t('errors.user.newPasswordMustBeDifferent'));

    existing.password = await encryptPassword(data.password);
    existing.password_change_required = false;
    existing.failed_login_attempts = 0;
    existing.locked_at = null;
    existing.session_version = (existing.session_version ?? 0) + 1;
    existing.updated_by = updated_by;

    const result = await this.repository.save(existing);

    this.securityAudit?.record(SecurityAuditEvent.passwordChanged, { user_id: existing.id });
    delete result.password;
    return cleanColumns<User>(result);
  }

  async completeTemporaryPassword({ data, userId }: UserCompleteTemporaryPasswordProps) {
    this.ensurePasswordConfirmation(data.password, data.password_confirmation);
    this.ensurePasswordPolicy(data.password);

    const existing = await this.getExistingUser(userId, true);
    const updated_by = existing;

    if (!existing.password_change_required)
      throw new BadRequestException(this.i18n.t('errors.user.passwordChangeNotRequired'));

    const isNewPasswordSame = await compare(data.password, existing.password ?? '');

    if (isNewPasswordSame) throw new BadRequestException(this.i18n.t('errors.user.newPasswordMustBeDifferent'));

    existing.password = await encryptPassword(data.password);
    existing.password_change_required = false;
    existing.failed_login_attempts = 0;
    existing.locked_at = null;
    existing.session_version = (existing.session_version ?? 0) + 1;
    existing.updated_by = updated_by;

    const result = await this.repository.save(existing);

    this.securityAudit?.record(SecurityAuditEvent.passwordChanged, {
      user_id: existing.id,
      temporary_completed: true,
    });
    delete result.password;
    return cleanColumns<User>(result);
  }

  async setTemporaryPassword({ id, data, userId, congregationId }: UserSetTemporaryPasswordProps) {
    if (id === userId) throw new ForbiddenException(this.i18n.t('errors.user.cannotSetTemporaryPasswordForSelf'));

    this.ensurePasswordConfirmation(data.password, data.password_confirmation);
    this.ensurePasswordPolicy(data.password);

    const [existing, updated_by] = await Promise.all([this.getExistingUser(id), this.getActor(userId)]);
    this.assertCanManageUser(updated_by, existing, congregationId);

    existing.password = await encryptPassword(data.password);
    existing.password_change_required = true;
    existing.failed_login_attempts = 0;
    existing.locked_at = null;
    existing.session_version = (existing.session_version ?? 0) + 1;
    existing.updated_by = updated_by;

    const result = await this.repository.save(existing);

    this.securityAudit?.record(SecurityAuditEvent.passwordReset, {
      actor_id: updated_by.id,
      user_id: existing.id,
    });
    delete result.password;
    return cleanColumns<User>(result);
  }
}
