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
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyI18n({
    example: 'examples.role.name',
  })
  @Column({ nullable: false })
  name: string;

  @ApiProperty({
    example: { user: ['post', 'get', 'update', 'delete'] },
  })
  @Column('simple-json', { nullable: true })
  permissions: {
    [key: string]: string[];
  };

  @ApiProperty({
    example: false,
  })
  @Column({ nullable: false, default: false })
  full_access: boolean;

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
