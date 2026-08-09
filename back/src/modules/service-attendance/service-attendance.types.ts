import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export interface ServiceAttendanceActionProps extends CongregationEntityActionProps {
  id: string;
}

export interface ServiceAttendanceListProps extends CongregationEntityActionProps {
  query: ServiceAttendanceQuery;
}

export interface ServiceAttendanceCreateProps extends CongregationEntityActionProps {
  data: ServiceAttendanceDto;
}

export interface ServiceAttendanceUpdateProps extends ServiceAttendanceCreateProps {
  id: string;
}

export interface ServiceAttendanceDeltaProps extends CongregationEntityActionProps {
  data: ServiceAttendanceDeltaDto;
}

export class ServiceAttendanceDto {
  @IsUUID('4')
  service_id: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

export class ServiceAttendanceDeltaItemDto {
  @IsString()
  @IsNotEmpty()
  group_id: string;

  @Type(() => Number)
  @IsInt()
  delta: number;
}

export class ServiceAttendanceDeltaDto {
  @IsUUID('4')
  service_id: string;

  @IsString()
  @IsNotEmpty()
  date: string;

  @Type(() => ServiceAttendanceDeltaItemDto)
  deltas: ServiceAttendanceDeltaItemDto[];
}

enum ServiceAttendanceOrder {
  date = 'date',
  service_id = 'service_id',
}

export class ServiceAttendanceQuery extends ListParamsQuery {
  @ApiProperty({ required: false, enum: ServiceAttendanceOrder })
  @IsOptional()
  order: ServiceAttendanceOrder | CommonOrder = ServiceAttendanceOrder.date;
}
