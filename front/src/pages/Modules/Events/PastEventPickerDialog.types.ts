import type { CalendarEvent } from '@/types/event.types';

export interface PastEventPickerDialogProps {
  confirmLabel: string;
  eventLabel: string;
  events: CalendarEvent[];
  loading: boolean;
  loadingLabel: string;
  noOptionsLabel: string;
  onChange: (event: CalendarEvent | null) => void;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  selectedEvent: CalendarEvent | null;
  title: string;
}
