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

const getSearchParamName = (field: string, index = 0) => `search_${field.replace(/[^a-zA-Z0-9_]/g, '_')}_${index}`;

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

const getRequestedColumns = (value?: string) =>
  (value ?? '')
    .split(',')
    .map((column) => column.trim())
    .filter(Boolean);

export const findWithFilters = async <Entity extends ObjectLiteral, Query extends ListParamsQuery>({
  repository,
  query,
  searchFields = [],
  booleanFields = [],
  baseWhere = {},
}: FindWithFiltersProps<Entity, Query>) => {
  const availableColumnNames = new Set(repository.metadata.columns.map((column) => column.propertyName));
  const requestedSearchFields = getRequestedColumns(query.search_columns);
  const effectiveSearchFields = Array.from(new Set([...searchFields.map(String), ...requestedSearchFields])).filter(
    (field): field is keyof Entity & string => availableColumnNames.has(field),
  );
  const searchTerms = (query.search?.trim() ?? '').split(/\s+/).filter(Boolean);
  const pageSize = Number(query.size);
  const page = Number(query.page);
  const paginate = Number.isFinite(pageSize) && pageSize > 0 && Number.isFinite(page) && page >= 0;
  const sort = Boolean(query.order && query.direction);
  const find = 'search' in query || booleanFields.some((f) => f in query);

  const orConditions: FindOptionsWhere<Entity>[] = [];
  const andConditions: Record<string, boolean> = {};

  if (find) {
    if (searchTerms.length) {
      const buildSearchValue = (field: keyof Entity, term: string, index: number) => {
        const fieldName = String(field);
        const columnType = repository.metadata.findColumnWithPropertyName(fieldName)?.type;
        const searchParamName = getSearchParamName(fieldName, index);

        return Raw((alias) => `${getSearchExpression(alias, columnType)} LIKE :${searchParamName} ESCAPE '\\'`, {
          [searchParamName]: `%${escapeLikePattern(term.toLowerCase())}%`,
        });
      };

      const appendCombinations = (
        termIndex: number,
        usedFields: Set<keyof Entity>,
        condition: FindOptionsWhere<Entity>,
      ) => {
        const term = searchTerms[termIndex];
        const isLastTerm = termIndex === searchTerms.length - 1;

        effectiveSearchFields.forEach((field) => {
          if (usedFields.has(field)) return;

          const nextCondition = {
            ...condition,
            [field]: buildSearchValue(field, term, termIndex),
          } as FindOptionsWhere<Entity>;

          if (isLastTerm) {
            orConditions.push(nextCondition);
            return;
          }

          appendCombinations(termIndex + 1, new Set([...usedFields, field]), nextCondition);
        });
      };

      if (effectiveSearchFields.length >= searchTerms.length) appendCombinations(0, new Set(), {});
    }

    booleanFields.forEach((field) => {
      if (field in query) {
        andConditions[field as string] = query[field as string];
      }
    });
  }

  const noSearchMatch = searchTerms.length > 0 && orConditions.length === 0;
  const where = noSearchMatch
    ? ({
        ...baseWhere,
        id: Raw(() => 'FALSE'),
        ...andConditions,
      } as FindOptionsWhere<Entity>)
    : orConditions.length > 0
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
