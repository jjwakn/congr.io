import { FeatureTreeType } from 'src/modules/feature/feature.types';
import { PermissionType } from 'src/modules/permission/permission.types';
import { ColumnType } from 'typeorm';

//#region Enums
export enum ModuleAction {
  get = 'get',
  create = 'create',
  update = 'update',
  delete = 'delete',
  change_password = 'change_password',
  lock = 'lock',
}

export enum Module {
  user = 'user',
  role = 'role',
  congregation = 'congregation',
  configuration = 'configuration',
  process = 'process',
  event = 'event',
  event_type = 'event_type',
  person = 'person',
  person_field = 'person_field',
  event_attendance = 'event_attendance',
  event_registration = 'event_registration',
}

export enum Feature {
  Users = 'users',
  Members = 'members',
  Processes = 'processes',
  EventsCalendar = 'events_calendar',
  EventsAttendance = 'events_attendance',
  PublicEvents = 'public_events',
  Ministries = 'ministries',
  MinistriesCalendar = 'ministries_calendar',
}
//#endregion

//#region Constants
export const PORT = process.env.PORT ?? 4000;
export const TOKEN_SECRET = process.env.TOKEN_SECRET ?? '123';

const CRUD: ModuleAction[] = [ModuleAction.get, ModuleAction.create, ModuleAction.update, ModuleAction.delete];

export const permission: PermissionType = {
  user: {
    permissions: [...CRUD, ModuleAction.change_password],
  },
  role: {
    permissions: CRUD,
  },
  congregation: {
    permissions: CRUD,
  },
  process: {
    permissions: CRUD,
  },
  event: {
    permissions: CRUD,
  },
  event_type: {
    permissions: CRUD,
  },
  person: {
    permissions: CRUD,
  },
  person_field: {
    permissions: CRUD,
  },
  event_attendance: {
    permissions: CRUD,
  },
  event_registration: {
    permissions: [...CRUD, ModuleAction.lock],
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

export const FeatureTree: FeatureTreeType = {
  [Feature.Users]: {
    required: true,
    prerequisites: [],
  },
  [Feature.Members]: {
    prerequisites: [],
  },
  [Feature.Processes]: {
    prerequisites: [Feature.Members, Feature.EventsCalendar],
  },
  [Feature.EventsCalendar]: {
    prerequisites: [],
  },
  [Feature.EventsAttendance]: {
    prerequisites: [Feature.EventsCalendar, Feature.Members],
  },
  [Feature.PublicEvents]: {
    prerequisites: [Feature.EventsCalendar],
  },
  [Feature.Ministries]: {
    prerequisites: [Feature.Users, Feature.Members],
  },
  [Feature.MinistriesCalendar]: {
    prerequisites: [Feature.Users, Feature.Members, Feature.Ministries],
  },
};
//#endregion
