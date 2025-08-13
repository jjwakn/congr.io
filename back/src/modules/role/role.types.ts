import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ListParamsQuery } from 'src/utils/common.types';
import { ApiProperty } from '@nestjs/swagger';

enum Order {
  id = 'id',
  name = 'name',
}

export class RoleQuery extends ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 'name',
    enum: Order,
  })
  @IsOptional()
  order: Order = Order.name;

  @ApiProperty({
    required: false,
    example: 100,
  })
  @Transform(({ value }: { value: string }) => value.toLowerCase() === 'true')
  @IsBoolean()
  @IsOptional()
  full_access: boolean;
}
