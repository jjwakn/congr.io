import { I18nService } from 'nestjs-i18n';
import { randomUUID } from 'node:crypto';
import type { JsonObject, JsonValue } from 'src/common/common.types';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { Feature } from 'src/utils/constants';
import { IsNull, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Event } from '../event/event.entity';
import { Person } from '../person/person.entity';
import { User } from '../user/user.entity';
import { EventParticipant } from './event-participant.entity';
import type {
  ParticipantActionProps,
  ParticipantCreateProps,
  ParticipantEventActionProps,
  ParticipantListProps,
  PublicRegistrationDto,
} from './event-participant.types';

@Injectable()
export class EventParticipantService {
  constructor(
    @InjectRepository(EventParticipant) private repository: Repository<EventParticipant>,
    @InjectRepository(Event) private eventRepository: Repository<Event>,
    @InjectRepository(Person) private personRepository: Repository<Person>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Congregation) private congregationRepository: Repository<Congregation>,
    private i18n: I18nService,
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
  private async event(id: string, congregationId: string) {
    const event = await this.eventRepository.findOne({
      where: { id, congregation_id: congregationId, deleted_at: IsNull() },
    });
    if (!event) throw new NotFoundException(this.i18n.t('errors.event.notFound'));
    return event;
  }

  private readonly standardPersonFields = [
    'first_name',
    'middle_name',
    'last_name',
    'second_last_name',
    'married_name',
    'phone',
    'birthdate',
    'email',
  ] as const;

  private isStandardPersonField(key: string): key is (typeof this.standardPersonFields)[number] {
    return this.standardPersonFields.includes(key as (typeof this.standardPersonFields)[number]);
  }

  private toPersonTextValue(value: JsonValue | undefined): string | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value))
      return value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
    return null;
  }

  private assignPersonValue(person: Person, key: string, value: JsonValue | undefined) {
    if (!this.isStandardPersonField(key)) {
      person.custom_values = { ...(person.custom_values ?? {}), [key]: value };
      return;
    }

    const textValue = this.toPersonTextValue(value);
    switch (key) {
      case 'first_name':
        if (textValue) person.first_name = textValue;
        return;
      case 'middle_name':
        person.middle_name = textValue;
        return;
      case 'last_name':
        if (textValue) person.last_name = textValue;
        return;
      case 'second_last_name':
        person.second_last_name = textValue;
        return;
      case 'married_name':
        person.married_name = textValue;
        return;
      case 'phone':
        person.phone = textValue ?? '';
        return;
      case 'birthdate':
        person.birthdate = textValue;
        return;
      case 'email':
        person.email = textValue;
        return;
    }
  }

  private async updatePersonFromEvent({
    person,
    event,
    values,
    updates,
    attended,
  }: {
    person: Person;
    event: Event;
    values: JsonObject;
    updates?: JsonObject;
    attended: boolean;
  }) {
    const mapped = Object.fromEntries(
      (event.custom_fields ?? []).flatMap((field) => {
        const personFieldId = typeof field.person_field_id === 'string' ? field.person_field_id : null;
        const fieldId = typeof field.id === 'string' ? field.id : null;
        return personFieldId && fieldId && values[fieldId] !== undefined ? [[personFieldId, values[fieldId]]] : [];
      }),
    );
    const personUpdates = { ...mapped, ...(updates ?? {}) };
    if (attended && event.save_attendance_date && event.attendance_date_person_field_id)
      personUpdates[event.attendance_date_person_field_id] = event.start_datetime.toISOString();
    Object.entries(personUpdates).forEach(([key, value]) => {
      this.assignPersonValue(person, key, value);
    });
    if (Object.keys(personUpdates).length) await this.personRepository.save(person);
  }
  async list({ query, userId, congregationId }: ParticipantListProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    if (!query.event_id) {
      throw new BadRequestException(this.i18n.t('errors.event.notFound'));
    }

    await this.event(query.event_id, congregation.id);
    const size = Number.isFinite(query.size) && query.size > 0 ? query.size : 50;
    const page = Number.isFinite(query.page) && query.page >= 0 ? query.page : 0;
    const [result, total] = await this.repository.findAndCount({
      where: {
        event_id: query.event_id,
        deleted_at: IsNull(),
        ...(query.attended === undefined ? {} : { attended: query.attended }),
      },
      relations: { person: true },
      order: { created_at: 'ASC' },
      skip: page * size,
      take: size,
    });

    const publicSubmissions = result.filter(({ public_submission, person_id }) => public_submission && !person_id);
    if (!publicSubmissions.length) return { result, total };
    const people = await this.personRepository.find({
      where: { congregation_id: congregation.id, deleted_at: IsNull() },
    });
    const score = (person: Person, submitted: JsonObject) => {
      const normalized = (value: JsonValue | undefined) =>
        typeof value === 'string' ? value.trim().toLowerCase() : '';
      let value = 0;
      if (normalized(submitted.email) && normalized(submitted.email) === normalized(person.email)) value += 5;
      if (normalized(submitted.phone) && normalized(submitted.phone) === normalized(person.phone)) value += 4;
      if (normalized(submitted.first_name) === normalized(person.first_name)) value += 1;
      if (normalized(submitted.last_name) === normalized(person.last_name)) value += 2;
      return value;
    };
    return {
      result: result.map((participant) => {
        if (!participant.public_submission || participant.person_id) return participant;
        const ranked = people
          .map((person) => ({ person, score: score(person, participant.submitted_person) }))
          .filter(({ score: matchScore }) => matchScore > 0)
          .sort((left, right) => right.score - left.score);
        return { ...participant, possible_person: ranked[0]?.person ?? null };
      }),
      total,
    };
  }
  async create({ data, userId, congregationId }: ParticipantCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const event = await this.event(data.event_id, congregation.id);
    const person = data.person_id
      ? await this.personRepository.findOne({ where: { id: data.person_id, congregation_id: congregation.id } })
      : null;
    if (data.person_id && !person) throw new NotFoundException(this.i18n.t('errors.person.notFound'));
    let existing = person
      ? await this.repository.findOne({
          where: { event_id: event.id, person_id: person.id },
          withDeleted: true,
        })
      : null;
    if (existing?.deleted_at) {
      await this.repository.restore(existing.id);
      existing.deleted_at = null;
      existing.deleted_by = null;
      existing.attended = false;
      existing.field_values = {};
      existing.submitted_person = {};
      existing.updated_by = user;
    } else if (!existing)
      existing = this.repository.create({
        event_id: event.id,
        event,
        person_id: person?.id ?? null,
        person,
        created_by: user,
      });
    existing.attended = data.attended ?? existing.attended ?? false;
    existing.field_values = data.field_values ?? existing.field_values ?? {};
    if (person)
      await this.updatePersonFromEvent({
        person,
        event,
        values: existing.field_values,
        updates: data.person_updates,
        attended: existing.attended,
      });
    return this.repository.save(existing);
  }
  async setAttended({ id, userId, congregationId, attended }: ParticipantActionProps & { attended: boolean }) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const item = await this.repository.findOne({ where: { id }, relations: { event: true, person: true } });
    if (!item || item.event.congregation_id !== congregation.id)
      throw new NotFoundException(this.i18n.t('errors.eventParticipant.notFound'));
    item.attended = attended;
    item.updated_by = user;
    if (attended && item.person)
      await this.updatePersonFromEvent({ person: item.person, event: item.event, values: item.field_values, attended });
    return this.repository.save(item);
  }
  async remove({ id, userId, congregationId }: ParticipantActionProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const item = await this.repository.findOne({ where: { id }, relations: { event: true } });
    if (!item || item.event.congregation_id !== congregation.id)
      throw new NotFoundException(this.i18n.t('errors.eventParticipant.notFound'));
    item.deleted_by = user;
    await this.repository.save(item);
    await this.repository.softDelete(id);
    return { deleted: true };
  }
  async clearAttendance({ eventId, userId, congregationId }: ParticipantEventActionProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const event = await this.event(eventId, congregation.id);
    const participants = await this.repository.find({
      where: {
        event_id: event.id,
        attended: true,
        deleted_at: IsNull(),
      },
    });
    participants.forEach((participant) => {
      participant.attended = false;
      participant.updated_by = user;
    });
    if (participants.length) await this.repository.save(participants);
    return { deleted: true };
  }
  async clearRegistration({ eventId, userId, congregationId }: ParticipantEventActionProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const event = await this.event(eventId, congregation.id);
    const participants = await this.repository.find({
      where: {
        event_id: event.id,
        deleted_at: IsNull(),
      },
    });
    participants.forEach((participant) => {
      participant.deleted_by = user;
    });
    if (participants.length) {
      await this.repository.save(participants);
      await this.repository.softDelete(participants.map((participant) => participant.id));
    }
    return { deleted: true };
  }
  async match({ id, personId, userId, congregationId }: ParticipantActionProps & { personId: string }) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const item = await this.repository.findOne({ where: { id }, relations: { event: true } });
    const person = await this.personRepository.findOne({ where: { id: personId, congregation_id: congregation.id } });
    if (!item || item.event.congregation_id !== congregation.id || !person)
      throw new NotFoundException(this.i18n.t('errors.eventParticipant.notFound'));
    Object.entries(item.submitted_person ?? {}).forEach(([key, value]) => {
      if (value) this.assignPersonValue(person, key, value);
    });
    await this.updatePersonFromEvent({ person, event: item.event, values: item.field_values, attended: item.attended });
    const existing = await this.repository.findOne({
      where: { event_id: item.event_id, person_id: person.id, deleted_at: IsNull() },
    });
    if (existing && existing.id !== item.id) {
      existing.field_values = { ...existing.field_values, ...item.field_values };
      existing.updated_by = user;
      await this.repository.save(existing);
      item.deleted_by = user;
      await this.repository.save(item);
      await this.repository.softDelete(item.id);
      return existing;
    }
    item.person_id = person.id;
    item.person = person;
    item.updated_by = user;
    return this.repository.save(item);
  }
  async publicRegister(publicId: string, data: PublicRegistrationDto) {
    const event = await this.eventRepository.findOne({
      where: {
        public_id: publicId,
        is_public: true,
        self_registration_enabled: true,
        registration_locked: false,
        deleted_at: IsNull(),
      },
      relations: { congregation: true },
    });
    if (!event || !event.congregation.features?.includes(Feature.PublicEvents))
      throw new NotFoundException(this.i18n.t('errors.event.notFound'));
    const firstName = data.submitted_person.first_name;
    const lastName = data.submitted_person.last_name;
    const values = data.field_values ?? {};
    const missingRequired = (event.custom_fields ?? []).some((field) =>
      Boolean(
        field.user_fillable &&
        field.required &&
        (values[String(field.id)] === undefined || values[String(field.id)] === ''),
      ),
    );
    if (
      typeof firstName !== 'string' ||
      !firstName.trim() ||
      typeof lastName !== 'string' ||
      !lastName.trim() ||
      missingRequired
    )
      throw new BadRequestException(this.i18n.t('errors.eventParticipant.invalidRegistration'));
    return this.repository.save(
      this.repository.create({
        event_id: event.id,
        event,
        person_id: null,
        attended: false,
        public_submission: true,
        public_submission_id: randomUUID(),
        submitted_person: { ...data.submitted_person, first_name: firstName.trim(), last_name: lastName.trim() },
        field_values: values,
      }),
    );
  }
}
