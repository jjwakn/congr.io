import { ApiPropertyI18n } from 'src/common/ApiPropertyI18n';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { Location } from '../location/location.entity';

@Entity()
export class Congregation extends CommonEntity {
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
}
