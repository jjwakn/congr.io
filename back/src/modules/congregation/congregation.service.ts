import { I18nService } from 'nestjs-i18n';
import { Feature, FeatureTree } from 'src/utils/constants';
import { isValidTimeZone, normalizeTimeZone } from 'src/utils/datetime';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Congregation } from './congregation.entity';
import {
  CongregationCreateProps,
  CongregationDeleteProps,
  CongregationDeletionPreview,
  CongregationGetProps,
  CongregationListProps,
  CongregationQuery,
  CongregationUpdateProps,
} from './congregation.types';

@Injectable()
export class CongregationService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Congregation)
    private repository: Repository<Congregation>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly i18n: I18nService,
  ) {}

  private normalizeFeatures(features?: Feature[]): Feature[] {
    const selected = new Set(features ?? []);
    Object.entries(FeatureTree).forEach(([feature, config]) => {
      if (config.required) selected.add(feature as Feature);
    });

    let addedPrerequisite = true;
    while (addedPrerequisite) {
      addedPrerequisite = false;
      Array.from(selected).forEach((feature) => {
        (FeatureTree[feature]?.prerequisites ?? []).forEach((prerequisite) => {
          if (selected.has(prerequisite)) return;
          selected.add(prerequisite);
          addedPrerequisite = true;
        });
      });
    }

    return Object.values(Feature).filter((feature) => selected.has(feature));
  }

  private async getUserWithCongregations(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
      relations: { congregations: true },
    });
    if (!user) throw new NotFoundException(this.i18n.t('errors.user.notFound'));
    return user;
  }

  private async assertUserCongregation(userId: string, congregationId: string) {
    const user = await this.getUserWithCongregations(userId);
    if (!user.congregations?.some(({ id }) => id === congregationId))
      throw new NotFoundException(this.i18n.t('errors.congregation.notFound'));
    return user;
  }

  async list({ query, userId }: CongregationListProps) {
    const user = await this.getUserWithCongregations(userId);
    const congregationIds = user.congregations?.map(({ id }) => id) ?? [];
    if (!congregationIds.length) return { result: [], total: 0 };

    const { result, total } = await findWithFilters<Congregation, CongregationQuery>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name', 'type'],
      booleanFields: ['enabled'],
      baseWhere: { id: In(congregationIds), deleted_at: IsNull() },
    });

    return {
      result,
      total,
    };
  }

  async get({ id, userId }: CongregationGetProps) {
    await this.assertUserCongregation(userId, id);
    const result = await this.repository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        created_by: true,
        updated_by: true,
        deleted_by: true,
        locations: {
          created_by: true,
          updated_by: true,
          deleted_by: true,
        },
      },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.congregation.notFound'));

    return cleanColumns<Congregation>(result);
  }

  async create({ data, userId }: CongregationCreateProps) {
    if (data.timezone && !isValidTimeZone(data.timezone.trim()))
      throw new BadRequestException(this.i18n.t('errors.congregation.invalidTimezone'));

    const created_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
      relations: { congregations: true },
    });

    if (!created_by) throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    const created = this.repository.create({
      ...data,
      timezone: normalizeTimeZone(data.timezone),
      features: this.normalizeFeatures(data.features),
      created_by,
    });
    const result = await this.repository.save(created);
    created_by.congregations = [...(created_by.congregations ?? []), result];
    await this.userRepository.save(created_by);
    return result;
  }

  async update({ id, data, userId }: CongregationUpdateProps) {
    await this.assertUserCongregation(userId, id);
    if (data.timezone && !isValidTimeZone(data.timezone.trim()))
      throw new BadRequestException(this.i18n.t('errors.congregation.invalidTimezone'));

    const updated_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, {
      ...data,
      ...(data.timezone ? { timezone: normalizeTimeZone(data.timezone) } : {}),
      ...(data.features ? { features: this.normalizeFeatures(data.features) } : {}),
      updated_by,
    });
    const result = await this.repository.findOne({
      where: { id },
      relations: { locations: true },
    });
    if (!result) throw new NotFoundException(this.i18n.t('errors.congregation.notFound'));
    return cleanColumns<Congregation>(result);
  }

  private async getDeletionData(manager: EntityManager, congregationId: string) {
    const userRows = await manager.query<Array<{ user_id: string }>>(
      'SELECT "uc"."user_id" FROM "user_congregation" "uc" INNER JOIN "user" "u" ON "u"."id" = "uc"."user_id" AND "u"."deleted_at" IS NULL WHERE "uc"."congregation_id" = $1',
      [congregationId],
    );
    const userIds = userRows.map(({ user_id }) => user_id);
    const userCountRows = userIds.length
      ? await manager.query<Array<{ user_id: string; count: number }>>(
          'SELECT "uc"."user_id", COUNT(*)::int AS "count" FROM "user_congregation" "uc" INNER JOIN "congregation" "c" ON "c"."id" = "uc"."congregation_id" AND "c"."deleted_at" IS NULL WHERE "uc"."user_id" = ANY($1::uuid[]) GROUP BY "uc"."user_id"',
          [userIds],
        )
      : [];
    const userCounts = new Map(userCountRows.map(({ user_id, count }) => [user_id, Number(count)]));

    const locationRows = await manager.query<Array<{ congregation_location_id: string }>>(
      'SELECT "cl"."congregation_location_id" FROM "congregation_location" "cl" INNER JOIN "location" "l" ON "l"."id" = "cl"."congregation_location_id" AND "l"."deleted_at" IS NULL WHERE "cl"."congregation_id" = $1',
      [congregationId],
    );
    const locationIds = locationRows.map(({ congregation_location_id }) => congregation_location_id);
    const locationCountRows = locationIds.length
      ? await manager.query<Array<{ congregation_location_id: string; count: number }>>(
          'SELECT "cl"."congregation_location_id", COUNT(*)::int AS "count" FROM "congregation_location" "cl" INNER JOIN "congregation" "c" ON "c"."id" = "cl"."congregation_id" AND "c"."deleted_at" IS NULL WHERE "cl"."congregation_location_id" = ANY($1::uuid[]) GROUP BY "cl"."congregation_location_id"',
          [locationIds],
        )
      : [];
    const locationCounts = new Map(
      locationCountRows.map(({ congregation_location_id, count }) => [congregation_location_id, Number(count)]),
    );

    const processRows = await manager.query<Array<{ id: string }>>(
      'SELECT "id" FROM "process" WHERE "congregation_id" = $1 AND "deleted_at" IS NULL',
      [congregationId],
    );
    const processIds = processRows.map(({ id }) => id);
    const count = async (table: string, column: string, value: string) => {
      const rows = await manager.query<Array<{ count: number }>>(
        `SELECT COUNT(*)::int AS "count" FROM "${table}" WHERE "${column}" = $1 AND "deleted_at" IS NULL`,
        [value],
      );
      return Number(rows[0]?.count ?? 0);
    };
    const [events, eventTypes, processSteps, configurations] = await Promise.all([
      count('event', 'congregation_id', congregationId),
      count('event_type', 'congregation_id', congregationId),
      processIds.length
        ? manager
            .query<
              Array<{ count: number }>
            >('SELECT COUNT(*)::int AS "count" FROM "process_step" WHERE "process_id" = ANY($1::uuid[]) AND "deleted_at" IS NULL', [processIds])
            .then((rows) => Number(rows[0]?.count ?? 0))
        : Promise.resolve(0),
      count('congregation_config', 'congregation_id', congregationId),
    ]);

    const exclusiveUserIds = userIds.filter((id) => (userCounts.get(id) ?? 0) <= 1);
    const sharedUserIds = userIds.filter((id) => (userCounts.get(id) ?? 0) > 1);
    const exclusiveLocationIds = locationIds.filter((id) => (locationCounts.get(id) ?? 0) <= 1);
    const sharedLocationIds = locationIds.filter((id) => (locationCounts.get(id) ?? 0) > 1);
    const preview: CongregationDeletionPreview = {
      usersDeleted: exclusiveUserIds.length,
      usersDetached: sharedUserIds.length,
      locationsDeleted: exclusiveLocationIds.length,
      locationsDetached: sharedLocationIds.length,
      events,
      eventTypes,
      processes: processIds.length,
      processSteps,
      configurations,
    };

    return { preview, exclusiveUserIds, exclusiveLocationIds, processIds };
  }

  async getDeletionPreview({ id, userId }: CongregationDeleteProps): Promise<CongregationDeletionPreview> {
    await this.assertUserCongregation(userId, id);
    return (await this.getDeletionData(this.dataSource.manager, id)).preview;
  }

  async remove({ id, userId }: CongregationDeleteProps) {
    await this.assertUserCongregation(userId, id);
    return this.dataSource.transaction(async (manager) => {
      const congregationRepository = manager.getRepository(Congregation);
      const { preview, exclusiveUserIds, exclusiveLocationIds, processIds } = await this.getDeletionData(manager, id);
      const softDeleteBy = async (table: string, column: string, value: string | string[]) => {
        const isList = Array.isArray(value);
        await manager.query(
          `UPDATE "${table}" SET "deleted_at" = CURRENT_TIMESTAMP, "deleted_by" = $2 WHERE "${column}" ${isList ? '= ANY($1::uuid[])' : '= $1'} AND "deleted_at" IS NULL`,
          [value, userId],
        );
      };

      await softDeleteBy('event', 'congregation_id', id);
      await softDeleteBy('event_type', 'congregation_id', id);

      if (processIds.length) {
        await softDeleteBy('process_step', 'process_id', processIds);
      }
      await softDeleteBy('process', 'congregation_id', id);
      await softDeleteBy('congregation_config', 'congregation_id', id);

      await manager.query('DELETE FROM "user_congregation" WHERE "congregation_id" = $1', [id]);
      await manager.query('DELETE FROM "congregation_location" WHERE "congregation_id" = $1', [id]);

      if (exclusiveUserIds.length) {
        await softDeleteBy('user', 'id', exclusiveUserIds);
      }
      if (exclusiveLocationIds.length) {
        await manager.query('DELETE FROM "user_location" WHERE "location_id" = ANY($1::uuid[])', [
          exclusiveLocationIds,
        ]);
        await softDeleteBy('location', 'id', exclusiveLocationIds);
      }

      await congregationRepository.update(id, { deleted_by: { id: userId } });
      await congregationRepository.softDelete(id);
      return { deleted: true, preview };
    });
  }
}
