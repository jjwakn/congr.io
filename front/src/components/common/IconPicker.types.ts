export interface IconPickerProps {
  label: string;
  value: string;
  disabled?: boolean;
  iconColor?: string;
  onChange: (value: string) => void;
}
