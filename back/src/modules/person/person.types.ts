import { Transform, type TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CommonOrder, CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import type { JsonObject, JsonValue } from 'src/common/common.types';
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

const emptyStringToUndefined = ({ value }: TransformFnParams): JsonValue | undefined => {
  const input = value as JsonValue | undefined;
  return typeof input === 'string' && !input.trim() ? undefined : input;
};

export class PersonDto {
  @IsString() @IsNotEmpty() @MaxLength(100) first_name: string;
  @IsString() @MaxLength(100) @IsOptional() middle_name?: string;
  @IsString() @IsNotEmpty() @MaxLength(100) last_name: string;
  @IsString() @MaxLength(100) @IsOptional() second_last_name?: string;
  @IsString() @MaxLength(100) @IsOptional() married_name?: string;
  @IsString() @MaxLength(500) @IsOptional() phone?: string;
  @IsString() @IsOptional() birthdate?: string;
  @Type(() => Number) @IsInt() @Min(0) @Max(130) @IsOptional() age?: number;
  @Transform(emptyStringToUndefined)
  @IsEmail()
  @IsOptional()
  email?: string;
  @Transform(emptyStringToUndefined)
  @IsUUID('4')
  @IsOptional()
  user_id?: string;
  @IsObject() @IsOptional() custom_values?: JsonObject;
  @Type(() => Boolean) @IsBoolean() @IsOptional() regenerate_code?: boolean;
  @Type(() => Boolean) @IsBoolean() @IsOptional() enabled?: boolean;
}

enum Order {
  code = 'code',
  first_name = 'first_name',
  last_name = 'last_name',
  phone = 'phone',
  registered_age = 'registered_age',
}
export class PersonQuery extends ListParamsQuery {
  @ApiProperty({ required: false, enum: Order })
  @IsOptional()
  order: Order | CommonOrder = Order.last_name;
}
