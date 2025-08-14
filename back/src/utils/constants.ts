import { PermissionType } from 'src/modules/permission/permission.types';
import { ColumnType } from 'typeorm';

//#region Enums
export enum ModuleAction {
  get = 'get',
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export enum Module {
  user = 'user',
  role = 'role',
}
//#endregion

//#region Constants
export const PORT = process.env.PORT ?? 4000;
export const TOKEN_SECRET = process.env.TOKEN_SECRET ?? '123';

export const actions = {
  [ModuleAction.get]: 'Ver',
  [ModuleAction.create]: 'Crear',
  [ModuleAction.update]: 'Actualizar',
  [ModuleAction.delete]: 'Eliminar',
};

export const permission: PermissionType = {
  user: {
    name: 'Usuarios',
    permissions: [
      ModuleAction.get,
      ModuleAction.create,
      ModuleAction.update,
      ModuleAction.delete,
    ],
  },
  role: {
    name: 'Roles',
    permissions: [
      ModuleAction.get,
      ModuleAction.create,
      ModuleAction.update,
      ModuleAction.delete,
    ],
  },
};

export const NUMERIC_COLUMN_TYPES = new Set<ColumnType>([
  'int',
  'int2',
  'int4',
  'int8',
  'integer',
  'tinyint',
  'smallint',
  'mediumint',
  'bigint',
  'dec',
  'decimal',
  'smalldecimal',
  'fixed',
  'numeric',
  'number',
  'float',
  'double',
  'real',
  'double precision',
  'float4',
  'float8',
  'float64',
  'smallmoney',
  'money',
  'int64',
  'unsigned big int',
  'int4range',
  'int8range',
  'numrange',
  'int4multirange',
  'int8multirange',
  'nummultirange',
]);

//#endregion
