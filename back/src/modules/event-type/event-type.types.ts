import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CommonOrder, EntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export interface EventTypeGetProps extends EntityActionProps {
  id: string;
}

export interface EventTypeListProps extends EntityActionProps {
  query: EventTypeQuery;
}

export interface EventTypeCreateProps extends EntityActionProps {
  data: EventTypeDto;
}

export interface EventTypeUpdateProps extends EventTypeCreateProps {
  id: string;
}

export interface EventTypeDeleteProps extends EntityActionProps {
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
