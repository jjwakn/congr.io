import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsObject, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import type { JsonObject } from 'src/common/common.types';

export interface ParticipantListProps extends CongregationEntityActionProps {
  query: ParticipantQuery;
}
export interface ParticipantActionProps extends CongregationEntityActionProps {
  id: string;
}
export interface ParticipantEventActionProps extends CongregationEntityActionProps {
  eventId: string;
}
export interface ParticipantCreateProps extends CongregationEntityActionProps {
  data: ParticipantDto;
}
export class ParticipantDto {
  @IsUUID('4') event_id: string;
  @IsUUID('4') @IsOptional() person_id?: string;
  @Type(() => Boolean) @IsBoolean() @IsOptional() attended?: boolean;
  @IsObject() @IsOptional() field_values?: JsonObject;
}
export class ParticipantQuery extends ListParamsQuery {
  @IsUUID('4') @IsOptional() event_id?: string;
  @Type(() => Boolean) @IsBoolean() @IsOptional() attended?: boolean;
}
export class PublicRegistrationPersonDto {
  @IsString() @MaxLength(160) first_name: string;
  @IsString() @MaxLength(160) last_name: string;
  @IsString() @MaxLength(160) @IsOptional() middle_name?: string;
  @IsString() @MaxLength(160) @IsOptional() second_last_name?: string;
  @IsString() @MaxLength(160) @IsOptional() married_name?: string;
  @IsString() @MaxLength(80) @IsOptional() phone?: string;
  @IsEmail() @MaxLength(255) @IsOptional() email?: string;
}
export class PublicRegistrationDto {
  @ValidateNested()
  @Type(() => PublicRegistrationPersonDto)
  submitted_person: PublicRegistrationPersonDto;
  @IsObject() @IsOptional() field_values?: JsonObject;
}

export interface PublicRegistrationContext {
  ip?: string;
}
export class ParticipantMatchDto {
  @IsUUID('4') person_id: string;
}
