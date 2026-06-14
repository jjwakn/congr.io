import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { EventType } from '../event-type/event-type.entity';
import { Process } from './process.entity';

@Entity()
@Index('IDX_process_step_process_order', ['process_id', 'order'], { unique: true })
export class ProcessStep extends CommonEntity {
  @ApiProperty({ example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c' })
  @Column({ type: 'uuid', nullable: false })
  process_id: string;

  @ManyToOne(() => Process, (process) => process.steps, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'process_id' })
  process: Process;

  @ApiProperty({ example: 1 })
  @Column({ type: 'int', nullable: false })
  order: number;

  @ApiProperty({ example: 'Initial Visit' })
  @Column({ nullable: false, length: 160 })
  name: string;

  @ApiProperty({ example: 'Introduce the church and collect the first follow-up notes.' })
  @Column({ type: 'text', nullable: false, default: '' })
  description: string;

  @OneToOne(() => EventType, (eventType) => eventType.process_step)
  event_type?: EventType | null;
}
