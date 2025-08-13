import { PermissionType } from 'src/modules/permission/permission.types';

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
//#endregion
