import type { EventParticipant } from '@/types/event-participant.types';
import type { CalendarEvent } from '@/types/event.types';
import type { PersonField } from '@/types/person.types';

export type EventParticipantsEditorMode = 'attendance' | 'registration';

export interface EventParticipantsEditorDialogProps {
  canAdd: boolean;
  canCreatePerson: boolean;
  canCreatePersonFields: boolean;
  canRemove: boolean;
  canUpdateAttendance?: boolean;
  event: CalendarEvent | null;
  mode: EventParticipantsEditorMode;
  onClose: () => void;
  onReload: () => Promise<void>;
  open: boolean;
  participants: EventParticipant[];
  personFields: PersonField[];
}
