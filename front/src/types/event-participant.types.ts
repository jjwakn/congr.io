import type { CommonEntity } from './common.types';
import type { JsonObject } from './json.types';
import type { Person } from './person.types';

export interface EventParticipant extends CommonEntity {
  id: string;
  event_id: string;
  person_id?: string;
  person?: Person;
  possible_person?: Person | null;
  attended: boolean;
  public_submission: boolean;
  public_submission_id?: string;
  field_values: JsonObject;
  submitted_person: JsonObject;
}
