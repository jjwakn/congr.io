import { genSalt, hash } from 'bcrypt';
import { TokenPayload } from 'src/common/common.types';
import { UserPermission } from 'src/modules/permission/permission.types';
import { Role } from 'src/modules/role/role.entity';
import { ModuleAction } from './constants';

export const decodeToken = (token: string) => {
  const base64Payload = token.split('.')[1];
  const payloadBuffer = Buffer.from(base64Payload, 'base64');
  const payload = JSON.parse(payloadBuffer.toString()) as TokenPayload;

  return payload;
};

export const mergePermissions = (roles: Role[]) => {
  const fullAccess = roles.some((r) => r.full_access);
  const permissions: UserPermission = {};
  if (!fullAccess)
    roles.forEach((role) => {
      if (role.permissions)
        Object.keys(role.permissions).forEach((permission) => {
          if (!permissions[permission]) permissions[permission] = [];

          role.permissions[permission].forEach((p) => {
            if (!(permissions[permission] as ModuleAction[]).includes(p as ModuleAction))
              (permissions[permission] as ModuleAction[]).push(p as ModuleAction);
          });
        });
    });

  return { fullAccess, permissions };
};

export const encryptPassword = async (password: string) => {
  const salt = await genSalt(10);
  const encrypted = await hash(password, salt);
  return encrypted;
};
