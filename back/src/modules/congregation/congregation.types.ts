import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
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

export class CongregationLocationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  address?: string;
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

  @ApiProperty({ required: false, type: [CongregationLocationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CongregationLocationDto)
  @IsOptional()
  locations?: CongregationLocationDto[];

  @ApiProperty({ required: false, type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  user_ids?: string[];
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
