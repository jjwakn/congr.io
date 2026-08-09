import { I18nContext } from 'nestjs-i18n';
import { CommonEntity, FindWithFiltersProps, ListParamsQuery } from 'src/common/common.types';
import { MAX_PAGE_SIZE, MAX_SEARCH_COLUMNS, MAX_SEARCH_LENGTH, MAX_SEARCH_TERMS } from 'src/config/security';
import { And, ColumnType, FindOperator, FindOptionsOrder, FindOptionsWhere, ObjectLiteral, Raw } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

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

const getSearchParamName = (field: string, termIndex: number) =>
  `search_${field.replace(/[^a-zA-Z0-9_]/g, '_')}_${termIndex}`;

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

const translateQueryError = (key: string): string => {
  const translated = I18nContext.current()?.t(key);
  return typeof translated === 'string' ? translated : key;
};

export const findWithFilters = async <Entity extends ObjectLiteral, Query extends ListParamsQuery>({
  repository,
  query,
  searchFields = [],
  allowedSearchFields = searchFields,
  booleanFields = [],
  baseWhere = {},
}: FindWithFiltersProps<Entity, Query>) => {
  const availableColumnNames = new Set(repository.metadata.columns.map((column) => column.propertyName));
  const allowedSearchFieldNames = new Set(allowedSearchFields.map(String));
  const requestedSearchFields = getRequestedColumns(query.search_columns).slice(0, MAX_SEARCH_COLUMNS);
  const effectiveSearchFields = Array.from(new Set([...searchFields.map(String), ...requestedSearchFields])).filter(
    (field): field is keyof Entity & string => availableColumnNames.has(field) && allowedSearchFieldNames.has(field),
  );
  const normalizedSearch = query.search?.trim() ?? '';
  if (normalizedSearch.length > MAX_SEARCH_LENGTH) {
    throw new BadRequestException(translateQueryError('errors.query.searchTooLong'));
  }
  const searchTerms = normalizedSearch.split(/\s+/).filter(Boolean);
  if (searchTerms.length > MAX_SEARCH_TERMS) {
    throw new BadRequestException(translateQueryError('errors.query.tooManySearchTerms'));
  }
  const requestedPageSize = Number(query.size);
  const pageSize =
    Number.isFinite(requestedPageSize) && requestedPageSize > 0 ? Math.min(requestedPageSize, MAX_PAGE_SIZE) : 50;
  const requestedPage = Number(query.page);
  const page = Number.isFinite(requestedPage) && requestedPage >= 0 ? requestedPage : 0;
  const sort = Boolean(query.order && query.direction);
  const find = 'search' in query || booleanFields.some((f) => f in query);

  const andConditions: Record<string, boolean> = {};

  if (find) {
    booleanFields.forEach((field) => {
      if (field in query) {
        andConditions[field as string] = query[field as string];
      }
    });
  }

  const mutableWhere = { ...baseWhere, ...andConditions } as Record<
    string,
    FindOperator<Entity[keyof Entity]> | boolean
  >;
  if (searchTerms.length) {
    const primaryField = String(repository.metadata.primaryColumns?.[0]?.propertyName ?? 'id');
    const existingPrimaryCondition = mutableWhere[primaryField] as FindOperator<Entity[keyof Entity]> | undefined;
    const parameters: Record<string, string> = {};
    const searchCondition = Raw((primaryAlias) => {
      if (!effectiveSearchFields.length) return 'FALSE';
      const separatorIndex = primaryAlias.lastIndexOf('.');
      const tableAlias = separatorIndex >= 0 ? primaryAlias.slice(0, separatorIndex) : '';
      return searchTerms
        .map((term, termIndex) => {
          const fieldConditions = effectiveSearchFields.map((field) => {
            const fieldName = String(field);
            const column = repository.metadata.findColumnWithPropertyName(fieldName);
            const columnName = column?.databaseName ?? fieldName;
            const columnAlias = tableAlias ? `${tableAlias}."${columnName.replace(/"/g, '""')}"` : columnName;
            const parameterName = getSearchParamName(fieldName, termIndex);
            parameters[parameterName] = `%${escapeLikePattern(term.toLowerCase())}%`;
            return `${getSearchExpression(columnAlias, column?.type)} LIKE :${parameterName} ESCAPE '\\'`;
          });
          return `(${fieldConditions.join(' OR ')})`;
        })
        .join(' AND ');
    }, parameters);
    mutableWhere[primaryField] = (
      existingPrimaryCondition ? And(existingPrimaryCondition, searchCondition) : searchCondition
    ) as FindOperator<Entity[keyof Entity]>;
  }
  const where = mutableWhere as FindOptionsWhere<Entity>;

  const [result, total] = await repository.findAndCount({
    take: pageSize,
    skip: pageSize * page,
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
