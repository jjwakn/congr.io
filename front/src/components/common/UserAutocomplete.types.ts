import type { User } from '@/types/user.types';

export interface UserAutocompleteProps {
  value: User | null;
  disabled?: boolean;
  label: string;
  onChange: (user: User | null) => void;
}
