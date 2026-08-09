import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { User } from 'src/modules/user/user.entity';
import { Module } from 'src/utils/constants';
import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

//#region Enums
export enum Direction {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum CommonOrder {
  id = 'id',
  enabled = 'enabled',
}

//#endregion

//#region Types & Interfaces
export interface TokenPayload {
  user: {
    id: string;
    username: string;
    name: string;
    created_at: string;
  };
  auth: {
    fullAccess: boolean;
    permissions: { [key in keyof typeof Module]?: string[] };
  };
  passwordChangeRequired: boolean;
  sessionVersion: number;
  iat: number;
  exp: number;
}

export interface HeadersType {
  authorization?: string;
  [key: string]: string | undefined;
}

export interface RequestType {
  headers: HeadersType;
  ip?: string;
  user?: {
    userId: string;
    username: string;
    passwordChangeRequired: boolean;
    sessionVersion: number;
    auth: {
      fullAccess: boolean;
      permissions: { [key: string]: string[] };
    };
  };
}

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue | undefined;
}
export type JsonArray = JsonValue[];

export interface CommonEntity {
  created_by?: User | null;
  updated_by?: User | null;
  deleted_by?: User | null;
}

export interface FindWithFiltersProps<Entity extends ObjectLiteral, Query extends ListParamsQuery> {
  repository: Repository<Entity>;
  query: Query;
  searchFields?: (keyof Entity)[];
  allowedSearchFields?: (keyof Entity)[];
  booleanFields?: (keyof Entity)[];
  baseWhere?: FindOptionsWhere<Entity>;
}

export interface EntityActionProps {
  userId: string;
}

export interface CongregationEntityActionProps extends EntityActionProps {
  congregationId?: string;
}

export interface DefaultGetData {
  id: string;
}
//#endregion

//#region Classes
export class ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 100,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Max(500)
  @Min(1)
  @IsOptional()
  size: number;

  @ApiProperty({
    required: false,
    example: 0,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  @IsOptional()
  page: number;

  @ApiProperty({
    required: false,
    example: 'ASC',
    enum: Direction,
  })
  @IsOptional()
  direction: Direction;

  @ApiProperty({
    required: false,
    example: 'name',
  })
  @IsOptional()
  order: string;

  @ApiProperty({
    required: false,
    example: 'encargado',
  })
  @IsOptional()
  @MaxLength(200)
  search: string;

  @ApiProperty({
    required: false,
    example: 'id,name,enabled',
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  columns: string;

  @ApiProperty({
    required: false,
    example: 'name,description',
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  search_columns: string;

  @Transform(({ value }: { value: string }) => value.toLowerCase() === 'true')
  @ApiProperty({
    required: false,
    example: true,
  })
  @IsOptional()
  enabled: boolean;
}
//#endregion
