import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Person } from '../person/person.entity';
import { Service } from '../service/service.entity';

@Entity('service_new_people')
@Index('IDX_service_new_people_congregation_date', ['congregation_id', 'date'])
export class ServiceNewPeople extends CommonEntity {
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

  @Column({ type: 'text', nullable: false, default: '' })
  notes: string;
}

@Entity('service_new_person')
@Index('UQ_service_new_person_group_person', ['group_id', 'person_id'], { unique: true })
export class ServiceNewPerson extends CommonEntity {
  @Column({ type: 'uuid', nullable: false })
  group_id: string;

  @ManyToOne(() => ServiceNewPeople, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: ServiceNewPeople;

  @Column({ type: 'uuid', nullable: false })
  person_id: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'person_id' })
  person: Person;
}
