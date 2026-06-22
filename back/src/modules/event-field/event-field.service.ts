import { I18nService } from 'nestjs-i18n';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { findWithFilters } from 'src/utils/query';
import { IsNull, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { PersonField } from '../person-field/person-field.entity';
import { User } from '../user/user.entity';
import { EventField } from './event-field.entity';
import type {
  EventFieldActionProps,
  EventFieldCreateProps,
  EventFieldListProps,
  EventFieldUpdateProps,
} from './event-field.types';

@Injectable()
export class EventFieldService {
  constructor(
    @InjectRepository(EventField) private readonly repository: Repository<EventField>,
    @InjectRepository(PersonField) private readonly personFieldRepository: Repository<PersonField>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Congregation) private readonly congregationRepository: Repository<Congregation>,
    private readonly i18n: I18nService,
  ) {}

  private getContext(userId: string, congregationId?: string) {
    return getUserCongregationContext({
      userId,
      congregationId,
      userRepository: this.userRepository,
      congregationRepository: this.congregationRepository,
      i18n: this.i18n,
    });
  }

  private async normalize(data: EventFieldCreateProps['data'], congregationId: string) {
    if (data.person_field_id) {
      const personField = await this.personFieldRepository.findOne({
        where: { id: data.person_field_id, congregation_id: congregationId, deleted_at: IsNull() },
      });
      if (!personField) throw new NotFoundException(this.i18n.t('errors.personField.notFound'));
    }

    return {
      label: data.label.trim(),
      type: data.type,
      required: data.required ?? false,
      user_fillable: data.user_fillable ?? false,
      person_field_id: data.person_field_id ?? null,
      options: data.options?.map((value) => value.trim()).filter(Boolean) ?? [],
    };
  }

  async list({ query, userId, congregationId }: EventFieldListProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    return findWithFilters<EventField, typeof query>({
      repository: this.repository,
      query,
      searchFields: ['label'],
      booleanFields: ['enabled', 'required', 'user_fillable'],
      baseWhere: { congregation_id: congregation.id, deleted_at: IsNull() },
    });
  }

  async get({ id, userId, congregationId }: EventFieldActionProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    const result = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!result) throw new NotFoundException(this.i18n.t('errors.eventField.notFound'));
    return result;
  }

  async create({ data, userId, congregationId }: EventFieldCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    return this.repository.save(
      this.repository.create({
        congregation_id: congregation.id,
        congregation,
        ...(await this.normalize(data, congregation.id)),
        created_by: user,
      }),
    );
  }

  async update({ id, data, userId, congregationId }: EventFieldUpdateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.get({ id, userId, congregationId });
    Object.assign(existing, await this.normalize(data, congregation.id), { updated_by: user });
    return this.repository.save(existing);
  }

  async remove({ id, userId, congregationId }: EventFieldActionProps) {
    const { user } = await this.getContext(userId, congregationId);
    const existing = await this.get({ id, userId, congregationId });
    existing.deleted_by = user;
    await this.repository.save(existing);
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
