import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CommonOrder, EntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { Feature } from 'src/utils/constants';
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

export interface CongregationDeletionPreview {
  usersDeleted: number;
  usersDetached: number;
  locationsDeleted: number;
  locationsDetached: number;
  events: number;
  eventTypes: number;
  processes: number;
  processSteps: number;
  configurations: number;
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

  @ApiProperty({ required: false, enum: Feature, isArray: true })
  @IsArray()
  @IsEnum(Feature, { each: true })
  @IsOptional()
  features?: Feature[];
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
