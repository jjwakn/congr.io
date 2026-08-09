import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Congregation } from '../congregation/congregation.entity';

@Entity('stored_file')
export class StoredFile extends CommonEntity {
  @Column({ type: 'uuid', nullable: false })
  congregation_id: string;

  @ManyToOne(() => Congregation, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'congregation_id' })
  congregation: Congregation;

  @Column({ nullable: false, length: 40, default: 'local' })
  provider: string;

  @Column({ nullable: false, length: 255 })
  storage_key: string;

  @Column({ nullable: false, length: 255 })
  original_name: string;

  @Column({ nullable: false, length: 160 })
  mime_type: string;

  @Column({ type: 'bigint', nullable: false })
  size: number;

  @Column({ nullable: false, default: false })
  public: boolean;
}
