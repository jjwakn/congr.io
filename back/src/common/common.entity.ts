import { User } from 'src/modules/user/user.entity';
import { Column, CreateDateColumn, DeleteDateColumn, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export abstract class CommonEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: true })
  @Column({ nullable: false, default: true })
  enabled: boolean;

  @CreateDateColumn()
  created_at?: Date | null;

  @UpdateDateColumn()
  updated_at?: Date | null;

  @DeleteDateColumn()
  deleted_at?: Date | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by?: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updated_by?: User | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_by' })
  deleted_by?: User | null;
}
