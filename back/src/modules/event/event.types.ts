import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import type { EventTypeCustomField } from 'src/modules/event-type/event-type.types';
import { ApiProperty } from '@nestjs/swagger';

export interface EventGetProps extends CongregationEntityActionProps {
  id: string;
  canViewAll?: boolean;
}

export interface EventListProps extends CongregationEntityActionProps {
  query: EventQuery;
  canViewAll?: boolean;
}

export interface EventCreateProps extends CongregationEntityActionProps {
  data: EventDto;
}

export interface EventUpdateProps extends EventCreateProps {
  id: string;
}

export interface EventDeleteProps extends CongregationEntityActionProps {
  id: string;
}

export class EventRegistrationLockDto {
  @Type(() => Boolean)
  @IsBoolean()
  locked: boolean;
}

export class EventDto {
  @ApiProperty({ example: 'John Doe Initial Visit' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @ApiProperty({ required: false, example: 'First visit follow-up meeting with the hospitality team.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: '2026-03-29T09:00' })
  @IsString()
  @IsNotEmpty()
  start_datetime: string;

  @ApiProperty({ example: '2026-03-29T10:00' })
  @IsString()
  @IsNotEmpty()
  end_datetime: string;

  @ApiProperty({ example: '9ce26ff8-84d5-47f1-9974-ce4b47de7e2c' })
  @IsUUID()
  type_id: string;

  @ApiProperty({ required: false, example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  all_day?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;

  @IsUUID('4')
  @IsOptional()
  image_file_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  image_url?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  attendance_enabled?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  self_registration_enabled?: boolean;

  @IsArray()
  @IsOptional()
  custom_fields?: EventTypeCustomField[];

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  save_attendance_date?: boolean;

  @IsUUID('4')
  @IsOptional()
  attendance_date_person_field_id?: string;
}

enum Order {
  name = 'name',
  start_datetime = 'start_datetime',
  end_datetime = 'end_datetime',
}

export class EventQuery extends ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 'start_datetime',
    enum: Order,
  })
  @IsOptional()
  order: Order | CommonOrder = Order.start_datetime;

  @IsString()
  @IsOptional()
  start?: string;

  @IsString()
  @IsOptional()
  end?: string;
}
