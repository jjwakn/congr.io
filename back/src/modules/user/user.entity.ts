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
  @PrimaryGeneratedColumn()
  id: number;

    @ApiProperty({
    example: 'japerez',
  })
  @Column({ nullable: false })
  username: string;

  @ApiProperty({
    example: '1234abcd',
  })
  @Column({ nullable: false, default: '' })
  password?: string;

  @ApiProperty({
    example: 'Juan Andres Perez',
  })
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
  roles_ids?: number[];

  @ApiProperty({
    example: true,
  })
  @Column({ nullable: false, default: true })
  enabled: boolean;

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;

  @DeleteDateColumn()
  deleted_at?: Date;

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
