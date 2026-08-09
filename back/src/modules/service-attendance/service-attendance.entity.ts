import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Service } from '../service/service.entity';

export interface ServiceAttendanceCount {
  group_id: string;
  label: string;
  color: string;
  count: number;
}

@Entity('service_attendance')
@Index('UQ_service_attendance_service_date', ['service_id', 'date'], { unique: true })
export class ServiceAttendance extends CommonEntity {
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @Column({ type: 'uuid', nullable: false })
  service_id: string;

  @ManyToOne(() => Service, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @Column({ type: 'date', nullable: false })
  date: string;

  @Column('simple-json', { nullable: false, default: [] })
  counts: ServiceAttendanceCount[];

  @Column({ type: 'text', nullable: false, default: '' })
  notes: string;
}
