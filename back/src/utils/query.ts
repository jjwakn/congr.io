import {
  CaseInsensitiveWhereProps,
  CommonEntity,
  FindWithFiltersProps,
  ListParamsQuery,
} from 'src/common/common.types';
import { ColumnType, FindOptionsOrder, FindOptionsWhere, ObjectLiteral, Raw } from 'typeorm';
import { NUMERIC_COLUMN_TYPES } from './constants';

export const caseInsensitiveWhere = ({ alias, search }: CaseInsensitiveWhereProps) =>
  `LOWER(${alias}) LIKE '%${search.toLowerCase()}%'`;

export const findWithFilters = async <Entity extends ObjectLiteral, Query extends ListParamsQuery>({
  repository,
  query,
  searchFields = [],
  booleanFields = [],
  baseWhere = {} as FindOptionsWhere<Entity>,
}: FindWithFiltersProps<Entity, Query>) => {
  const search = query.search?.trim() ?? '';
  const paginate = 'size' in query && 'page' in query;
  const sort = 'order' in query && 'direction' in query;
  const find = 'search' in query || booleanFields.some((f) => f in query);

  const orConditions: FindOptionsWhere<Entity>[] = [];
  const andConditions: Record<string, boolean> = {};

  if (find) {
    if (search)
      searchFields.forEach((field) => {
        orConditions.push({
          [field]: NUMERIC_COLUMN_TYPES.has(
            repository.metadata.findColumnWithPropertyName(field as string)?.type as ColumnType,
          )
            ? Raw((alias) => `${alias}::text LIKE '%${search}%'`)
            : Raw((alias) => caseInsensitiveWhere({ alias, search })),
        } as FindOptionsWhere<Entity>);
      });

    booleanFields.forEach((field) => {
      if (field in query) {
        andConditions[field as string] = query[field as string];
      }
    });
  }

  const where =
    orConditions.length > 0
      ? (orConditions.map((cond) => ({
          ...baseWhere,
          ...cond,
          ...andConditions,
        })) as FindOptionsWhere<Entity>[])
      : Object.keys(andConditions).length > 0
        ? ({ ...baseWhere, ...andConditions } as FindOptionsWhere<Entity>)
        : baseWhere;

  const [result, total] = await repository.findAndCount({
    ...(paginate && { take: query.size, skip: query.size * query.page }),
    ...(sort && {
      order: { [query.order]: query.direction } as FindOptionsOrder<Entity>,
    }),
    where,
  });

  return { result, total };
};

export const cleanColumns = <T extends CommonEntity>(entity: CommonEntity) => {
  const newEntity: T & CommonEntity = { ...entity } as T;

  if (newEntity.created_by) delete newEntity.created_by.password;
  if (newEntity.updated_by) delete newEntity.updated_by.password;
  if (newEntity.deleted_by) delete newEntity.deleted_by.password;

  return newEntity;
};
