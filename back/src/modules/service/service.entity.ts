import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';

@Entity('service')
@Index('IDX_service_congregation_day', ['congregation_id', 'day_of_week'])
export class Service extends CommonEntity {
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @Column({ type: 'uuid', nullable: false })
  location_id: string;

  @ManyToOne(() => Location, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ nullable: false, length: 160 })
  name: string;

  @Column({ type: 'text', nullable: false, default: '' })
  description: string;

  @Column({ type: 'int', nullable: false })
  day_of_week: number;

  @Column({ type: 'time without time zone', nullable: false })
  start_time: string;

  @Column({ type: 'time without time zone', nullable: false })
  end_time: string;

  @Column('simple-json', { nullable: false, default: [] })
  attendance_groups: Array<{ id: string; label: string; color: string }>;
}
