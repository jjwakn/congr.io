import { EventFieldsService } from '@services/eventFields';
import type { EventCustomField, EventField } from '@/types/event.types';
import { httpRequest } from './http';

export const persistNewEventFields = (fields: EventCustomField[]) =>
  Promise.all(
    fields.map(async (field) => {
      if (field.event_field_id) return field;
      const created = await httpRequest<EventField>({
        service: EventFieldsService.create,
        data: {
          label: field.label,
          type: field.type,
          required: field.required,
          user_fillable: field.user_fillable,
          person_field_id: field.person_field_id,
          options: field.options,
        },
      });
      return { ...field, id: created.id, event_field_id: created.id };
    }),
  );
