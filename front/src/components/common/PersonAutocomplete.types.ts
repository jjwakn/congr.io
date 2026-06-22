import type { Person } from '@/types/person.types';

export interface PersonAutocompleteProps {
  value: Person | null;
  disabled?: boolean;
  label: string;
  onChange: (person: Person | null) => void;
}
