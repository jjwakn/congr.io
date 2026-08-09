import { Transform } from 'class-transformer';
import { IsBoolean, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { EntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from './role.entity';

export interface RoleCreateProps extends EntityActionProps {
  data: RoleCreateDto;
}

export interface RoleUpdateProps extends EntityActionProps {
  id: string;
  data: RoleUpdateDto;
}

export interface RoleDeleteProps extends EntityActionProps {
  id: string;
}

export class RoleCreateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsObject()
  @IsOptional()
  permissions?: Role['permissions'];

  @IsBoolean()
  @IsOptional()
  full_access?: boolean;
}

export class RoleUpdateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  permissions?: Role['permissions'];

  @IsBoolean()
  @IsOptional()
  full_access?: boolean;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

enum Order {
  id = 'id',
  name = 'name',
}

export class RoleQuery extends ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 'name',
    enum: Order,
  })
  @IsOptional()
  order: Order = Order.name;

  @ApiProperty({
    required: false,
    example: 100,
  })
  @Transform(({ value }: { value: string }) => value.toLowerCase() === 'true')
  @IsBoolean()
  @IsOptional()
  full_access: boolean;
}
