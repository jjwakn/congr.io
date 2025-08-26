import { ApiPropertyI18n } from 'src/common/ApiPropertyI18n';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Location } from '../location/location.entity';
import { User } from '../user/user.entity';

@Entity()
export class Congregation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyI18n({ example: 'examples.congregation.name' })
  @Column({ nullable: false })
  name: string;

  @ApiPropertyI18n({ example: 'examples.congregation.type' })
  @Column({ nullable: false })
  type: string;

  @ManyToMany(() => Location, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT',
  })
  @JoinTable({
    name: 'congregation_location',
    joinColumn: { name: 'congregation_id' },
    inverseJoinColumn: { name: 'congregation_location_id' },
  })
  locations: Location[];

  @ApiProperty({
    example: true,
  })
  @Column({ nullable: false, default: true })
  enabled: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date | null;

  @DeleteDateColumn()
  deleted_at?: Date | null;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: User | null;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by: User | null;

  @ManyToOne(() => User, (user) => user.id, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by: User | null;
}
