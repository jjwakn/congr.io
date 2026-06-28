export interface OptionsListEditorProps {
  label: string;
  addLabel: string;
  removeLabel: string;
  values: string[];
  disabled?: boolean;
  onChange: (values: string[]) => void;
}
