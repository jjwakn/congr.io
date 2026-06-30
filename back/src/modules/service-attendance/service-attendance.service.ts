import { I18nService } from 'nestjs-i18n';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Service } from '../service/service.entity';
import { User } from '../user/user.entity';
import { ServiceAttendance, type ServiceAttendanceCount } from './service-attendance.entity';
import type {
  ServiceAttendanceActionProps,
  ServiceAttendanceCreateProps,
  ServiceAttendanceDeltaProps,
  ServiceAttendanceListProps,
  ServiceAttendanceUpdateProps,
} from './service-attendance.types';

@Injectable()
export class ServiceAttendanceService {
  constructor(
    @InjectRepository(ServiceAttendance) private readonly repository: Repository<ServiceAttendance>,
    @InjectRepository(Service) private readonly serviceRepository: Repository<Service>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Congregation) private readonly congregationRepository: Repository<Congregation>,
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

  private buildCounts(service: Service): ServiceAttendanceCount[] {
    return service.attendance_groups.map((group) => ({
      group_id: group.id,
      label: group.label,
      color: group.color,
      count: 0,
    }));
  }

  async list({ query, userId, congregationId }: ServiceAttendanceListProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    return findWithFilters<ServiceAttendance, typeof query>({
      repository: this.repository,
      query,
      searchFields: ['id', 'date', 'notes'],
      booleanFields: ['enabled'],
      baseWhere: { congregation_id: congregation.id, deleted_at: IsNull() },
    });
  }

  async get({ id, userId, congregationId }: ServiceAttendanceActionProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    const result = await this.repository.findOne({
      where: { id, congregation_id: congregation.id },
      relations: { service: true, created_by: true, updated_by: true },
    });
    if (!result) throw new NotFoundException(this.i18n.t('errors.serviceAttendance.notFound'));
    return cleanColumns<ServiceAttendance>(result);
  }

  async create({ data, userId, congregationId }: ServiceAttendanceCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const service = await this.assertService(congregation.id, data.service_id);
    const existing = await this.repository.findOne({
      where: { service_id: service.id, date: data.date, deleted_at: IsNull() },
    });
    if (existing) return this.get({ id: existing.id, userId, congregationId });
    const created = this.repository.create({
      congregation_id: congregation.id,
      congregation,
      service,
      service_id: service.id,
      date: data.date,
      counts: this.buildCounts(service),
      notes: data.notes?.trim() ?? '',
      enabled: data.enabled ?? true,
      created_by: user,
    });
    return this.get({ id: (await this.repository.save(created)).id, userId, congregationId });
  }

  async update({ id, data, userId, congregationId }: ServiceAttendanceUpdateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!existing) throw new NotFoundException(this.i18n.t('errors.serviceAttendance.notFound'));
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

  async applyDelta({ data, userId, congregationId }: ServiceAttendanceDeltaProps) {
    if (!data.deltas?.length) throw new NotAcceptableException(this.i18n.t('errors.serviceAttendance.invalidDelta'));
    const { user, congregation } = await this.getContext(userId, congregationId);
    const savedId = await this.dataSource.transaction(async (manager) => {
      const service = await manager.getRepository(Service).findOne({
        where: { id: data.service_id, congregation_id: congregation.id, deleted_at: IsNull() },
      });
      if (!service) throw new NotFoundException(this.i18n.t('errors.service.notFound'));

      let attendance = await manager.getRepository(ServiceAttendance).findOne({
        where: { service_id: service.id, date: data.date, deleted_at: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });

      if (!attendance) {
        attendance = manager.getRepository(ServiceAttendance).create({
          congregation_id: congregation.id,
          congregation,
          service,
          service_id: service.id,
          date: data.date,
          counts: this.buildCounts(service),
          created_by: user,
        });
      }

      const countMap = new Map(attendance.counts.map((count) => [count.group_id, count]));
      data.deltas.forEach(({ group_id, delta }) => {
        const existing = countMap.get(group_id);
        if (!existing) throw new NotFoundException(this.i18n.t('errors.serviceAttendance.groupNotFound'));
        existing.count = Math.max(0, existing.count + delta);
      });
      attendance.counts = Array.from(countMap.values());
      attendance.updated_by = user;
      return (await manager.getRepository(ServiceAttendance).save(attendance)).id;
    });
    return this.get({ id: savedId, userId, congregationId });
  }

  async remove({ id, userId, congregationId }: ServiceAttendanceActionProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!existing) throw new NotFoundException(this.i18n.t('errors.serviceAttendance.notFound'));
    existing.deleted_by = user;
    await this.repository.save(existing);
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
