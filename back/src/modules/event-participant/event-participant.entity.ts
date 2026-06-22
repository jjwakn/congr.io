import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Event } from '../event/event.entity';
import { Person } from '../person/person.entity';

@Entity('event_participant')
@Index('UQ_event_participant_person', ['event_id', 'person_id'], { unique: true, where: '"person_id" IS NOT NULL' })
export class EventParticipant extends CommonEntity {
  @Column({ type: 'uuid', nullable: false }) event_id: string;
  @ManyToOne(() => Event, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'event_id' }) event: Event;
  @Column({ type: 'uuid', nullable: true }) person_id?: string | null;
  @ManyToOne(() => Person, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person?: Person | null;
  @Column({ nullable: false, default: false }) attended: boolean;
  @Column({ nullable: false, default: false }) public_submission: boolean;
  @Column({ type: 'uuid', nullable: true }) public_submission_id?: string | null;
  @Column('simple-json', { nullable: false, default: {} }) field_values: Record<string, unknown>;
  @Column('simple-json', { nullable: false, default: {} }) submitted_person: Record<string, unknown>;
}
