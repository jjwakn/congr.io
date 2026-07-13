import type { CalendarEvent } from '@/types/event.types';

export interface PastEventPickerDialogProps {
  confirmLabel: string;
  eventLabel: string;
  events: CalendarEvent[];
  hasMore: boolean;
  loading: boolean;
  loadingLabel: string;
  noOptionsLabel: string;
  onChange: (event: CalendarEvent | null) => void;
  onClose: () => void;
  onConfirm: () => void;
  onLoadMore: () => void;
  onSearchChange: (value: string) => void;
  open: boolean;
  search: string;
  selectedEvent: CalendarEvent | null;
  title: string;
}
