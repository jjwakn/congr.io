import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsObject, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';

export interface PersonActionProps extends CongregationEntityActionProps {
  id: string;
}
export interface PersonListProps extends CongregationEntityActionProps {
  query: PersonQuery;
}
export interface PersonCreateProps extends CongregationEntityActionProps {
  data: PersonDto;
}
export interface PersonUpdateProps extends PersonCreateProps {
  id: string;
}

export class PersonDto {
  @IsString() @MaxLength(100) first_name: string;
  @IsString() @MaxLength(100) @IsOptional() middle_name?: string;
  @IsString() @MaxLength(100) last_name: string;
  @IsString() @MaxLength(100) @IsOptional() second_last_name?: string;
  @IsString() @MaxLength(100) @IsOptional() married_name?: string;
  @IsString() @MaxLength(500) @IsOptional() phone?: string;
  @IsString() @IsOptional() birthdate?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(130) @IsOptional() age?: number;
  @IsEmail() @IsOptional() email?: string;
  @IsUUID('4') @IsOptional() user_id?: string;
  @IsObject() @IsOptional() custom_values?: Record<string, unknown>;
}

enum Order {
  code = 'code',
  first_name = 'first_name',
  last_name = 'last_name',
}
export class PersonQuery extends ListParamsQuery {
  @ApiProperty({ required: false, enum: Order })
  @IsOptional()
  order: Order | CommonOrder = Order.last_name;
}
