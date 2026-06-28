import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index } from 'typeorm';

export type PersonFieldType = 'text' | 'paragraph' | 'number' | 'yes_no' | 'options' | 'date';

export type FieldConditionOperator =
  | 'not_empty'
  | 'empty'
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'age_greater_than'
  | 'age_less_than';

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
