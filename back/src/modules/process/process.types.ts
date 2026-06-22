import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export interface ProcessGetProps extends CongregationEntityActionProps {
  id: string;
}

export interface ProcessListProps extends CongregationEntityActionProps {
  query: ProcessQuery;
}

export interface ProcessCreateProps extends CongregationEntityActionProps {
  data: ProcessDto;
}

export interface ProcessUpdateProps extends ProcessCreateProps {
  id: string;
}

export interface ProcessDeleteProps extends CongregationEntityActionProps {
  id: string;
}

export class ProcessStepDto {
  @ApiProperty({ required: false, example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c' })
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty({ required: false, format: 'uuid' })
  @IsUUID('4')
  @IsOptional()
  flow_key?: string;

  @ApiProperty({ required: false, type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  next_step_keys?: string[];

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ example: 'Initial Visit' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ required: false, example: 'Introduce the church and capture first-contact notes.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false, example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class ProcessDto {
  @ApiProperty({ example: 'New Member Journey' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ required: false, example: 'Process that helps people move from their first visit to serving.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false, example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ type: () => [ProcessStepDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProcessStepDto)
  steps: ProcessStepDto[];
}

enum Order {
  name = 'name',
}

export class ProcessQuery extends ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 'name',
    enum: Order,
  })
  @IsOptional()
  order: Order | CommonOrder = Order.name;
}
