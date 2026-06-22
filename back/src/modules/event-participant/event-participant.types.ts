import { Type } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional, IsUUID } from 'class-validator';
import { CongregationEntityActionProps, ListParamsQuery } from 'src/common/common.types';

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
  @IsObject() @IsOptional() field_values?: Record<string, unknown>;
  @IsObject() @IsOptional() person_updates?: Record<string, unknown>;
}
export class ParticipantQuery extends ListParamsQuery {
  @IsUUID('4') @IsOptional() event_id?: string;
  @Type(() => Boolean) @IsBoolean() @IsOptional() attended?: boolean;
}
export class PublicRegistrationDto {
  @IsObject() submitted_person: Record<string, unknown>;
  @IsObject() @IsOptional() field_values?: Record<string, unknown>;
}
export class ParticipantMatchDto {
  @IsUUID('4') person_id: string;
}
