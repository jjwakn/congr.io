import { I18nService } from 'nestjs-i18n';
import { DefaultGetData } from 'src/common/common.types';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Congregation } from './congregation.entity';
import {
  CongregationCreateProps,
  CongregationDeleteProps,
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

  async list(query: CongregationQuery) {
    const { result, total } = await findWithFilters<Congregation, CongregationQuery>({
      repository: this.repository,
      query,
      searchFields: ['id', 'name', 'type'],
      booleanFields: ['enabled'],
    });

    return {
      result,
      total,
    };
  }

  async get({ id }: DefaultGetData) {
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
    const created_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    const created = this.repository.create({ ...data, created_by });
    return this.repository.save(created);
  }

  async update({ id, data, userId }: CongregationUpdateProps) {
    const updated_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, { ...data, updated_by });
    return cleanColumns<Congregation>(
      this.repository.findOne({
        where: { id },
      }),
    );
  }

  async remove({ id, userId }: CongregationDeleteProps) {
    const deleted_by = await this.userRepository.findOne({
      where: { id: userId },
      withDeleted: true,
    });

    await this.repository.update(id, { deleted_by });
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
