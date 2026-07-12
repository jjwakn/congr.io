import { PersonFieldsService } from '@services/persons';
import { CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD } from '@utils/customFields';
import { httpRequest } from '@utils/http';
import type { EventCustomField, EventFieldType } from '@/types/event.types';
import type { PersonField, PersonFieldType } from '@/types/person.types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const normalizeOptions = (options: string[] = []) => options.map((value) => value.trim()).filter(Boolean);

const normalizeFieldOptions = (field: EventCustomField): EventCustomField => ({
  ...field,
  options: field.type === 'options' ? normalizeOptions(field.options) : [],
  allow_multiple: field.type === 'options' ? Boolean(field.allow_multiple) : false,
  calculated_conditions: field.type === 'yes_no' ? (field.calculated_conditions ?? []) : [],
});

export const toPersonFieldType = (type: EventFieldType): PersonFieldType => {
  switch (type) {
    case 'paragraph':
      return 'paragraph';
    case 'number':
      return 'number';
    case 'yes_no':
      return 'yes_no';
    case 'options':
      return 'options';
    case 'date':
      return 'date';
    case 'text':
    default:
      return 'text';
  }
};

export const resolveEventFieldPersonLinks = async (fields: EventCustomField[]): Promise<EventCustomField[]> => {
  const normalizedFields = fields.map(normalizeFieldOptions);
  const resolvedFields = [...normalizedFields];
  const existingLinkedFieldIds = new Set<string>();

  for (const field of normalizedFields) {
    if (!field.link_person_field || field.person_field_id !== CREATE_PERSON_FIELD_FROM_CAPTURED_FIELD) continue;

    const created = await httpRequest<PersonField>({
      service: PersonFieldsService.create,
      data: {
        label: field.label,
        type: toPersonFieldType(field.type),
        required: false,
        allow_multiple: field.type === 'options' ? Boolean(field.allow_multiple) : false,
        options: field.type === 'options' ? field.options : [],
        calculated_conditions: field.type === 'yes_no' ? (field.calculated_conditions ?? []) : [],
      },
    });

    resolvedFields.forEach((resolvedField, index) => {
      if (resolvedField.id === field.id) {
        resolvedFields[index] = {
          ...resolvedField,
          person_field_id: created.id,
        };
      }
    });
  }

  resolvedFields.forEach((field) => {
    if (field.link_person_field && field.person_field_id && UUID_PATTERN.test(field.person_field_id)) {
      existingLinkedFieldIds.add(field.person_field_id);
    }
  });

  for (const personFieldId of existingLinkedFieldIds) {
    const linkedFields = resolvedFields.filter(
      (field) => field.link_person_field && field.person_field_id === personFieldId,
    );
    const sourceField = linkedFields[linkedFields.length - 1];
    if (!sourceField) continue;

    const existing = await httpRequest<PersonField>({
      service: PersonFieldsService.get,
      data: { id: personFieldId },
    });
    const saved = await httpRequest<PersonField>({
      service: PersonFieldsService.update,
      data: {
        id: existing.id,
        label: existing.label,
        type: toPersonFieldType(sourceField.type),
        required: existing.required,
        allow_multiple: sourceField.type === 'options' ? Boolean(sourceField.allow_multiple) : false,
        options: sourceField.type === 'options' ? sourceField.options : [],
        calculated_conditions: sourceField.type === 'yes_no' ? (sourceField.calculated_conditions ?? []) : [],
        enabled: existing.enabled,
      },
    });

    resolvedFields.forEach((field, index) => {
      if (!field.link_person_field || field.person_field_id !== personFieldId) return;

      resolvedFields[index] = {
        ...field,
        type: saved.type,
        allow_multiple: saved.allow_multiple,
        options: saved.options,
        calculated_conditions: saved.calculated_conditions,
      };
    });
  }

  return resolvedFields;
};
