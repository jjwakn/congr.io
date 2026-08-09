import { I18nService } from 'nestjs-i18n';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Person } from '../person/person.entity';
import { PersonService } from '../person/person.service';
import { Service } from '../service/service.entity';
import { User } from '../user/user.entity';
import { ServiceNewPeople, ServiceNewPerson } from './service-new-people.entity';
import type {
  ServiceNewPeopleActionProps,
  ServiceNewPeopleCreateProps,
  ServiceNewPeopleListProps,
  ServiceNewPeopleUpdateProps,
  ServiceNewPersonCreateProps,
  ServiceNewPersonRemoveProps,
} from './service-new-people.types';

@Injectable()
export class ServiceNewPeopleService {
  constructor(
    @InjectRepository(ServiceNewPeople) private readonly repository: Repository<ServiceNewPeople>,
    @InjectRepository(ServiceNewPerson) private readonly personRepository: Repository<ServiceNewPerson>,
    @InjectRepository(Service) private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Person) private readonly basePersonRepository: Repository<Person>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Congregation) private readonly congregationRepository: Repository<Congregation>,
    private readonly personService: PersonService,
    private readonly dataSource: DataSource,
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

  private async assertService(congregationId: string, serviceId: string) {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, congregation_id: congregationId, deleted_at: IsNull() },
    });
    if (!service) throw new NotFoundException(this.i18n.t('errors.service.notFound'));
    return service;
  }

  private async assertGroup(id: string, congregationId: string) {
    const group = await this.repository.findOne({
      where: { id, congregation_id: congregationId, deleted_at: IsNull() },
      relations: { service: true },
    });
    if (!group) throw new NotFoundException(this.i18n.t('errors.serviceNewPeople.notFound'));
    return group;
  }

  async list({ query, userId, congregationId }: ServiceNewPeopleListProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    return findWithFilters<ServiceNewPeople, typeof query>({
      repository: this.repository,
      query,
      searchFields: ['id', 'date', 'notes'],
      booleanFields: ['enabled'],
      baseWhere: { congregation_id: congregation.id, deleted_at: IsNull() },
    });
  }

  async get({ id, userId, congregationId }: ServiceNewPeopleActionProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    const group = await this.assertGroup(id, congregation.id);
    const people = await this.personRepository.find({
      where: { group_id: group.id, deleted_at: IsNull() },
      relations: { person: true },
      order: { created_at: 'ASC' },
    });
    return {
      ...cleanColumns<ServiceNewPeople>(group),
      people: people.map((entry) => cleanColumns<ServiceNewPerson>(entry)),
    };
  }

  async create({ data, userId, congregationId }: ServiceNewPeopleCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const service = await this.assertService(congregation.id, data.service_id);
    const created = this.repository.create({
      congregation_id: congregation.id,
      congregation,
      service,
      service_id: service.id,
      date: data.date,
      notes: data.notes?.trim() ?? '',
      enabled: data.enabled ?? true,
      created_by: user,
    });
    return this.get({ id: (await this.repository.save(created)).id, userId, congregationId });
  }

  async update({ id, data, userId, congregationId }: ServiceNewPeopleUpdateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.assertGroup(id, congregation.id);
    const service = await this.assertService(congregation.id, data.service_id);
    Object.assign(existing, {
      service,
      service_id: service.id,
      date: data.date,
      notes: data.notes?.trim() ?? '',
      enabled: data.enabled ?? existing.enabled,
      updated_by: user,
    });
    await this.repository.save(existing);
    return this.get({ id, userId, congregationId });
  }

  async addPerson({ id, data, userId, congregationId }: ServiceNewPersonCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const group = await this.assertGroup(id, congregation.id);
    const personId =
      data.person_id ??
      (data.person ? (await this.personService.create({ data: data.person, userId, congregationId })).id : undefined);
    if (!personId) throw new NotAcceptableException(this.i18n.t('errors.person.notFound'));

    const person = await this.basePersonRepository.findOne({
      where: { id: personId, congregation_id: congregation.id, deleted_at: IsNull() },
    });
    if (!person) throw new NotFoundException(this.i18n.t('errors.person.notFound'));

    const existing = await this.personRepository.findOne({
      where: { group_id: group.id, person_id: person.id, deleted_at: IsNull() },
    });
    if (existing) throw new NotAcceptableException(this.i18n.t('errors.serviceNewPeople.personAlreadyAdded'));

    const created = this.personRepository.create({
      group,
      group_id: group.id,
      person,
      person_id: person.id,
      created_by: user,
    });
    await this.personRepository.save(created);
    return this.get({ id, userId, congregationId });
  }

  async removePerson({ id, personId, userId, congregationId }: ServiceNewPersonRemoveProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const group = await this.assertGroup(id, congregation.id);
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ServiceNewPerson);
      const existing = await repository.findOne({ where: { group_id: group.id, person_id: personId } });
      if (!existing) return;
      existing.deleted_by = user;
      await repository.save(existing);
      await repository.softDelete(existing.id);
    });
    return this.get({ id, userId, congregationId });
  }

  async remove({ id, userId, congregationId }: ServiceNewPeopleActionProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.assertGroup(id, congregation.id);
    existing.deleted_by = user;
    await this.repository.save(existing);
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
