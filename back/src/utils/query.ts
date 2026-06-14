import { CommonEntity, FindWithFiltersProps, ListParamsQuery } from 'src/common/common.types';
import { ColumnType, FindOptionsOrder, FindOptionsWhere, ObjectLiteral, Raw } from 'typeorm';

const TEXT_COLUMN_TYPES = new Set<ColumnType>([
  String,
  'char',
  'nchar',
  'nvarchar',
  'varchar',
  'character',
  'character varying',
  'text',
  'tinytext',
  'mediumtext',
  'longtext',
  'citext',
  'clob',
]);

const isTextColumnType = (type?: ColumnType) => Boolean(type && TEXT_COLUMN_TYPES.has(type));

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&');

const getSearchParamName = (field: string) => `search_${field.replace(/[^a-zA-Z0-9_]/g, '_')}`;

const normalizeColumnAlias = (alias: string) => {
  const unquotedAliasMatch = alias.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)$/);

  if (!unquotedAliasMatch) return alias;

  const [, tableAlias, columnAlias] = unquotedAliasMatch;
  return `"${tableAlias}"."${columnAlias}"`;
};

const getSearchExpression = (alias: string, columnType?: ColumnType) =>
  isTextColumnType(columnType)
    ? `LOWER(${normalizeColumnAlias(alias)})`
    : `LOWER(CAST(${normalizeColumnAlias(alias)} AS text))`;

export const findWithFilters = async <Entity extends ObjectLiteral, Query extends ListParamsQuery>({
  repository,
  query,
  searchFields = [],
  booleanFields = [],
  baseWhere = {},
}: FindWithFiltersProps<Entity, Query>) => {
  const search = query.search?.trim() ?? '';
  const pageSize = Number(query.size);
  const page = Number(query.page);
  const paginate = Number.isFinite(pageSize) && pageSize > 0 && Number.isFinite(page) && page >= 0;
  const sort = Boolean(query.order && query.direction);
  const find = 'search' in query || booleanFields.some((f) => f in query);

  const orConditions: FindOptionsWhere<Entity>[] = [];
  const andConditions: Record<string, boolean> = {};

  if (find) {
    if (search)
      searchFields.forEach((field) => {
        const fieldName = String(field);
        const columnType = repository.metadata.findColumnWithPropertyName(fieldName)?.type;
        const searchParamName = getSearchParamName(fieldName);

        orConditions.push({
          [field]: Raw((alias) => `${getSearchExpression(alias, columnType)} LIKE :${searchParamName} ESCAPE '\\'`, {
            [searchParamName]: `%${escapeLikePattern(search.toLowerCase())}%`,
          }),
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
    ...(paginate && { take: pageSize, skip: pageSize * page }),
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
