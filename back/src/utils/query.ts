import { CommonEntity, ListParamsQuery } from './common.types';

export const caseInsensitiveWhere = (alias: string, search: string) =>
  `LOWER(${alias}) LIKE '%${search.toLowerCase()}%'`;

export const getListVariables = (
  query: ListParamsQuery,
  extraFind: string[] = [],
) => {
  const paginate = 'size' in query && 'page' in query;
  const sort = 'order' in query && 'direction' in query;
  let find = 'search' in query || 'enabled' in query;

  extraFind.forEach((f) => {
    if (f in query) find = true;
  });

  return { paginate, sort, find };
};

export const cleanColumns = <T extends CommonEntity>(entity: CommonEntity) => {
  const newEntity: T & CommonEntity = { ...entity } as T;

  if (newEntity.created_by) delete newEntity.created_by.password;
  if (newEntity.updated_by) delete newEntity.updated_by.password;
  if (newEntity.deleted_by) delete newEntity.deleted_by.password;

  return newEntity;
};
