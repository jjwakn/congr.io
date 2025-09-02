import { ApiPropertyI18n } from 'src/common/ApiPropertyI18n';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Location extends CommonEntity {
  @ApiProperty()
  @Column({ nullable: false, default: 1 })
  order: number;

  @ApiPropertyI18n({ example: 'examples.location.name' })
  @Column({ nullable: false })
  name: string;

  @ApiPropertyI18n({ example: 'examples.location.address' })
  @Column({ nullable: true })
  address: number;
}
