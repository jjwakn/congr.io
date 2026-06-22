import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export type EventFieldType = 'text' | 'paragraph' | 'number' | 'switch' | 'single_option' | 'multiple_options';

const EVENT_FIELD_TYPES: EventFieldType[] = [
  'text',
  'paragraph',
  'number',
  'switch',
  'single_option',
  'multiple_options',
];

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

  @IsUUID('4')
  @IsOptional()
  person_field_id?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];
}

enum Order {
  label = 'label',
}

export class EventFieldQuery extends ListParamsQuery {
  @ApiProperty({ required: false, enum: Order })
  @IsOptional()
  order: Order | CommonOrder = Order.label;
}
