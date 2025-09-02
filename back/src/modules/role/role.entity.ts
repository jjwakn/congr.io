import { ApiPropertyI18n } from 'src/common/ApiPropertyI18n';
import { CommonEntity } from 'src/common/common.entity';
import { Column, Entity } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Role extends CommonEntity {
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
}
