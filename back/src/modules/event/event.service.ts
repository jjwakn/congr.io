import { I18nService } from 'nestjs-i18n';
import { randomUUID } from 'node:crypto';
import { Direction } from 'src/common/common.types';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { Brackets, In, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getUserCongregationContext } from '../../utils/congregation-context';
import { Feature } from '../../utils/constants';
import { parseDateTimeInTimeZone } from '../../utils/datetime';
import { Congregation } from '../congregation/congregation.entity';
import { EventParticipant } from '../event-participant/event-participant.entity';
import { EventType } from '../event-type/event-type.entity';
import type { EventTypeCustomField } from '../event-type/event-type.types';
import { FilesService } from '../files/files.service';
import { PersonField } from '../person-field/person-field.entity';
import { User } from '../user/user.entity';
import { Event } from './event.entity';
import {
  EventCreateProps,
  EventDeleteProps,
  EventDto,
  EventGetProps,
  EventListProps,
  EventParticipantFilter,
  EventQuery,
  EventUpdateProps,
} from './event.types';

export interface HydratableEvent extends Omit<Event, 'type'> {
  type?: EventType | null;
}

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,

    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,

    @InjectRepository(EventParticipant)
    private readonly eventParticipantRepository: Repository<EventParticipant>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(PersonField)
    private readonly personFieldRepository: Repository<PersonField>,

    @InjectRepository(Congregation)
    private readonly congregationRepository: Repository<Congregation>,

    private readonly filesService: FilesService,

    private readonly i18n: I18nService,
  ) {}

  private async getContext(userId: string, congregationId?: string) {
    return getUserCongregationContext({
      userId,
      congregationId,
      userRepository: this.userRepository,
      congregationRepository: this.congregationRepository,
      i18n: this.i18n,
    });
  }

  private normalizeEvent(data: EventDto) {
    return {
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      type_id: data.type_id,
      enabled: data.enabled ?? true,
      all_day: data.all_day ?? false,
      is_public: data.is_public ?? false,
      image_file_id: data.image_file_id ?? null,
      image_url: data.image_url?.trim() || null,
      attendance_enabled: data.attendance_enabled ?? false,
      self_registration_enabled: data.self_registration_enabled ?? false,
      custom_fields: data.custom_fields ?? [],
      save_attendance_date: data.save_attendance_date ?? false,
      attendance_date_person_field_id: data.attendance_date_person_field_id ?? null,
    };
  }

  private parseEventDateTimes({
    startDateTime,
    endDateTime,
    timeZone,
  }: {
    startDateTime: string;
    endDateTime: string;
    timeZone: string;
  }): {
    start_datetime: Date;
    end_datetime: Date;
  } {
    const parsedStart = parseDateTimeInTimeZone({
      value: startDateTime,
      timeZone,
    });
    const parsedEnd = parseDateTimeInTimeZone({
      value: endDateTime,
      timeZone,
    });

    if (!parsedStart.isValid || !parsedEnd.isValid)
      throw new BadRequestException(this.i18n.t('errors.event.invalidDateTime'));

    if (parsedEnd.toMillis() <= parsedStart.toMillis())
      throw new BadRequestException(this.i18n.t('errors.event.invalidDateRange'));

    return {
      start_datetime: parsedStart.toUTC().toJSDate(),
      end_datetime: parsedEnd.toUTC().toJSDate(),
    };
  }

  private async resolveEventTypeOrThrow({
    id,
    congregationId,
  }: {
    id: string;
    congregationId: string;
  }): Promise<EventType> {
    const eventType = await this.eventTypeRepository.findOne({
      where: {
        id,
        congregation_id: congregationId,
        deleted_at: IsNull(),
        deleted_by: IsNull(),
      },
    });

    if (!eventType) throw new NotFoundException(this.i18n.t('errors.eventType.notFound'));
    return eventType;
  }

  private async hydrateLinkedFieldOptions({
    customFields,
    congregationId,
  }: {
    customFields: EventTypeCustomField[];
    congregationId: string;
  }): Promise<EventTypeCustomField[]> {
    const personFieldIds = Array.from(
      new Set(
        customFields
          .filter(
            (field): field is EventTypeCustomField & { person_field_id: string } =>
              field.link_person_field && field.type === 'options' && Boolean(field.person_field_id),
          )
          .map((field) => field.person_field_id),
      ),
    );

    if (!personFieldIds.length) return customFields;

    const personFields = await this.personFieldRepository.find({
      where: {
        id: In(personFieldIds),
        congregation_id: congregationId,
        type: 'options',
        deleted_at: IsNull(),
      },
    });
    const personFieldById = new Map(personFields.map((personField) => [personField.id, personField]));

    return customFields.map((field) => {
      const personField = field.person_field_id ? personFieldById.get(field.person_field_id) : undefined;
      if (!personField) return field;

      return {
        ...field,
        options: personField.options,
        allow_multiple: personField.allow_multiple,
      };
    });
  }

  private async hydrateEvent(event: HydratableEvent, congregationId: string): Promise<HydratableEvent> {
    return {
      ...event,
      custom_fields: await this.hydrateLinkedFieldOptions({
        customFields: event.custom_fields ?? [],
        congregationId,
      }),
      type: event.type
        ? {
            ...event.type,
            custom_fields: await this.hydrateLinkedFieldOptions({
              customFields: event.type.custom_fields ?? [],
              congregationId,
            }),
          }
        : event.type,
    };
  }

  private async loadEventOrThrow({ id, congregationId }: { id: string; congregationId: string }) {
    const result = await this.repository.findOne({
      where: {
        id,
        congregation_id: congregationId,
      },
      withDeleted: true,
      relations: {
        created_by: true,
        updated_by: true,
        deleted_by: true,
        type: true,
      },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.event.notFound'));

    return this.hydrateEvent(cleanColumns<Event>(result), congregationId);
  }

  async list({ query, userId, congregationId, canViewAll = false }: EventListProps) {
    const { congregation } = await this.getContext(userId, congregationId);

    const size = Number.isFinite(Number(query.size)) && Number(query.size) > 0 ? Number(query.size) : 50;
    const page = Number.isFinite(Number(query.page)) && Number(query.page) >= 0 ? Number(query.page) : 0;
    const direction = query.direction === Direction.ASC ? Direction.ASC : Direction.DESC;
    const orderMap: Record<string, string> = {
      id: 'event.id',
      enabled: 'event.enabled',
      name: 'event.name',
      event_type_id: 'event.event_type_id',
      start_datetime: 'event.start_datetime',
      end_datetime: 'event.end_datetime',
      all_day: 'event.all_day',
      is_public: 'event.is_public',
      attendance_enabled: 'event.attendance_enabled',
      self_registration_enabled: 'event.self_registration_enabled',
      created_at: 'event.created_at',
      updated_at: 'event.updated_at',
      deleted_at: 'event.deleted_at',
    };
    const orderBy = orderMap[query.order] ?? orderMap.start_datetime;
    const participantAlias = this.eventParticipantRepository.metadata.tableName;
    const registrationExists = `EXISTS (
      SELECT 1 FROM "${participantAlias}" "participant"
      WHERE "participant"."event_id" = "event"."id"
      AND "participant"."deleted_at" IS NULL
    )`;
    const attendanceExists = `EXISTS (
      SELECT 1 FROM "${participantAlias}" "participant"
      WHERE "participant"."event_id" = "event"."id"
      AND "participant"."deleted_at" IS NULL
      AND "participant"."attended" = TRUE
    )`;

    const builder = this.repository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.type', 'type')
      .where('"event"."congregation_id" = :congregationId', { congregationId: congregation.id })
      .andWhere('"event"."deleted_at" IS NULL')
      .andWhere('"event"."deleted_by" IS NULL');

    if (!canViewAll) builder.andWhere('"event"."is_public" = TRUE');
    if (query.start) builder.andWhere('"event"."end_datetime" > :start', { start: new Date(query.start) });
    if (query.end) builder.andWhere('"event"."start_datetime" < :end', { end: new Date(query.end) });
    if (query.start_datetime_from)
      builder.andWhere('"event"."start_datetime" > :startDateTimeFrom', {
        startDateTimeFrom: new Date(query.start_datetime_from),
      });
    if (query.start_datetime_to)
      builder.andWhere('"event"."start_datetime" < :startDateTimeTo', {
        startDateTimeTo: new Date(query.start_datetime_to),
      });
    if (query.end_datetime_from)
      builder.andWhere('"event"."end_datetime" > :endDateTimeFrom', {
        endDateTimeFrom: new Date(query.end_datetime_from),
      });
    if (query.end_datetime_to)
      builder.andWhere('"event"."end_datetime" < :endDateTimeTo', { endDateTimeTo: new Date(query.end_datetime_to) });

    if (query.enabled !== undefined) builder.andWhere('"event"."enabled" = :enabled', { enabled: query.enabled });
    if (query.all_day !== undefined) builder.andWhere('"event"."all_day" = :allDay', { allDay: query.all_day });
    if (query.is_public !== undefined)
      builder.andWhere('"event"."is_public" = :isPublic', { isPublic: query.is_public });
    if (query.attendance_enabled !== undefined)
      builder.andWhere('"event"."attendance_enabled" = :attendanceEnabled', {
        attendanceEnabled: query.attendance_enabled,
      });
    if (query.self_registration_enabled !== undefined)
      builder.andWhere('"event"."self_registration_enabled" = :selfRegistrationEnabled', {
        selfRegistrationEnabled: query.self_registration_enabled,
      });

    if (query.participant_filter === EventParticipantFilter.with_registration) builder.andWhere(registrationExists);
    if (query.participant_filter === EventParticipantFilter.without_registration)
      builder.andWhere(`NOT ${registrationExists}`);
    if (query.participant_filter === EventParticipantFilter.with_attendance) builder.andWhere(attendanceExists);
    if (query.participant_filter === EventParticipantFilter.without_attendance)
      builder.andWhere(`NOT ${attendanceExists}`);

    const searchTerms = (query.search?.trim() ?? '').split(/\s+/).filter(Boolean);
    searchTerms.forEach((term, index) => {
      const parameterName = `eventSearch${index}`;
      builder.andWhere(
        new Brackets((searchBuilder) => {
          searchBuilder
            .where(`LOWER(CAST("event"."id" AS text)) LIKE :${parameterName} ESCAPE '\\'`)
            .orWhere(`LOWER("event"."name") LIKE :${parameterName} ESCAPE '\\'`)
            .orWhere(`LOWER("event"."description") LIKE :${parameterName} ESCAPE '\\'`)
            .orWhere(`LOWER("type"."name") LIKE :${parameterName} ESCAPE '\\'`)
            .orWhere(
              `LOWER(TO_CHAR("event"."start_datetime", 'YYYY-MM-DD HH24:MI')) LIKE :${parameterName} ESCAPE '\\'`,
            )
            .orWhere(`LOWER(TO_CHAR("event"."end_datetime", 'YYYY-MM-DD HH24:MI')) LIKE :${parameterName} ESCAPE '\\'`);
        }),
        { [parameterName]: `%${escapeLikePattern(term.toLowerCase())}%` },
      );
    });

    const [events, total] = await builder
      .orderBy(orderBy, direction)
      .skip(page * size)
      .take(size)
      .getManyAndCount();

    return {
      result: await Promise.all(events.map((event) => this.hydrateEvent(event, congregation.id))),
      total,
    };
  }

  async get({ id, userId, congregationId, canViewAll = false }: EventGetProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    const event = await this.loadEventOrThrow({ id, congregationId: congregation.id });
    if (!canViewAll && !event.is_public) throw new ForbiddenException(this.i18n.t('errors.auth.unauthorized'));
    return event;
  }

  async create({ data, userId, congregationId }: EventCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const normalized = this.normalizeEvent(data);
    const dateTimes = this.parseEventDateTimes({
      startDateTime: data.start_datetime,
      endDateTime: data.end_datetime,
      timeZone: congregation.timezone,
    });

    const eventType = await this.resolveEventTypeOrThrow({
      id: normalized.type_id,
      congregationId: congregation.id,
    });
    const created = this.repository.create({
      congregation_id: congregation.id,
      congregation,
      name: normalized.name,
      description: normalized.description,
      ...dateTimes,
      event_type_id: eventType.id,
      type: eventType,
      enabled: normalized.enabled,
      all_day: normalized.all_day,
      is_public: normalized.is_public,
      public_id: normalized.is_public ? randomUUID() : null,
      image_file_id: normalized.image_file_id,
      image_url: normalized.image_url,
      attendance_enabled: normalized.attendance_enabled,
      self_registration_enabled: normalized.self_registration_enabled,
      custom_fields: normalized.custom_fields,
      save_attendance_date: normalized.save_attendance_date,
      attendance_date_person_field_id: normalized.attendance_date_person_field_id,
      created_by: user,
    });
    const resultId = (await this.repository.save(created)).id;
    if (normalized.image_file_id) await this.filesService.setPublic(normalized.image_file_id, normalized.is_public);
    return this.get({ id: resultId, userId, congregationId, canViewAll: true });
  }

  async update({ id, data, userId, congregationId }: EventUpdateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);

    const existing = await this.repository.findOne({
      where: {
        id,
        congregation_id: congregation.id,
      },
    });

    if (!existing) throw new NotFoundException(this.i18n.t('errors.event.notFound'));

    const normalized = this.normalizeEvent(data);
    const eventType = await this.resolveEventTypeOrThrow({
      id: normalized.type_id,
      congregationId: congregation.id,
    });

    const dateTimes = this.parseEventDateTimes({
      startDateTime: data.start_datetime,
      endDateTime: data.end_datetime,
      timeZone: congregation.timezone,
    });

    existing.name = normalized.name;
    existing.description = normalized.description;
    existing.start_datetime = dateTimes.start_datetime;
    existing.end_datetime = dateTimes.end_datetime;
    existing.event_type_id = eventType.id;
    existing.type = eventType;
    existing.enabled = normalized.enabled;
    existing.all_day = normalized.all_day;
    existing.is_public = normalized.is_public;
    existing.public_id = normalized.is_public ? (existing.public_id ?? randomUUID()) : null;
    existing.image_file_id = normalized.image_file_id;
    existing.image_url = normalized.image_url;
    existing.attendance_enabled = normalized.attendance_enabled;
    existing.self_registration_enabled = normalized.self_registration_enabled;
    existing.custom_fields = normalized.custom_fields;
    existing.save_attendance_date = normalized.save_attendance_date;
    existing.attendance_date_person_field_id = normalized.attendance_date_person_field_id;
    existing.updated_by = user;

    await this.repository.save(existing);
    if (normalized.image_file_id) await this.filesService.setPublic(normalized.image_file_id, normalized.is_public);
    return this.get({ id, userId, congregationId, canViewAll: true });
  }

  async remove({ id, userId, congregationId }: EventDeleteProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);

    const existing = await this.repository.findOne({
      where: {
        id,
        congregation_id: congregation.id,
      },
    });

    if (!existing) throw new NotFoundException(this.i18n.t('errors.event.notFound'));

    existing.deleted_by = user;
    await this.repository.save(existing);
    await this.repository.softDelete(id);
    return { deleted: true };
  }

  async setRegistrationLock({ id, locked, userId, congregationId }: EventDeleteProps & { locked: boolean }) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const event = await this.repository.findOne({
      where: { id, congregation_id: congregation.id, deleted_at: IsNull() },
    });
    if (!event) throw new NotFoundException(this.i18n.t('errors.event.notFound'));
    event.registration_locked = locked;
    event.updated_by = user;
    await this.repository.save(event);
    return this.get({ id, userId, congregationId, canViewAll: true });
  }

  async listPublic({ congregationId, query }: { congregationId: string; query: EventQuery }) {
    const congregation = await this.congregationRepository.findOne({
      where: { id: congregationId, deleted_at: IsNull() },
    });
    if (!congregation?.features?.includes(Feature.PublicEvents))
      throw new NotFoundException(this.i18n.t('errors.event.notFound'));
    const { result, total } = await findWithFilters<Event, EventQuery>({
      repository: this.repository,
      query,
      searchFields: ['name', 'description'],
      baseWhere: {
        congregation_id: congregationId,
        is_public: true,
        deleted_at: IsNull(),
        ...(query.start ? { end_datetime: MoreThan(new Date(query.start)) } : {}),
        ...(query.end ? { start_datetime: LessThan(new Date(query.end)) } : {}),
      },
    });
    return {
      result: await Promise.all(result.map((event) => this.hydrateEvent(event, congregationId))),
      total,
    };
  }

  async getPublic(publicId: string) {
    const result = await this.repository.findOne({
      where: { public_id: publicId, is_public: true, deleted_at: IsNull() },
      relations: { type: true, congregation: true },
    });
    if (!result || !result.congregation.features?.includes(Feature.PublicEvents))
      throw new NotFoundException(this.i18n.t('errors.event.notFound'));
    return this.hydrateEvent(result, result.congregation_id);
  }
}
