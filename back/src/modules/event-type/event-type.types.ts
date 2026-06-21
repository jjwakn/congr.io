import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
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
