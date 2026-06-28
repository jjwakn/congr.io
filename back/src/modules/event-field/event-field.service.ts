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
import type { EventFieldType } from './event-field.types';

const STANDARD_PERSON_FIELDS: Record<string, { label: string; type: EventFieldType; options: string[] }> = {
  first_name: { label: 'First name', type: 'text', options: [] },
  middle_name: { label: 'Middle name', type: 'text', options: [] },
  last_name: { label: 'Last name', type: 'text', options: [] },
  second_last_name: { label: 'Second last name', type: 'text', options: [] },
  married_name: { label: 'Married name', type: 'text', options: [] },
  phone: { label: 'Phone', type: 'text', options: [] },
  birthdate: { label: 'Birthdate', type: 'date', options: [] },
  email: { label: 'Email', type: 'text', options: [] },
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  private async normalize(data: EventFieldCreateProps['data'], congregationId: string, defaultEnabled = true) {
    const linkPersonField = data.link_person_field ?? Boolean(data.person_field_id);
    let type = data.type;
    let options = data.type === 'options' ? (data.options?.map((value) => value.trim()).filter(Boolean) ?? []) : [];
    let allowMultiple = data.type === 'options' ? (data.allow_multiple ?? false) : false;

    if (linkPersonField && data.person_field_id) {
      if (STANDARD_PERSON_FIELDS[data.person_field_id]) {
        const standard = STANDARD_PERSON_FIELDS[data.person_field_id];
        type = standard.type;
        options = standard.options;
        allowMultiple = false;
      } else if (UUID_PATTERN.test(data.person_field_id)) {
        const personField = await this.personFieldRepository.findOne({
          where: { id: data.person_field_id, congregation_id: congregationId, deleted_at: IsNull() },
        });
        if (!personField) throw new NotFoundException(this.i18n.t('errors.personField.notFound'));
        type = personField.type;
        options =
          type === 'options' ? (data.options?.map((value) => value.trim()).filter(Boolean) ?? personField.options) : [];
        allowMultiple = type === 'options' ? (data.allow_multiple ?? personField.allow_multiple) : false;
        if (type === 'options') {
          personField.options = options;
          personField.allow_multiple = allowMultiple;
          await this.personFieldRepository.save(personField);
        }
      } else {
        throw new NotFoundException(this.i18n.t('errors.personField.notFound'));
      }
    } else if (data.person_field_id) {
      const personField = await this.personFieldRepository.findOne({
        where: { id: data.person_field_id, congregation_id: congregationId, deleted_at: IsNull() },
      });
      if (!personField) throw new NotFoundException(this.i18n.t('errors.personField.notFound'));
    }

    return {
      label: data.label.trim(),
      type,
      required: data.required ?? false,
      user_fillable: data.user_fillable ?? false,
      link_person_field: linkPersonField,
      person_field_id: data.person_field_id ?? null,
      allow_multiple: allowMultiple,
      options,
      calculated_conditions: type === 'yes_no' ? (data.calculated_conditions ?? []) : [],
      enabled: data.enabled ?? defaultEnabled,
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
    const created = this.repository.create({
      congregation_id: congregation.id,
      congregation,
      ...(await this.normalize(data, congregation.id)),
      created_by: user,
    });
    return this.repository.save(created);
  }

  async update({ id, data, userId, congregationId }: EventFieldUpdateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.get({ id, userId, congregationId });
    Object.assign(existing, await this.normalize(data, congregation.id, existing.enabled), { updated_by: user });
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
