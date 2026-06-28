import type { FieldCondition, FieldConditionOperator } from '@/types/person.types';

export interface FieldConditionOption {
  id: string;
  label: string;
  type: string;
  options?: string[];
}

export interface FieldConditionsEditorProps {
  fields: FieldConditionOption[];
  value: FieldCondition[];
  fieldLabel: string;
  operatorLabel: string;
  valueLabel: string;
  addLabel: string;
  removeLabel: string;
  trueLabel: string;
  falseLabel: string;
  operatorLabels: Record<FieldConditionOperator, string>;
  disabled?: boolean;
  onChange: (value: FieldCondition[]) => void;
}
