import { EventFieldsService } from '@services/eventFields';
import type { EventCustomField, EventField } from '@/types/event.types';
import { httpRequest } from './http';

export const persistNewEventFields = (fields: EventCustomField[]) =>
  Promise.all(
    fields.map(async (field) => {
      if (field.event_field_id) {
        await httpRequest<EventField>({
          service: EventFieldsService.update,
          data: {
            id: field.event_field_id,
            label: field.label,
            type: field.type,
            required: field.required,
            user_fillable: field.user_fillable,
            link_person_field: field.link_person_field,
            person_field_id: field.person_field_id,
            allow_multiple: field.allow_multiple,
            options: field.options,
            calculated_conditions: field.calculated_conditions,
          },
        });
        return field;
      }
      const created = await httpRequest<EventField>({
        service: EventFieldsService.create,
        data: {
          label: field.label,
          type: field.type,
          required: field.required,
          user_fillable: field.user_fillable,
          link_person_field: field.link_person_field,
          person_field_id: field.person_field_id,
          allow_multiple: field.allow_multiple,
          options: field.options,
          calculated_conditions: field.calculated_conditions,
        },
      });
      return { ...field, id: created.id, event_field_id: created.id };
    }),
  );
