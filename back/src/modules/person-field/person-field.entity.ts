import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index } from 'typeorm';

export type PersonFieldType =
  | 'text'
  | 'paragraph'
  | 'number'
  | 'switch'
  | 'single_option'
  | 'multiple_options'
  | 'date';

@Entity('person_field')
@Index('UQ_person_field_congregation_label', ['congregation_id', 'label'], { unique: true })
export class PersonField extends CommonEntity {
  @Column({ type: 'uuid', nullable: false }) congregation_id: string;
  @Column({ nullable: false, length: 160 }) label: string;
  @Column({ nullable: false, length: 40 }) type: PersonFieldType;
  @Column({ nullable: false, default: false }) required: boolean;
  @Column('simple-json', { nullable: false, default: [] }) options: string[];
}
