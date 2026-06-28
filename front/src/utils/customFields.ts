import { DateTime } from 'luxon';
import type { EventFieldType } from '@/types/event.types';
import type { JsonObject, JsonValue } from '@/types/json.types';
import type { FieldCondition, PersonField, PersonFieldType } from '@/types/person.types';

export interface StandardFieldDefinition {
  id: string;
  labelKey: string;
  type: PersonFieldType | EventFieldType;
  options: string[];
  allow_multiple?: boolean;
  persistent: true;
}

export const STANDARD_PERSON_FIELDS: StandardFieldDefinition[] = [
  { id: 'first_name', labelKey: 'pages.persons.fields.firstName', type: 'text', options: [], persistent: true },
  { id: 'middle_name', labelKey: 'pages.persons.fields.middleName', type: 'text', options: [], persistent: true },
  { id: 'last_name', labelKey: 'pages.persons.fields.lastName', type: 'text', options: [], persistent: true },
  {
    id: 'second_last_name',
    labelKey: 'pages.persons.fields.secondLastName',
    type: 'text',
    options: [],
    persistent: true,
  },
  { id: 'married_name', labelKey: 'pages.persons.fields.marriedName', type: 'text', options: [], persistent: true },
  { id: 'phone', labelKey: 'pages.persons.fields.phone', type: 'text', options: [], persistent: true },
  { id: 'birthdate', labelKey: 'pages.persons.fields.birthdate', type: 'date', options: [], persistent: true },
  { id: 'email', labelKey: 'pages.persons.fields.email', type: 'text', options: [], persistent: true },
];

export const STANDARD_EVENT_FIELDS: StandardFieldDefinition[] = [
  { id: 'name', labelKey: 'pages.events.form.name', type: 'text', options: [], persistent: true },
  { id: 'event_type_id', labelKey: 'pages.events.form.type', type: 'text', options: [], persistent: true },
  { id: 'description', labelKey: 'pages.events.form.description', type: 'paragraph', options: [], persistent: true },
  { id: 'start_date', labelKey: 'pages.events.form.startDate', type: 'date', options: [], persistent: true },
  { id: 'start_time', labelKey: 'pages.events.form.startTime', type: 'text', options: [], persistent: true },
  { id: 'end_date', labelKey: 'pages.events.form.endDate', type: 'date', options: [], persistent: true },
  { id: 'end_time', labelKey: 'pages.events.form.endTime', type: 'text', options: [], persistent: true },
  { id: 'all_day', labelKey: 'pages.events.form.allDay', type: 'yes_no', options: [], persistent: true },
  { id: 'is_public', labelKey: 'pages.events.form.public', type: 'yes_no', options: [], persistent: true },
  { id: 'attendance_enabled', labelKey: 'pages.events.form.attendance', type: 'yes_no', options: [], persistent: true },
  {
    id: 'self_registration_enabled',
    labelKey: 'pages.events.form.selfRegistration',
    type: 'yes_no',
    options: [],
    persistent: true,
  },
];

const normalizeComparable = (value: JsonValue | undefined) =>
  typeof value === 'string' ? value.trim().toLowerCase() : typeof value === 'number' ? value : value;

const toNumber = (value: JsonValue | undefined) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const getAge = (value: JsonValue | undefined) => {
  if (typeof value !== 'string' || !value.trim()) return null;
  const birthdate = DateTime.fromISO(value);
  if (!birthdate.isValid) return null;
  return Math.floor(Math.abs(birthdate.diffNow('years').years));
};

export const getFieldValueForCondition = ({
  condition,
  standardValues,
  customValues,
}: {
  condition: FieldCondition;
  standardValues: JsonObject;
  customValues: JsonObject;
}) => (condition.field_id in standardValues ? standardValues[condition.field_id] : customValues[condition.field_id]);

export const evaluateCondition = ({
  condition,
  value,
}: {
  condition: FieldCondition;
  value: JsonValue | undefined;
}): boolean => {
  const expected = condition.value;

  switch (condition.operator) {
    case 'not_empty':
      return Array.isArray(value)
        ? value.length > 0
        : value !== undefined && value !== null && String(value).trim() !== '';
    case 'empty':
      return Array.isArray(value)
        ? value.length === 0
        : value === undefined || value === null || String(value).trim() === '';
    case 'equals':
      return normalizeComparable(value) === normalizeComparable(expected);
    case 'not_equals':
      return normalizeComparable(value) !== normalizeComparable(expected);
    case 'greater_than': {
      const actualNumber = toNumber(value);
      const expectedNumber = toNumber(expected);
      return actualNumber !== null && expectedNumber !== null && actualNumber > expectedNumber;
    }
    case 'less_than': {
      const actualNumber = toNumber(value);
      const expectedNumber = toNumber(expected);
      return actualNumber !== null && expectedNumber !== null && actualNumber < expectedNumber;
    }
    case 'age_greater_than': {
      const actualAge = getAge(value);
      const expectedNumber = toNumber(expected);
      return actualAge !== null && expectedNumber !== null && actualAge > expectedNumber;
    }
    case 'age_less_than': {
      const actualAge = getAge(value);
      const expectedNumber = toNumber(expected);
      return actualAge !== null && expectedNumber !== null && actualAge < expectedNumber;
    }
    default:
      return false;
  }
};

export const evaluateCalculatedField = ({
  field,
  standardValues,
  customValues,
}: {
  field: Pick<PersonField, 'calculated_conditions'>;
  standardValues: JsonObject;
  customValues: JsonObject;
}) =>
  Boolean(field.calculated_conditions?.length) &&
  field.calculated_conditions.every((condition) =>
    evaluateCondition({
      condition,
      value: getFieldValueForCondition({ condition, standardValues, customValues }),
    }),
  );
