import { I18nService } from 'nestjs-i18n';
import { randomUUID } from 'node:crypto';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { In, IsNull, LessThan, MoreThan, Repository } from 'typeorm';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getUserCongregationContext } from '../../utils/congregation-context';
import { Feature } from '../../utils/constants';
import { parseDateTimeInTimeZone } from '../../utils/datetime';
import { Congregation } from '../congregation/congregation.entity';
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
  EventQuery,
  EventUpdateProps,
} from './event.types';

export interface HydratableEvent extends Omit<Event, 'type'> {
  type?: EventType | null;
}

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,

    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,

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

    const { result, total } = await findWithFilters<Event, EventQuery>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name', 'description'],
      booleanFields: ['enabled', 'all_day', 'is_public', 'attendance_enabled', 'self_registration_enabled'],
      baseWhere: {
        congregation_id: congregation.id,
        deleted_at: IsNull(),
        deleted_by: IsNull(),
        ...(!canViewAll ? { is_public: true } : {}),
        ...(query.start ? { end_datetime: MoreThan(new Date(query.start)) } : {}),
        ...(query.end ? { start_datetime: LessThan(new Date(query.end)) } : {}),
        ...(query.start_datetime_from ? { start_datetime: MoreThan(new Date(query.start_datetime_from)) } : {}),
        ...(query.start_datetime_to ? { start_datetime: LessThan(new Date(query.start_datetime_to)) } : {}),
        ...(query.end_datetime_from ? { end_datetime: MoreThan(new Date(query.end_datetime_from)) } : {}),
        ...(query.end_datetime_to ? { end_datetime: LessThan(new Date(query.end_datetime_to)) } : {}),
      },
    });

    const eventTypeIds = result.map((event) => event.event_type_id);
    const eventTypes =
      eventTypeIds.length > 0
        ? await this.eventTypeRepository.find({
            where: {
              id: In(eventTypeIds),
            },
          })
        : [];
    const eventTypeById = new Map(eventTypes.map((eventType) => [eventType.id, eventType]));

    const events = result.map((event) => ({
      ...event,
      type: eventTypeById.get(event.event_type_id) ?? null,
    }));

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
