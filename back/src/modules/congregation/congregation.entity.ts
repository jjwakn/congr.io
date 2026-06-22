import { ApiPropertyI18n } from 'src/common/ApiPropertyI18n';
import { CommonEntity } from 'src/common/common.entity';
import { Feature } from 'src/utils/constants';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Location } from '../location/location.entity';

@Entity()
export class Congregation extends CommonEntity {
  @ApiPropertyI18n({ example: 'examples.congregation.name' })
  @Column({ nullable: false })
  name: string;

  @ApiPropertyI18n({ example: 'examples.congregation.type' })
  @Column({ nullable: false })
  type: string;

  @ApiProperty({ example: 'America/Guatemala' })
  @Column({ nullable: false, default: 'UTC' })
  timezone: string;

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
    example: { user: ['users', 'roles'] },
  })
  @Column('simple-json', { nullable: false, default: [] })
  features: Feature[];

  @ApiProperty({ example: 10 })
  @Column({ type: 'int', nullable: false, default: 10 })
  max_favorites: number;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'uuid', nullable: true })
  logo_small_file_id?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'uuid', nullable: true })
  logo_big_file_id?: string | null;
}
