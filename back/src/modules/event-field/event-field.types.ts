import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import type { FieldCondition } from 'src/modules/person-field/person-field.entity';
import { ApiProperty } from '@nestjs/swagger';

export type EventFieldType = 'text' | 'paragraph' | 'number' | 'yes_no' | 'options' | 'date';

const EVENT_FIELD_TYPES: EventFieldType[] = ['text', 'paragraph', 'number', 'yes_no', 'options', 'date'];

export interface EventFieldActionProps extends CongregationEntityActionProps {
  id: string;
}
export interface EventFieldListProps extends CongregationEntityActionProps {
  query: EventFieldQuery;
}
export interface EventFieldCreateProps extends CongregationEntityActionProps {
  data: EventFieldDto;
}
export interface EventFieldUpdateProps extends EventFieldCreateProps {
  id: string;
}

export class EventFieldDto {
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

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  link_person_field?: boolean;

  @IsString()
  @IsOptional()
  person_field_id?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  allow_multiple?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsArray()
  @IsOptional()
  calculated_conditions?: FieldCondition[];

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

enum Order {
  label = 'label',
}

export class EventFieldQuery extends ListParamsQuery {
  @ApiProperty({ required: false, enum: Order })
  @IsOptional()
  order: Order | CommonOrder = Order.label;
}
