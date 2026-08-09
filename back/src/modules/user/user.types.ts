import {
  IsArray,
  IsBoolean,
  IsByteLength,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CommonOrder, EntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from 'src/config/security';
import { ApiProperty } from '@nestjs/swagger';

interface UserGetProps {
  includePassword?: boolean;
  userId?: string;
  congregationId?: string;
}

export interface UserGetByIdProps extends UserGetProps {
  id: string;
}

export interface UserCreateProps extends EntityActionProps {
  data: UserCreateDto;
  congregationId?: string;
}

export interface UserUpdateProps extends EntityActionProps {
  id: string;
  data: UserUpdateDto;
  congregationId?: string;
}

export interface UserDeleteProps extends EntityActionProps {
  id: string;
  congregationId?: string;
}

export interface UserChangeOwnPasswordProps extends EntityActionProps {
  data: UserChangeOwnPasswordDto;
}

export interface UserCompleteTemporaryPasswordProps extends EntityActionProps {
  data: UserCompleteTemporaryPasswordDto;
}

export interface UserSetTemporaryPasswordProps extends EntityActionProps {
  id: string;
  data: UserSetTemporaryPasswordDto;
  congregationId?: string;
}

export interface UserPreferencesProps extends EntityActionProps {
  data: UserPreferencesDto;
}

export interface UserListProps extends EntityActionProps {
  query: UserQuery;
  congregationId?: string;
}

export class UserCreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'errors.user.passwordTooShort' })
  @MaxLength(MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  @IsByteLength(0, MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roles_ids?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  congregations_ids?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locations_ids?: string[];

  @IsUUID('4')
  @IsOptional()
  person_id?: string | null;
}

export class UserUpdateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  username?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roles_ids?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  congregations_ids?: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  locations_ids?: string[];

  @IsUUID('4')
  @IsOptional()
  person_id?: string | null;
}

export class UserPreferencesDto {
  @IsObject()
  @IsOptional()
  page_sizes?: Record<string, number>;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  @IsOptional()
  sidebar_order?: string[];

  @IsArray()
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  @IsOptional()
  favorites?: string[];

  @IsIn(['24h', '12h'])
  @IsOptional()
  time_format?: '24h' | '12h';

  @IsObject()
  @IsOptional()
  column_visibility?: Record<string, string[]>;
}

enum Order {
  name = 'name',
  username = 'username',
}

export class UserQuery extends ListParamsQuery {
  @ApiProperty({
    required: false,
    example: 'name',
    enum: Order,
  })
  @IsOptional()
  order: Order | CommonOrder = Order.name;
}

export class UserChangeOwnPasswordDto {
  @ApiProperty({
    required: true,
    example: 'current-password',
  })
  @IsString({ message: 'errors.user.currentPasswordRequired' })
  @IsNotEmpty({ message: 'errors.user.currentPasswordRequired' })
  @IsByteLength(0, MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  current_password: string;

  @ApiProperty({
    required: true,
    example: 'new-password',
  })
  @IsString({ message: 'errors.user.passwordRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordRequired' })
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'errors.user.passwordTooShort' })
  @MaxLength(MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  @IsByteLength(0, MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  password: string;

  @ApiProperty({
    required: true,
    example: 'new-password',
  })
  @IsString({ message: 'errors.user.passwordConfirmationRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordConfirmationRequired' })
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'errors.user.passwordTooShort' })
  @MaxLength(MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  @IsByteLength(0, MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  password_confirmation: string;
}

export class UserCompleteTemporaryPasswordDto {
  @ApiProperty({
    required: true,
    example: 'new-password',
  })
  @IsString({ message: 'errors.user.passwordRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordRequired' })
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'errors.user.passwordTooShort' })
  @MaxLength(MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  @IsByteLength(0, MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  password: string;

  @ApiProperty({
    required: true,
    example: 'new-password',
  })
  @IsString({ message: 'errors.user.passwordConfirmationRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordConfirmationRequired' })
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'errors.user.passwordTooShort' })
  @MaxLength(MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  @IsByteLength(0, MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  password_confirmation: string;
}

export class UserSetTemporaryPasswordDto {
  @ApiProperty({
    required: true,
    example: 'temporary-password',
  })
  @IsString({ message: 'errors.user.passwordRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordRequired' })
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'errors.user.passwordTooShort' })
  @MaxLength(MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  @IsByteLength(0, MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  password: string;

  @ApiProperty({
    required: true,
    example: 'temporary-password',
  })
  @IsString({ message: 'errors.user.passwordConfirmationRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordConfirmationRequired' })
  @MinLength(MIN_PASSWORD_LENGTH, { message: 'errors.user.passwordTooShort' })
  @MaxLength(MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  @IsByteLength(0, MAX_PASSWORD_LENGTH, { message: 'errors.user.passwordTooLong' })
  password_confirmation: string;
}
