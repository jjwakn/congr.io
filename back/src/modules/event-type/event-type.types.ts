import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export interface EventTypeGetProps extends CongregationEntityActionProps {
  id: string;
}

export interface EventTypeListProps extends CongregationEntityActionProps {
  query: EventTypeQuery;
}

export interface EventTypeCreateProps extends CongregationEntityActionProps {
  data: EventTypeDto;
}

export interface EventTypeUpdateProps extends EventTypeCreateProps {
  id: string;
}

export interface EventTypeDeleteProps extends CongregationEntityActionProps {
  id: string;
}

export class EventTypeDto {
  @ApiProperty({ example: 'Initial Visit' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ required: false, example: 'Event type associated with the first step of a process.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ required: false, example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiProperty({ required: false, example: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  attendance_enabled?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  default_public?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  default_self_registration?: boolean;

  @ApiProperty({ required: false, type: Array })
  @IsArray()
  @IsOptional()
  custom_fields?: Array<Record<string, unknown>>;

  @ApiProperty({ required: false, example: '#1976d2' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @IsOptional()
  default_start_time?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1440)
  @IsOptional()
  default_duration_minutes?: number;
}

enum Order {
  name = 'name',
}

export class EventTypeQuery extends ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 'name',
    enum: Order,
  })
  @IsOptional()
  order: Order | CommonOrder = Order.name;
}
