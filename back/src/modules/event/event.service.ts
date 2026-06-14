import { I18nService } from 'nestjs-i18n';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { In, IsNull, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getUserCongregationContext } from '../../utils/congregation-context';
import { parseDateTimeInTimeZone } from '../../utils/datetime';
import { Congregation } from '../congregation/congregation.entity';
import { EventType } from '../event-type/event-type.entity';
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

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>,

    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Congregation)
    private readonly congregationRepository: Repository<Congregation>,

    private readonly i18n: I18nService,
  ) {}

  private async getContext(userId: string) {
    return getUserCongregationContext({
      userId,
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

    return cleanColumns<Event>(result);
  }

  async list({ query, userId }: EventListProps) {
    const { congregation } = await this.getContext(userId);

    const { result, total } = await findWithFilters<Event, EventQuery>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name', 'description'],
      booleanFields: ['enabled'],
      baseWhere: {
        congregation_id: congregation.id,
        deleted_at: IsNull(),
        deleted_by: IsNull(),
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

    return {
      result: result.map((event) => ({
        ...event,
        type: eventTypeById.get(event.event_type_id) ?? null,
      })),
      total,
    };
  }

  async get({ id, userId }: EventGetProps) {
    const { congregation } = await this.getContext(userId);
    return this.loadEventOrThrow({ id, congregationId: congregation.id });
  }

  async create({ data, userId }: EventCreateProps) {
    const { user, congregation } = await this.getContext(userId);
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

    const created = this.repository.create({
      congregation_id: congregation.id,
      congregation,
      name: normalized.name,
      description: normalized.description,
      ...dateTimes,
      event_type_id: eventType.id,
      type: eventType,
      enabled: normalized.enabled,
      created_by: user,
    });

    const result = await this.repository.save(created);
    return this.get({ id: result.id, userId });
  }

  async update({ id, data, userId }: EventUpdateProps) {
    const { user, congregation } = await this.getContext(userId);

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
    existing.updated_by = user;

    await this.repository.save(existing);
    return this.get({ id, userId });
  }

  async remove({ id, userId }: EventDeleteProps) {
    const { user, congregation } = await this.getContext(userId);

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
}
