import { ApiPropertyI18n } from 'src/common/decorators/ApiPropertyI18n';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user/user.entity';

@Entity()
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty()
  @Column({ nullable: false, default: 1 })
  order: number;

  @ApiPropertyI18n({ example: 'examples.location.name' })
  @Column({ nullable: false })
  name: string;

  @ApiPropertyI18n({ example: 'examples.location.address' })
  @Column({ nullable: true })
  address: number;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'updated_by' })
  updated_by: User;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: User;
}
