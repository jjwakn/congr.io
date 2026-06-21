import type { CommonEntity } from './common.types.js';

export interface EventType extends CommonEntity {
  id: string;
  congregation_id: string;
  name: string;
  description: string;
  enabled: boolean;
}
