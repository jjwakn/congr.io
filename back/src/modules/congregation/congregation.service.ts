import { I18nService } from 'nestjs-i18n';
import { isValidTimeZone, normalizeTimeZone } from 'src/utils/datetime';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { In, IsNull, Repository } from 'typeorm';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Congregation } from './congregation.entity';
import {
  CongregationCreateProps,
  CongregationDeleteProps,
  CongregationGetProps,
  CongregationListProps,
  CongregationQuery,
  CongregationUpdateProps,
} from './congregation.types';

@Injectable()
export class CongregationService {
  constructor(
    @InjectRepository(Congregation)
    private repository: Repository<Congregation>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly i18n: I18nService,
  ) {}

  private async getUserWithCongregations(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
      relations: { congregations: true },
    });
    if (!user) throw new NotFoundException(this.i18n.t('errors.user.notFound'));
    return user;
  }

  private async assertUserCongregation(userId: string, congregationId: string) {
    const user = await this.getUserWithCongregations(userId);
    if (!user.congregations?.some(({ id }) => id === congregationId))
      throw new NotFoundException(this.i18n.t('errors.congregation.notFound'));
    return user;
  }

  async list({ query, userId }: CongregationListProps) {
    const user = await this.getUserWithCongregations(userId);
    const congregationIds = user.congregations?.map(({ id }) => id) ?? [];
    if (!congregationIds.length) return { result: [], total: 0 };

    const { result, total } = await findWithFilters<Congregation, CongregationQuery>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name', 'type'],
      booleanFields: ['enabled'],
      baseWhere: { id: In(congregationIds), deleted_at: IsNull() },
    });

    return {
      result,
      total,
    };
  }

  async get({ id, userId }: CongregationGetProps) {
    await this.assertUserCongregation(userId, id);
    const result = await this.repository.findOne({
      where: { id },
      withDeleted: true,
      relations: {
        created_by: true,
        updated_by: true,
        deleted_by: true,
        locations: {
          created_by: true,
          updated_by: true,
          deleted_by: true,
        },
      },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.congregation.notFound'));

    return cleanColumns<Congregation>(result);
  }

  async create({ data, userId }: CongregationCreateProps) {
    if (data.timezone && !isValidTimeZone(data.timezone.trim()))
      throw new BadRequestException(this.i18n.t('errors.congregation.invalidTimezone'));

    const created_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
      relations: { congregations: true },
    });

    if (!created_by) throw new NotFoundException(this.i18n.t('errors.user.notFound'));

    const created = this.repository.create({
      ...data,
      timezone: normalizeTimeZone(data.timezone),
      created_by,
    });
    const result = await this.repository.save(created);
    created_by.congregations = [...(created_by.congregations ?? []), result];
    await this.userRepository.save(created_by);
    return result;
  }

  async update({ id, data, userId }: CongregationUpdateProps) {
    await this.assertUserCongregation(userId, id);
    if (data.timezone && !isValidTimeZone(data.timezone.trim()))
      throw new BadRequestException(this.i18n.t('errors.congregation.invalidTimezone'));

    const updated_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, {
      ...data,
      ...(data.timezone ? { timezone: normalizeTimeZone(data.timezone) } : {}),
      updated_by,
    });
    const result = await this.repository.findOne({
      where: { id },
      relations: { locations: true },
    });
    if (!result) throw new NotFoundException(this.i18n.t('errors.congregation.notFound'));
    return cleanColumns<Congregation>(result);
  }

  async remove({ id, userId }: CongregationDeleteProps) {
    await this.assertUserCongregation(userId, id);
    const deleted_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, { deleted_by });
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
