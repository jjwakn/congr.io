import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index } from 'typeorm';

export type PersonFieldType = 'text' | 'paragraph' | 'number' | 'yes_no' | 'options' | 'date';

export type FieldConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty'
  | 'is_true'
  | 'is_false';

export interface FieldCondition {
  field_id: string;
  operator: FieldConditionOperator;
  value?: string | number | boolean | null;
}

@Entity('person_field')
@Index('UQ_person_field_congregation_label', ['congregation_id', 'label'], { unique: true })
export class PersonField extends CommonEntity {
  @Column({ type: 'uuid', nullable: false }) congregation_id: string;
  @Column({ nullable: false, length: 160 }) label: string;
  @Column({ nullable: false, length: 40 }) type: PersonFieldType;
  @Column({ nullable: false, default: false }) required: boolean;
  @Column({ nullable: false, default: false }) allow_multiple: boolean;
  @Column('simple-json', { nullable: false, default: [] }) options: string[];
  @Column('simple-json', { nullable: false, default: [] }) calculated_conditions: FieldCondition[];
}
