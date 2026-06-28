import type { CommonEntity } from './common.types';
import type { EventType } from './event-type.types';

export interface ProcessStep extends CommonEntity {
  process_id: string;
  order: number;
  name: string;
  description: string;
  flow_key?: string | null;
  next_step_keys: string[];
  complete_previous_steps: boolean;
  event_type?: EventType | null;
}

export interface Process extends CommonEntity {
  congregation_id: string;
  name: string;
  description: string;
  steps: ProcessStep[];
}

export interface ProcessStepInput {
  id?: string;
  flow_key: string;
  next_step_keys: string[];
  complete_previous_steps: boolean;
  order: number;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ProcessInput {
  name: string;
  description: string;
  enabled: boolean;
  steps: ProcessStepInput[];
}
