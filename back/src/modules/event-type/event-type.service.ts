import { I18nService } from 'nestjs-i18n';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { IsNull, Repository } from 'typeorm';
import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getUserCongregationContext } from '../../utils/congregation-context';
import { Congregation } from '../congregation/congregation.entity';
import { Event } from '../event/event.entity';
import { ProcessStep } from '../process/process-step.entity';
import { User } from '../user/user.entity';
import { EventType } from './event-type.entity';
import {
  EventTypeCreateProps,
  EventTypeDeleteProps,
  EventTypeDto,
  EventTypeGetProps,
  EventTypeListProps,
  EventTypeQuery,
  EventTypeUpdateProps,
} from './event-type.types';

@Injectable()
export class EventTypeService {
  constructor(
    @InjectRepository(EventType)
    private readonly repository: Repository<EventType>,

    @InjectRepository(ProcessStep)
    private readonly stepRepository: Repository<ProcessStep>,

    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Congregation)
    private readonly congregationRepository: Repository<Congregation>,

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

  private normalizeEventType(data: EventTypeDto) {
    return {
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      enabled: data.enabled ?? true,
      attendance_enabled: data.attendance_enabled ?? false,
      custom_fields: data.custom_fields ?? [],
      color: data.color ?? '#1976d2',
    };
  }

  async list({ query, userId, congregationId }: EventTypeListProps) {
    const { congregation } = await this.getContext(userId, congregationId);

    return findWithFilters<EventType, EventTypeQuery>({
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
  }

  async get({ id, userId, congregationId }: EventTypeGetProps) {
    const { congregation } = await this.getContext(userId, congregationId);

    const result = await this.repository.findOne({
      where: {
        id,
        congregation_id: congregation.id,
      },
      withDeleted: true,
      relations: {
        created_by: true,
        updated_by: true,
        deleted_by: true,
        process_step: true,
      },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.eventType.notFound'));

    return cleanColumns<EventType>(result);
  }

  async create({ data, userId, congregationId }: EventTypeCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const normalized = this.normalizeEventType(data);

    const created = this.repository.create({
      congregation_id: congregation.id,
      congregation,
      ...normalized,
      created_by: user,
    });

    const result = await this.repository.save(created);
    return this.get({ id: result.id, userId, congregationId });
  }

  async update({ id, data, userId, congregationId }: EventTypeUpdateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);

    const existing = await this.repository.findOne({
      where: {
        id,
        congregation_id: congregation.id,
      },
      relations: {
        process_step: true,
      },
    });

    if (!existing) throw new NotFoundException(this.i18n.t('errors.eventType.notFound'));

    const normalized = this.normalizeEventType(data);
    existing.name = normalized.name;
    existing.description = normalized.description;
    existing.enabled = normalized.enabled;
    existing.attendance_enabled = normalized.attendance_enabled;
    existing.custom_fields = normalized.custom_fields;
    existing.color = normalized.color;
    existing.updated_by = user;
    await this.repository.save(existing);

    if (existing.process_step_id) {
      const step = await this.stepRepository.findOne({
        where: { id: existing.process_step_id },
      });

      if (step) {
        step.name = normalized.name;
        step.description = normalized.description;
        step.enabled = normalized.enabled;
        step.updated_by = user;
        await this.stepRepository.save(step);
      }
    }

    return this.get({ id, userId, congregationId });
  }

  async remove({ id, userId, congregationId }: EventTypeDeleteProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);

    const existing = await this.repository.findOne({
      where: {
        id,
        congregation_id: congregation.id,
      },
    });

    if (!existing) throw new NotFoundException(this.i18n.t('errors.eventType.notFound'));

    const [linkedEventCount, linkedStepCount] = await Promise.all([
      this.eventRepository.count({
        where: {
          event_type_id: id,
          deleted_at: IsNull(),
          deleted_by: IsNull(),
        },
      }),
      existing.process_step_id
        ? this.stepRepository.count({
            where: {
              id: existing.process_step_id,
            },
            withDeleted: true,
          })
        : Promise.resolve(0),
    ]);

    if (linkedEventCount > 0 || linkedStepCount > 0)
      throw new NotAcceptableException(this.i18n.t('errors.eventType.inUse'));

    existing.deleted_by = user;
    await this.repository.save(existing);
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
