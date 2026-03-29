import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Congregation } from '../congregation/congregation.entity';
import { ProcessStep } from './process-step.entity';

@Entity()
export class Process extends CommonEntity {
  @ApiProperty({ example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c' })
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @ApiProperty({ example: 'New Member Journey' })
  @Column({ nullable: false, length: 160 })
  name: string;

  @ApiProperty({ example: 'Guided process that members follow from the first visit to volunteering.' })
  @Column({ type: 'text', nullable: false, default: '' })
  description: string;

  @OneToMany(() => ProcessStep, (step) => step.process)
  steps?: ProcessStep[];
}
