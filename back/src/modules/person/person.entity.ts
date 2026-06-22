import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { User } from '../user/user.entity';

@Entity()
@Index('UQ_person_congregation_code', ['congregation_id', 'code'], { unique: true })
export class Person extends CommonEntity {
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @Column({ nullable: false, length: 24 })
  code: string;

  @Column({ nullable: false, length: 100 })
  first_name: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  middle_name?: string | null;

  @Column({ nullable: false, length: 100 })
  last_name: string;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  second_last_name?: string | null;

  @Column({ type: 'varchar', nullable: true, length: 100 })
  married_name?: string | null;

  @Column({ type: 'text', nullable: false, default: '' })
  phone: string;

  @Column({ type: 'date', nullable: true })
  birthdate?: string | null;

  @Column({ type: 'int', nullable: true })
  registered_age?: number | null;

  @Column({ type: 'date', nullable: true })
  age_recorded_at?: string | null;

  @Column({ type: 'varchar', nullable: true, length: 180 })
  email?: string | null;

  @Column({ type: 'uuid', nullable: true, unique: true })
  user_id?: string | null;

  @OneToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Column('simple-json', { nullable: false, default: {} })
  custom_values: Record<string, unknown>;
}
