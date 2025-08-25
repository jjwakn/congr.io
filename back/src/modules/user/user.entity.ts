import { ApiPropertyI18n } from 'src/common/decorators/ApiPropertyI18n';
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
import { Role } from '../role/role.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiPropertyI18n({ example: 'examples.user.username' })
  @Column({ nullable: false })
  username: string;

  @ApiPropertyI18n({ example: 'examples.user.password' })
  @Column({ nullable: false, default: '' })
  password?: string;

  @ApiPropertyI18n({ example: 'examples.user.name' })
  @Column({ nullable: false })
  name: string;

  @ManyToMany(() => Role, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinTable({
    name: 'user_role',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'role_id' },
  })
  roles: Role[];

  @ApiProperty({
    example: [1, 2],
  })
  roles_ids?: string[];

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
