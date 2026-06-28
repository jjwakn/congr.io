import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import type { EventFieldType } from 'src/modules/event-field/event-field.types';
import type { FieldCondition } from 'src/modules/person-field/person-field.entity';
import { ApiProperty } from '@nestjs/swagger';

const EVENT_FIELD_TYPES: EventFieldType[] = ['text', 'paragraph', 'number', 'yes_no', 'options', 'date'];

export class EventTypeCustomFieldDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  event_field_id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  label: string;

  @IsIn(EVENT_FIELD_TYPES)
  type: EventFieldType;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  user_fillable?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  allow_multiple?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  link_person_field?: boolean;

  @IsString()
  @IsOptional()
  person_field_id?: string;

  @IsArray()
  @IsOptional()
  calculated_conditions?: FieldCondition[];
}

export interface EventTypeCustomField {
  id: string;
  event_field_id: string;
  label: string;
  type: EventFieldType;
  required: boolean;
  user_fillable: boolean;
  options: string[];
  allow_multiple: boolean;
  link_person_field: boolean;
  person_field_id: string | null;
  calculated_conditions: FieldCondition[];
}

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
  @ValidateNested({ each: true })
  @Type(() => EventTypeCustomFieldDto)
  @IsOptional()
  custom_fields?: EventTypeCustomFieldDto[];

  @ApiProperty({ required: false, example: '#1976d2' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  icon?: string;

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
