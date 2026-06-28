import type { EventCustomField } from '@/types/event.types';
import type { JsonObject } from '@/types/json.types';

export interface EventRegistrationFieldsProps {
  fields: EventCustomField[];
  values: JsonObject;
  publicOnly?: boolean;
  onChange: (value: JsonObject) => void;
}
