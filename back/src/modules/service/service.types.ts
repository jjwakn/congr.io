import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export interface ServiceActionProps extends CongregationEntityActionProps {
  id: string;
}

export interface ServiceListProps extends CongregationEntityActionProps {
  query: ServiceQuery;
}

export interface ServiceCreateProps extends CongregationEntityActionProps {
  data: ServiceDto;
}

export interface ServiceUpdateProps extends ServiceCreateProps {
  id: string;
}

export class ServiceAttendanceGroupDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label: string;

  @IsHexColor()
  color: string;
}

export class ServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string;

  @IsUUID('4')
  location_id: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @IsString()
  @IsNotEmpty()
  start_time: string;

  @IsString()
  @IsNotEmpty()
  end_time: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceAttendanceGroupDto)
  @IsOptional()
  attendance_groups?: ServiceAttendanceGroupDto[];

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

enum ServiceOrder {
  name = 'name',
  day_of_week = 'day_of_week',
  start_time = 'start_time',
  end_time = 'end_time',
}

export class ServiceQuery extends ListParamsQuery {
  @ApiProperty({ required: false, enum: ServiceOrder })
  @IsOptional()
  order: ServiceOrder | CommonOrder = ServiceOrder.day_of_week;
}
