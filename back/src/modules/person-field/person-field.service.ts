import { I18nService } from 'nestjs-i18n';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { findWithFilters } from 'src/utils/query';
import { IsNull, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Person } from '../person/person.entity';
import { User } from '../user/user.entity';
import { PersonField } from './person-field.entity';
import type {
  PersonFieldActionProps,
  PersonFieldCreateProps,
  PersonFieldListProps,
  PersonFieldUpdateProps,
} from './person-field.types';

@Injectable()
export class PersonFieldService {
  constructor(
    @InjectRepository(PersonField) private repository: Repository<PersonField>,
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
  async list({ query, userId, congregationId }: PersonFieldListProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    return findWithFilters({
      repository: this.repository,
      query,
      searchFields: ['label'],
      baseWhere: { congregation_id: congregation.id, deleted_at: IsNull() },
    });
  }
  async get({ id, userId, congregationId }: PersonFieldActionProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    const result = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!result) throw new NotFoundException(this.i18n.t('errors.personField.notFound'));
    return result;
  }
  async create({ data, userId, congregationId }: PersonFieldCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    return this.repository.save(
      this.repository.create({
        congregation_id: congregation.id,
        label: data.label.trim(),
        type: data.type,
        required: data.required ?? false,
        options: data.options?.map((value) => value.trim()).filter(Boolean) ?? [],
        created_by: user,
      }),
    );
  }
  async update({ id, data, userId, congregationId }: PersonFieldUpdateProps) {
    const { user } = await this.getContext(userId, congregationId);
    const existing = await this.get({ id, userId, congregationId });
    Object.assign(existing, {
      label: data.label.trim(),
      type: data.type,
      required: data.required ?? false,
      options: data.options ?? [],
      updated_by: user,
    });
    return this.repository.save(existing);
  }
  async remove({ id, userId, congregationId }: PersonFieldActionProps) {
    const { user } = await this.getContext(userId, congregationId);
    const existing = await this.get({ id, userId, congregationId });
    existing.deleted_by = user;
    await this.repository.save(existing);
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
