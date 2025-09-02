import { ApiPropertyI18n } from 'src/common/ApiPropertyI18n';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';
import { Role } from '../role/role.entity';

@Entity()
export class User extends CommonEntity {
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

  @ManyToMany(() => Congregation, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinTable({
    name: 'user_congregation',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'congregation_id' },
  })
  congregations: Congregation[];

  @ManyToMany(() => Location, { onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinTable({
    name: 'user_location',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'location_id' },
  })
  locations: Location[];

  @ApiProperty({
    example: [1, 2],
  })
  roles_ids?: string[];

  @ApiProperty({
    example: [1, 2],
  })
  congregations_ids?: string[];

  @ApiProperty({
    example: [1, 2],
  })
  locations_ids?: string[];
}
