import { randomUUID } from 'crypto';
import { I18nService } from 'nestjs-i18n';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { IsNull, Repository } from 'typeorm';
import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';
import { User } from '../user/user.entity';
import { Service } from './service.entity';
import type { ServiceActionProps, ServiceCreateProps, ServiceListProps, ServiceUpdateProps } from './service.types';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;

const normalizeTime = (value: string) => {
  const match = value.trim().match(TIME_PATTERN);
  if (!match) return value.trim();
  return `${match[1]}:${match[2]}:${match[3] ?? '00'}`;
};

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service) private readonly repository: Repository<Service>,
    @InjectRepository(Location) private readonly locationRepository: Repository<Location>,
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

  private async assertLocation(congregationId: string, locationId: string) {
    const location = await this.locationRepository
      .createQueryBuilder('location')
      .innerJoin('congregation_location', 'cl', 'cl.congregation_location_id = location.id')
      .where('location.id = :locationId', { locationId })
      .andWhere('cl.congregation_id = :congregationId', { congregationId })
      .andWhere('location.deleted_at IS NULL')
      .getOne();

    if (!location) throw new NotFoundException(this.i18n.t('errors.service.locationNotFound'));
    return location;
  }

  private normalize(data: ServiceCreateProps['data'], defaultEnabled = true) {
    const startTime = normalizeTime(data.start_time);
    const endTime = normalizeTime(data.end_time);
    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime) || endTime <= startTime) {
      throw new NotAcceptableException(this.i18n.t('errors.service.invalidTimeRange'));
    }

    const attendanceGroups = (data.attendance_groups ?? []).map((group) => ({
      id: group.id?.trim() || randomUUID(),
      label: group.label.trim(),
      color: group.color,
    }));

    return {
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      location_id: data.location_id,
      day_of_week: data.day_of_week,
      start_time: startTime,
      end_time: endTime,
      attendance_groups: attendanceGroups,
      enabled: data.enabled ?? defaultEnabled,
    };
  }

  async list({ query, userId, congregationId }: ServiceListProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    return findWithFilters<Service, typeof query>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name', 'description', 'start_time', 'end_time'],
      booleanFields: ['enabled'],
      baseWhere: { congregation_id: congregation.id, deleted_at: IsNull() },
    });
  }

  async get({ id, userId, congregationId }: ServiceActionProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    const result = await this.repository.findOne({
      where: { id, congregation_id: congregation.id },
      relations: { location: true, created_by: true, updated_by: true },
    });
    if (!result) throw new NotFoundException(this.i18n.t('errors.service.notFound'));
    return cleanColumns<Service>(result);
  }

  async create({ data, userId, congregationId }: ServiceCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const normalized = this.normalize(data);
    const location = await this.assertLocation(congregation.id, normalized.location_id);
    const created = this.repository.create({
      ...normalized,
      congregation_id: congregation.id,
      congregation,
      location,
      created_by: user,
    });
    return this.get({ id: (await this.repository.save(created)).id, userId, congregationId });
  }

  async update({ id, data, userId, congregationId }: ServiceUpdateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!existing) throw new NotFoundException(this.i18n.t('errors.service.notFound'));
    const normalized = this.normalize(data, existing.enabled);
    await this.assertLocation(congregation.id, normalized.location_id);
    Object.assign(existing, normalized, { updated_by: user });
    await this.repository.save(existing);
    return this.get({ id, userId, congregationId });
  }

  async remove({ id, userId, congregationId }: ServiceActionProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!existing) throw new NotFoundException(this.i18n.t('errors.service.notFound'));
    existing.deleted_by = user;
    await this.repository.save(existing);
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
