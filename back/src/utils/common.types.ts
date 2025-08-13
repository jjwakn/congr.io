import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { User } from 'src/modules/user/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Module } from './constants';

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
    id: number;
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
  authorization: string;
  [key: string]: string;
}

export interface RequestType {
  headers: HeadersType;
}

export interface CommonEntity {
  created_by?: User | null;
  updated_by?: User | null;
  deleted_by?: User | null;
  [key: string]: any;
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
