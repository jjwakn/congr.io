import { I18nService } from 'nestjs-i18n';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getUserCongregationContext } from '../../utils/congregation-context';
import { Congregation } from '../congregation/congregation.entity';
import { EventType } from '../event-type/event-type.entity';
import { User } from '../user/user.entity';
import { ProcessStep } from './process-step.entity';
import { Process } from './process.entity';
import {
  ProcessCreateProps,
  ProcessDeleteProps,
  ProcessDto,
  ProcessGetProps,
  ProcessListProps,
  ProcessQuery,
  ProcessStepDto,
  ProcessUpdateProps,
} from './process.types';

@Injectable()
export class ProcessService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Process)
    private readonly repository: Repository<Process>,

    @InjectRepository(ProcessStep)
    private readonly stepRepository: Repository<ProcessStep>,

    @InjectRepository(EventType)
    private readonly eventTypeRepository: Repository<EventType>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Congregation)
    private readonly congregationRepository: Repository<Congregation>,

    private readonly i18n: I18nService,
  ) {}

  private async getContext(userId: string) {
    return getUserCongregationContext({
      userId,
      userRepository: this.userRepository,
      congregationRepository: this.congregationRepository,
      i18n: this.i18n,
    });
  }

  private normalizeProcessData(data: ProcessDto) {
    return {
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      enabled: data.enabled ?? true,
    };
  }

  private normalizeSteps(steps: ProcessStepDto[]) {
    return [...steps]
      .sort((left, right) => left.order - right.order)
      .map((step, index) => ({
        id: step.id,
        order: index + 1,
        name: step.name.trim(),
        description: step.description?.trim() ?? '',
        enabled: step.enabled ?? true,
      }));
  }

  private sortSteps(steps?: ProcessStep[]) {
    return [...(steps ?? [])].sort((left, right) => left.order - right.order);
  }

  private async loadProcessOrThrow({ id, congregationId }: { id: string; congregationId: string }) {
    const result = await this.repository.findOne({
      where: {
        id,
        congregation_id: congregationId,
      },
      withDeleted: true,
      relations: {
        created_by: true,
        updated_by: true,
        deleted_by: true,
        steps: {
          created_by: true,
          updated_by: true,
          deleted_by: true,
          event_type: true,
        },
      },
    });

    if (!result) throw new NotFoundException(this.i18n.t('errors.process.notFound'));

    return {
      ...cleanColumns<Process>(result),
      steps: this.sortSteps(result.steps).map((step) => cleanColumns<ProcessStep>(step)),
    };
  }

  private async syncProcessSteps({
    manager,
    existingProcess,
    steps,
    user,
    congregation,
  }: {
    manager: DataSource['manager'];
    existingProcess: Process & { steps?: ProcessStep[] };
    steps: ProcessStepDto[];
    user: User;
    congregation: Congregation;
  }) {
    const stepRepository = manager.getRepository(ProcessStep);
    const eventTypeRepository = manager.getRepository(EventType);
    const normalizedSteps = this.normalizeSteps(steps);
    const existingById = new Map((existingProcess.steps ?? []).map((step) => [step.id, step]));

    for (const stepData of normalizedSteps) {
      if (stepData.id) {
        const existingStep = existingById.get(stepData.id);

        if (existingStep) {
          existingStep.order = stepData.order;
          existingStep.name = stepData.name;
          existingStep.description = stepData.description;
          existingStep.enabled = stepData.enabled;
          existingStep.updated_by = user;
          await stepRepository.save(existingStep);

          if (existingStep.event_type) {
            existingStep.event_type.name = stepData.name;
            existingStep.event_type.description = stepData.description;
            existingStep.event_type.enabled = stepData.enabled;
            existingStep.event_type.updated_by = user;
            await eventTypeRepository.save(existingStep.event_type);
          } else {
            const createdEventType = eventTypeRepository.create({
              congregation_id: congregation.id,
              congregation,
              process_step_id: existingStep.id,
              process_step: existingStep,
              name: stepData.name,
              description: stepData.description,
              enabled: stepData.enabled,
              created_by: user,
            });
            await eventTypeRepository.save(createdEventType);
          }

          existingById.delete(stepData.id);
          continue;
        }

        throw new NotFoundException(this.i18n.t('errors.process.stepNotFound'));
      }

      const createdStep = stepRepository.create({
        process_id: existingProcess.id,
        process: existingProcess,
        order: stepData.order,
        name: stepData.name,
        description: stepData.description,
        enabled: stepData.enabled,
        created_by: user,
      });
      await stepRepository.save(createdStep);

      const createdEventType = eventTypeRepository.create({
        congregation_id: congregation.id,
        congregation,
        process_step_id: createdStep.id,
        process_step: createdStep,
        name: stepData.name,
        description: stepData.description,
        enabled: stepData.enabled,
        created_by: user,
      });
      await eventTypeRepository.save(createdEventType);
    }

    for (const step of existingById.values()) {
      step.deleted_by = user;
      await stepRepository.save(step);
      await stepRepository.softDelete(step.id);

      if (step.event_type) {
        step.event_type.enabled = false;
        step.event_type.updated_by = user;
        await eventTypeRepository.save(step.event_type);
      }
    }
  }

  async list({ query, userId }: ProcessListProps) {
    const { congregation } = await this.getContext(userId);

    const { result, total } = await findWithFilters<Process, ProcessQuery>({
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

    const processIds = result.map((process) => process.id);
    const steps =
      processIds.length > 0
        ? await this.stepRepository.find({
            where: {
              process_id: In(processIds),
              deleted_at: IsNull(),
              deleted_by: IsNull(),
            },
            relations: {
              event_type: true,
            },
            order: {
              order: 'ASC',
            },
          })
        : [];

    const stepsByProcess = new Map<string, ProcessStep[]>();
    steps.forEach((step) => {
      const current = stepsByProcess.get(step.process_id) ?? [];
      current.push(step);
      stepsByProcess.set(step.process_id, current);
    });

    return {
      result: result.map((process) => ({
        ...process,
        steps: stepsByProcess.get(process.id) ?? [],
      })),
      total,
    };
  }

  async get({ id, userId }: ProcessGetProps) {
    const { congregation } = await this.getContext(userId);
    return this.loadProcessOrThrow({ id, congregationId: congregation.id });
  }

  async create({ data, userId }: ProcessCreateProps) {
    const { user, congregation } = await this.getContext(userId);

    const createdProcess = await this.dataSource.transaction(async (manager) => {
      const processRepository = manager.getRepository(Process);
      const normalized = this.normalizeProcessData(data);

      const created = processRepository.create({
        congregation_id: congregation.id,
        congregation,
        ...normalized,
        created_by: user,
      });
      await processRepository.save(created);

      await this.syncProcessSteps({
        manager,
        existingProcess: created,
        steps: data.steps,
        user,
        congregation,
      });

      return created;
    });

    return this.loadProcessOrThrow({
      id: createdProcess.id,
      congregationId: congregation.id,
    });
  }

  async update({ id, data, userId }: ProcessUpdateProps) {
    const { user, congregation } = await this.getContext(userId);

    await this.dataSource.transaction(async (manager) => {
      const processRepository = manager.getRepository(Process);
      const existing = await processRepository.findOne({
        where: {
          id,
          congregation_id: congregation.id,
        },
        relations: {
          steps: {
            event_type: true,
          },
        },
      });

      if (!existing) throw new NotFoundException(this.i18n.t('errors.process.notFound'));

      const normalized = this.normalizeProcessData(data);
      existing.name = normalized.name;
      existing.description = normalized.description;
      existing.enabled = normalized.enabled;
      existing.updated_by = user;
      await processRepository.save(existing);

      await this.syncProcessSteps({
        manager,
        existingProcess: existing,
        steps: data.steps,
        user,
        congregation,
      });
    });

    return this.loadProcessOrThrow({ id, congregationId: congregation.id });
  }

  async remove({ id, userId }: ProcessDeleteProps) {
    const { user, congregation } = await this.getContext(userId);

    await this.dataSource.transaction(async (manager) => {
      const processRepository = manager.getRepository(Process);
      const stepRepository = manager.getRepository(ProcessStep);
      const eventTypeRepository = manager.getRepository(EventType);

      const existing = await processRepository.findOne({
        where: {
          id,
          congregation_id: congregation.id,
        },
        relations: {
          steps: {
            event_type: true,
          },
        },
      });

      if (!existing) throw new NotFoundException(this.i18n.t('errors.process.notFound'));

      existing.deleted_by = user;
      await processRepository.save(existing);
      await processRepository.softDelete(existing.id);

      for (const step of existing.steps ?? []) {
        step.deleted_by = user;
        await stepRepository.save(step);
        await stepRepository.softDelete(step.id);

        if (step.event_type) {
          step.event_type.enabled = false;
          step.event_type.updated_by = user;
          await eventTypeRepository.save(step.event_type);
        }
      }
    });

    return { deleted: true };
  }
}
