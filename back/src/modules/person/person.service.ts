import { DateTime } from 'luxon';
import { I18nService } from 'nestjs-i18n';
import { getUserCongregationContext } from 'src/utils/congregation-context';
import { cleanColumns, findWithFilters } from 'src/utils/query';
import { DataSource, IsNull, Like, Repository } from 'typeorm';
import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { User } from '../user/user.entity';
import { Person } from './person.entity';
import type { PersonActionProps, PersonCreateProps, PersonListProps, PersonUpdateProps } from './person.types';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person) private readonly repository: Repository<Person>,
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

  private async nextCode(congregationId: string, lastName: string, secondLastName?: string) {
    const prefix =
      `${lastName.trim()[0] ?? 'X'}${secondLastName?.trim()[0] ?? lastName.trim()[1] ?? 'X'}`.toUpperCase();
    const existing = await this.repository.find({
      where: { congregation_id: congregationId, code: Like(`${prefix}%`) },
      select: { code: true },
      withDeleted: true,
    });
    const max = existing.reduce((value, { code }) => Math.max(value, Number(code.slice(prefix.length)) || 0), 0);
    return `${prefix}${max + 1}`;
  }

  private createCodeHistoryEntry(code: string) {
    return {
      code,
      generated_at: DateTime.utc().toISO() ?? new Date().toISOString(),
    };
  }

  private normalize(data: PersonCreateProps['data'], defaultEnabled = true) {
    return {
      first_name: data.first_name.trim(),
      middle_name: data.middle_name?.trim() || null,
      last_name: data.last_name.trim(),
      second_last_name: data.second_last_name?.trim() || null,
      married_name: data.married_name?.trim() || null,
      phone: data.phone?.trim() ?? '',
      birthdate: data.birthdate || null,
      registered_age: data.birthdate ? null : (data.age ?? null),
      age_recorded_at: !data.birthdate && data.age !== undefined ? DateTime.now().toISODate() : null,
      email: data.email?.trim() || null,
      user_id: data.user_id ?? null,
      enabled: data.enabled ?? defaultEnabled,
      custom_values: data.custom_values ?? {},
    };
  }

  async list({ query, userId, congregationId }: PersonListProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    return findWithFilters<Person, typeof query>({
      repository: this.repository,
      query,
      searchFields: ['code', 'first_name', 'middle_name', 'last_name', 'second_last_name', 'phone', 'email'],
      booleanFields: ['enabled'],
      baseWhere: { congregation_id: congregation.id, deleted_at: IsNull() },
    });
  }

  async get({ id, userId, congregationId }: PersonActionProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    const result = await this.repository.findOne({
      where: { id, congregation_id: congregation.id },
      relations: { user: true, created_by: true, updated_by: true },
    });
    if (!result) throw new NotFoundException(this.i18n.t('errors.person.notFound'));
    if (result.user) delete result.user.password;
    return cleanColumns<Person>(result);
  }

  async getFlows({ id, userId, congregationId }: PersonActionProps) {
    const { congregation } = await this.getContext(userId, congregationId);
    const person = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!person) throw new NotFoundException(this.i18n.t('errors.person.notFound'));
    const rows = await this.dataSource.query<
      Array<{
        process_id: string;
        process_name: string;
        step_id: string;
        flow_key: string | null;
        step_name: string;
        step_description: string;
        next_step_keys: string[] | null;
        completed_at: Date | null;
      }>
    >(
      `SELECT "p"."id" AS "process_id", "p"."name" AS "process_name",
        "ps"."id" AS "step_id", "ps"."flow_key" AS "flow_key",
        "ps"."name" AS "step_name", "ps"."description" AS "step_description",
        "ps"."next_step_keys" AS "next_step_keys",
        MIN(CASE WHEN "ep"."id" IS NOT NULL THEN "e"."start_datetime" END) AS "completed_at"
       FROM "process" "p"
       INNER JOIN "process_step" "ps" ON "ps"."process_id" = "p"."id" AND "ps"."deleted_at" IS NULL
       LEFT JOIN "event_type" "et" ON "et"."process_step_id" = "ps"."id" AND "et"."deleted_at" IS NULL
       LEFT JOIN "event" "e" ON "e"."event_type_id" = "et"."id" AND "e"."deleted_at" IS NULL
       LEFT JOIN "event_participant" "ep" ON "ep"."event_id" = "e"."id"
         AND "ep"."person_id" = $1 AND "ep"."attended" = TRUE AND "ep"."deleted_at" IS NULL
       WHERE "p"."congregation_id" = $2 AND "p"."deleted_at" IS NULL
       GROUP BY "p"."id", "p"."name", "ps"."id", "ps"."flow_key", "ps"."name",
         "ps"."description", "ps"."next_step_keys", "ps"."order"
       ORDER BY "p"."name", "ps"."order"`,
      [id, congregation.id],
    );
    const flows = new Map<string, { id: string; name: string; steps: typeof rows }>();
    rows.forEach((row) => {
      const flow = flows.get(row.process_id) ?? { id: row.process_id, name: row.process_name, steps: [] };
      flow.steps.push(row);
      flows.set(row.process_id, flow);
    });
    return Array.from(flows.values());
  }

  async create({ data, userId, congregationId }: PersonCreateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    if (data.user_id && (await this.repository.findOne({ where: { user_id: data.user_id } })))
      throw new NotAcceptableException(this.i18n.t('errors.person.userInUse'));
    const code = await this.nextCode(congregation.id, data.last_name, data.second_last_name);
    const created = this.repository.create({
      ...this.normalize(data),
      congregation_id: congregation.id,
      congregation,
      code,
      code_history: [this.createCodeHistoryEntry(code)],
      created_by: user,
    });
    return this.get({ id: (await this.repository.save(created)).id, userId, congregationId });
  }

  async update({ id, data, userId, congregationId }: PersonUpdateProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!existing) throw new NotFoundException(this.i18n.t('errors.person.notFound'));
    const linkedPerson = data.user_id ? await this.repository.findOne({ where: { user_id: data.user_id } }) : null;
    if (linkedPerson && linkedPerson.id !== existing.id)
      throw new NotAcceptableException(this.i18n.t('errors.person.userInUse'));
    const normalized = this.normalize(data, existing.enabled);
    const nextCode = data.regenerate_code
      ? await this.nextCode(congregation.id, normalized.last_name, normalized.second_last_name ?? undefined)
      : existing.code;
    Object.assign(existing, normalized, { updated_by: user });
    if (data.regenerate_code && nextCode !== existing.code) {
      existing.code = nextCode;
      existing.code_history = [...(existing.code_history ?? []), this.createCodeHistoryEntry(nextCode)];
    } else if (!existing.code_history?.length) {
      existing.code_history = [this.createCodeHistoryEntry(existing.code)];
    }
    await this.repository.save(existing);
    return this.get({ id, userId, congregationId });
  }

  async remove({ id, userId, congregationId }: PersonActionProps) {
    const { user, congregation } = await this.getContext(userId, congregationId);
    const existing = await this.repository.findOne({ where: { id, congregation_id: congregation.id } });
    if (!existing) throw new NotFoundException(this.i18n.t('errors.person.notFound'));
    existing.deleted_by = user;
    await this.repository.save(existing);
    await this.repository.softDelete(id);
    return { deleted: true };
  }
}
