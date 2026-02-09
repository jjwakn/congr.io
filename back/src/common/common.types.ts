import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { User } from 'src/modules/user/user.entity';
import { Module } from 'src/utils/constants';
import { ObjectLiteral, Repository } from 'typeorm';
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
  iat: number;
  exp: number;
}

export interface HeadersType {
  authorization?: string;
  [key: string]: string | undefined;
}

export interface RequestType {
  headers: HeadersType;
  user?: {
    userId: string;
    username: string;
    auth: {
      fullAccess: boolean;
      permissions: { [key: string]: string[] };
    };
  };
}

export interface CommonEntity {
  created_by?: User | null;
  updated_by?: User | null;
  deleted_by?: User | null;
  [key: string]: any;
}

export interface FindWithFiltersProps<
  Entity extends ObjectLiteral,
  Query extends ListParamsQuery,
> {
  repository: Repository<Entity>;
  query: Query;
  searchFields?: (keyof Entity)[];
  booleanFields?: (keyof Entity)[];
}

export interface CaseInsensitiveWhereProps {
  alias: string;
  search: string;
}

export interface EntityActionProps {
  userId: string;
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
  @IsOptional()
  size: number;

  @ApiProperty({
    required: false,
    example: 0,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
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
  search: string;

  @Transform(({ value }: { value: string }) => value.toLowerCase() === 'true')
  @ApiProperty({
    required: false,
    example: true,
  })
  @IsOptional()
  enabled: boolean;
}
//#endregion
