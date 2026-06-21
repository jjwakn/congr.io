import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CommonOrder, EntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export interface CongregationCreateProps extends EntityActionProps {
  data: CongregationDto;
}

export interface CongregationUpdateProps extends CongregationCreateProps {
  id: string;
}

export interface CongregationDeleteProps extends EntityActionProps {
  id: string;
}

export type CongregationGetProps = CongregationDeleteProps;

export interface CongregationListProps extends EntityActionProps {
  query: CongregationQuery;
}

export class CongregationDto {
  @ApiProperty({ example: 'Casa de Libertad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ example: 'Church' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  type: string;

  @ApiProperty({ example: 'America/Guatemala' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  timezone: string;

  @ApiProperty({ required: false, example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

enum Order {
  name = 'name',
  type = 'type',
}

export class CongregationQuery extends ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 'name',
    enum: Order,
  })
  @IsOptional()
  order: Order | CommonOrder = Order.name;
}
