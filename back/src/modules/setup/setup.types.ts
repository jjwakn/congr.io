import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Feature } from 'src/utils/constants';
import { ThemePaletteConfig } from '../configurations/configurations.types';
import { Congregation } from '../congregation/congregation.entity';
import { Location } from '../location/location.entity';

export class SetupRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}

export class SetupUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;
}

export class SetupLocationDto implements Pick<Location, 'order' | 'name' | 'address'> {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(240)
  address: string;
}

export class SetupCongregationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  type: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SetupLocationDto)
  locations: SetupLocationDto[];

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Feature, { each: true })
  features: Feature[];
}

export class SetupPayloadDto {
  @ValidateNested()
  @Type(() => SetupRoleDto)
  role: SetupRoleDto;

  @ValidateNested()
  @Type(() => SetupUserDto)
  user: SetupUserDto;

  @ValidateNested()
  @Type(() => SetupCongregationDto)
  congregation: SetupCongregationDto;
}

export interface SetupProps {
  role: SetupRoleDto;
  user: SetupUserDto;
  congregation: SetupCongregationDto;
}

export interface SetupResponse {
  isSetup: true;
  congregation: SetupCongregationData;
}

export interface IsSetupResponse {
  isSetup: boolean;
  congregation?: SetupCongregationData;
}

export interface SetupCongregationData extends Pick<Congregation, 'id' | 'name' | 'type' | 'features' | 'updated_at'> {
  locations: Array<Pick<Location, 'id' | 'order' | 'name' | 'address'>>;
  theme_palette: ThemePaletteConfig;
}
