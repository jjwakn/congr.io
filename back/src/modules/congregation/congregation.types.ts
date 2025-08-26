import { IsOptional } from 'class-validator';
import {
  CommonOrder,
  EntityActionProps,
  ListParamsQuery,
} from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';
import { Congregation } from './congregation.entity';

export interface CongregationCreateProps extends EntityActionProps {
  data: Congregation;
}

export interface CongregationUpdateProps extends CongregationCreateProps {
  id: string;
}

export interface CongregationDeleteProps extends EntityActionProps {
  id: string;
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
