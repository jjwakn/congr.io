import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CommonOrder, EntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export interface EventGetProps extends EntityActionProps {
  id: string;
}

export interface EventListProps extends EntityActionProps {
  query: EventQuery;
}

export interface EventCreateProps extends EntityActionProps {
  data: EventDto;
}

export interface EventUpdateProps extends EventCreateProps {
  id: string;
}

export interface EventDeleteProps extends EntityActionProps {
  id: string;
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
}
