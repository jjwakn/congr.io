import { PersonFieldsService } from '@services/persons';
import { CREATE_PERSON_FIELD_FROM_EVENT_FIELD } from '@utils/customFields';
import { httpRequest } from '@utils/http';
import type { EventCustomField, EventFieldType } from '@/types/event.types';
import type { PersonField, PersonFieldType } from '@/types/person.types';

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
      if (!field.link_person_field || field.person_field_id !== CREATE_PERSON_FIELD_FROM_EVENT_FIELD) return field;

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
