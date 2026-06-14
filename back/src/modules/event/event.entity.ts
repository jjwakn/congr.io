import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Congregation } from '../congregation/congregation.entity';
import { EventType } from '../event-type/event-type.entity';

@Entity()
export class Event extends CommonEntity {
  @ApiProperty({ example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c' })
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @ApiProperty({ example: 'John Doe Initial Visit' })
  @Column({ nullable: false, length: 160 })
  name: string;

  @ApiProperty({ example: 'Initial visit scheduled with the hospitality team.' })
  @Column({ type: 'text', nullable: false, default: '' })
  description: string;

  @ApiProperty({ example: '2026-03-29T15:00:00.000Z' })
  @Column({ type: 'timestamptz', nullable: false })
  start_datetime: Date;

  @ApiProperty({ example: '2026-03-29T16:00:00.000Z' })
  @Column({ type: 'timestamptz', nullable: false })
  end_datetime: Date;

  @ApiProperty({ example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c' })
  @Column({ type: 'uuid', nullable: false })
  event_type_id: string;

  @ManyToOne(() => EventType, (eventType) => eventType.events, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'event_type_id' })
  type: EventType;
}
