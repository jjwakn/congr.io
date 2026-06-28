import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Congregation } from '../congregation/congregation.entity';
import type { FieldCondition } from '../person-field/person-field.entity';
import type { EventFieldType } from './event-field.types';

@Entity('event_field')
@Index('UQ_event_field_congregation_label', ['congregation_id', 'label'], { unique: true })
export class EventField extends CommonEntity {
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @Column({ nullable: false, length: 160 })
  label: string;

  @Column({ nullable: false, length: 40 })
  type: EventFieldType;

  @Column({ nullable: false, default: false })
  required: boolean;

  @Column({ nullable: false, default: false })
  user_fillable: boolean;

  @Column({ nullable: false, default: false })
  link_person_field: boolean;

  @Column({ type: 'varchar', nullable: true, length: 120 })
  person_field_id?: string | null;

  @Column({ nullable: false, default: false })
  allow_multiple: boolean;

  @Column('simple-json', { nullable: false, default: [] })
  options: string[];

  @Column('simple-json', { nullable: false, default: [] })
  calculated_conditions: FieldCondition[];
}
