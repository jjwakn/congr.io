import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import type { FieldCondition, PersonFieldType } from './person-field.entity';

export interface PersonFieldActionProps extends CongregationEntityActionProps {
  id: string;
}
export interface PersonFieldListProps extends CongregationEntityActionProps {
  query: ListParamsQuery;
}
export interface PersonFieldCreateProps extends CongregationEntityActionProps {
  data: PersonFieldDto;
}
export interface PersonFieldUpdateProps extends PersonFieldCreateProps {
  id: string;
}
export class PersonFieldDto {
  @IsString() @MaxLength(160) label: string;
  @IsIn(['text', 'paragraph', 'number', 'yes_no', 'options', 'date']) type: PersonFieldType;
  @Type(() => Boolean) @IsBoolean() @IsOptional() required?: boolean;
  @Type(() => Boolean) @IsBoolean() @IsOptional() allow_multiple?: boolean;
  @IsArray() @IsString({ each: true }) @IsOptional() options?: string[];
  @IsArray() @IsOptional() calculated_conditions?: FieldCondition[];
  @Type(() => Boolean) @IsBoolean() @IsOptional() enabled?: boolean;
}
