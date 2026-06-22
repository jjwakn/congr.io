import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Congregation } from '../congregation/congregation.entity';
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

  @Column({ type: 'uuid', nullable: true })
  person_field_id?: string | null;

  @Column('simple-json', { nullable: false, default: [] })
  options: string[];
}
