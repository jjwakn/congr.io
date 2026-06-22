import type { EventCustomField } from '@/types/event.types';

export interface EventRegistrationFieldsProps {
  fields: EventCustomField[];
  values: Record<string, unknown>;
  publicOnly?: boolean;
  onChange: (value: Record<string, unknown>) => void;
}
