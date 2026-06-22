import { IsArray, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { CommonOrder, EntityActionProps, ListParamsQuery } from 'src/common/common.types';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

interface UserGetProps {
  includePassword?: boolean;
}

export interface UserGetByIdProps extends UserGetProps {
  id: string;
}

export interface UserGetByUsernameProps extends UserGetProps {
  username: string;
}

export interface UserCreateProps extends EntityActionProps {
  data: User;
}

export interface UserUpdateProps extends UserCreateProps {
  id: string;
}

export interface UserDeleteProps extends EntityActionProps {
  id: string;
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
}

export interface UserPreferencesProps extends EntityActionProps {
  data: UserPreferencesDto;
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

export class UserValidateProps {
  @ApiProperty({
    required: true,
    example: 'abc.def.ghi',
  })
  token: string;
}

export class UserChangeOwnPasswordDto {
  @ApiProperty({
    required: true,
    example: 'current-password',
  })
  @IsString({ message: 'errors.user.currentPasswordRequired' })
  @IsNotEmpty({ message: 'errors.user.currentPasswordRequired' })
  current_password: string;

  @ApiProperty({
    required: true,
    example: 'new-password',
  })
  @IsString({ message: 'errors.user.passwordRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordRequired' })
  password: string;

  @ApiProperty({
    required: true,
    example: 'new-password',
  })
  @IsString({ message: 'errors.user.passwordConfirmationRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordConfirmationRequired' })
  password_confirmation: string;
}

export class UserCompleteTemporaryPasswordDto {
  @ApiProperty({
    required: true,
    example: 'new-password',
  })
  @IsString({ message: 'errors.user.passwordRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordRequired' })
  password: string;

  @ApiProperty({
    required: true,
    example: 'new-password',
  })
  @IsString({ message: 'errors.user.passwordConfirmationRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordConfirmationRequired' })
  password_confirmation: string;
}

export class UserSetTemporaryPasswordDto {
  @ApiProperty({
    required: true,
    example: 'temporary-password',
  })
  @IsString({ message: 'errors.user.passwordRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordRequired' })
  password: string;

  @ApiProperty({
    required: true,
    example: 'temporary-password',
  })
  @IsString({ message: 'errors.user.passwordConfirmationRequired' })
  @IsNotEmpty({ message: 'errors.user.passwordConfirmationRequired' })
  password_confirmation: string;
}
