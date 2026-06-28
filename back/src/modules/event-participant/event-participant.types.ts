import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional, IsUUID } from 'class-validator';
import { CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';
import type { JsonObject } from 'src/common/common.types';

export interface ParticipantListProps extends CongregationEntityActionProps {
  query: ParticipantQuery;
}
export interface ParticipantActionProps extends CongregationEntityActionProps {
  id: string;
}
export interface ParticipantCreateProps extends CongregationEntityActionProps {
  data: ParticipantDto;
}
export class ParticipantDto {
  @IsUUID('4') event_id: string;
  @IsUUID('4') @IsOptional() person_id?: string;
  @Type(() => Boolean) @IsBoolean() @IsOptional() attended?: boolean;
  @IsObject() @IsOptional() field_values?: JsonObject;
  @IsObject() @IsOptional() person_updates?: JsonObject;
}
export class ParticipantQuery extends ListParamsQuery {
  @IsUUID('4') @IsOptional() event_id?: string;
  @Type(() => Boolean) @IsBoolean() @IsOptional() attended?: boolean;
}
export class PublicRegistrationDto {
  @IsObject() submitted_person: JsonObject;
  @IsObject() @IsOptional() field_values?: JsonObject;
}
export class ParticipantMatchDto {
  @IsUUID('4') person_id: string;
}
