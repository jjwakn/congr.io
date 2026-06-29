import { PersonFieldsService } from '@services/persons';
import { CREATE_PERSON_FIELD_FROM_EVENT_FIELD } from '@utils/customFields';
import { httpRequest } from '@utils/http';
import type { EventCustomField, EventFieldType } from '@/types/event.types';
import type { PersonField, PersonFieldType } from '@/types/person.types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export const resolveEventFieldPersonLinks = async (fields: EventCustomField[]): Promise<EventCustomField[]> =>
  Promise.all(
    fields.map(async (field) => {
      if (!field.link_person_field) return field;

      if (field.person_field_id && UUID_PATTERN.test(field.person_field_id)) {
        const existing = await httpRequest<PersonField>({
          service: PersonFieldsService.get,
          data: { id: field.person_field_id },
        });
        await httpRequest<PersonField>({
          service: PersonFieldsService.update,
          data: {
            id: existing.id,
            label: existing.label,
            type: toPersonFieldType(field.type),
            required: existing.required,
            allow_multiple: field.type === 'options' ? Boolean(field.allow_multiple) : false,
            options: field.type === 'options' ? field.options : [],
            calculated_conditions: field.type === 'yes_no' ? (field.calculated_conditions ?? []) : [],
            enabled: existing.enabled,
          },
        });
        return field;
      }

      if (field.person_field_id !== CREATE_PERSON_FIELD_FROM_EVENT_FIELD) return field;

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

      return {
        ...field,
        person_field_id: created.id,
      };
    }),
  );
