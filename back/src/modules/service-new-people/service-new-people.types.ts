import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';
import { PersonDto } from '../person/person.types';

export interface ServiceNewPeopleActionProps extends CongregationEntityActionProps {
  id: string;
}

export interface ServiceNewPeopleListProps extends CongregationEntityActionProps {
  query: ServiceNewPeopleQuery;
}

export interface ServiceNewPeopleCreateProps extends CongregationEntityActionProps {
  data: ServiceNewPeopleDto;
}

export interface ServiceNewPeopleUpdateProps extends ServiceNewPeopleCreateProps {
  id: string;
}

export interface ServiceNewPersonCreateProps extends ServiceNewPeopleActionProps {
  data: ServiceNewPersonDto;
}

export interface ServiceNewPersonRemoveProps extends ServiceNewPeopleActionProps {
  personId: string;
}

export class ServiceNewPeopleDto {
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

export class ServiceNewPersonDto {
  @IsUUID('4')
  @IsOptional()
  person_id?: string;

  @Type(() => PersonDto)
  @IsOptional()
  person?: PersonDto;
}

enum ServiceNewPeopleOrder {
  date = 'date',
  service_id = 'service_id',
}

export class ServiceNewPeopleQuery extends ListParamsQuery {
  @ApiProperty({ required: false, enum: ServiceNewPeopleOrder })
  @IsOptional()
  order: ServiceNewPeopleOrder | CommonOrder = ServiceNewPeopleOrder.date;
}
