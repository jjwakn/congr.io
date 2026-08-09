import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Congregation } from '../congregation/congregation.entity';
import { Event } from '../event/event.entity';
import { ProcessStep } from '../process/process-step.entity';
import type { EventTypeCustomField } from './event-type.types';

@Entity()
export class EventType extends CommonEntity {
  @ApiProperty({ example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c' })
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @ApiProperty({ example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c', required: false, nullable: true })
  @Column({ type: 'uuid', nullable: true, unique: true })
  process_step_id?: string | null;

  @OneToOne(() => ProcessStep, { nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'process_step_id' })
  process_step?: ProcessStep | null;

  @ApiProperty({ example: 'Initial Visit' })
  @Column({ nullable: false, length: 160 })
  name: string;

  @ApiProperty({ example: 'Event type used when a visitor completes the initial visit step.' })
  @Column({ type: 'text', nullable: false, default: '' })
  description: string;

  @Column({ nullable: false, default: false })
  attendance_enabled: boolean;

  @Column({ nullable: false, default: false })
  default_public: boolean;

  @Column({ nullable: false, default: false })
  default_self_registration: boolean;

  @Column('simple-json', { nullable: false, default: [] })
  custom_fields: EventTypeCustomField[];

  @Column({ nullable: false, default: '#1976d2', length: 16 })
  color: string;

  @Column({ nullable: false, default: 'CalendarMonth', length: 120 })
  icon: string;

  @Column({ nullable: false, default: false })
  save_attendance_date: boolean;

  @Column({ type: 'time', nullable: true })
  default_start_time?: string | null;

  @Column({ type: 'int', nullable: true })
  default_duration_minutes?: number | null;

  @Column({ type: 'uuid', nullable: true })
  attendance_date_person_field_id?: string | null;

  @OneToMany(() => Event, (event) => event.type)
  events?: Event[];
}
