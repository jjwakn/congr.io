import type { RequestType } from 'src/common/common.types';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { PermissionDecorator, PermissionGuard } from 'src/modules/permission/permission.guard';
import { Module, ModuleAction } from 'src/utils/constants';
import { getRequestUserIdOrThrow } from 'src/utils/request';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { CongregationService } from './congregation.service';
import { CongregationDto, CongregationQuery } from './congregation.types';

@ApiTags('congregation')
@Controller('congregation')
@UseGuards(AuthGuard, PermissionGuard)
export class CongregationController {
  constructor(private readonly service: CongregationService) {}

  @PermissionDecorator(Module.congregation, ModuleAction.get)
  @Get()
  list(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: CongregationQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({ query, userId: getRequestUserIdOrThrow(request) });
  }

  @PermissionDecorator(Module.congregation, ModuleAction.create)
  @Get('creation-users')
  creationUsers(@Req() request: RequestType) {
    return this.service.listCreationUsers(getRequestUserIdOrThrow(request));
  }

  @PermissionDecorator(Module.congregation, ModuleAction.get)
  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({ id, userId: getRequestUserIdOrThrow(request) });
  }

  @PermissionDecorator(Module.congregation, ModuleAction.create)
  @Post()
  @ApiBody({ type: CongregationDto })
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: CongregationDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({ data, userId: getRequestUserIdOrThrow(request) });
  }

  @PermissionDecorator(Module.congregation, ModuleAction.update)
  @Put(':id')
  @ApiBody({ type: CongregationDto })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: CongregationDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({ id, data, userId: getRequestUserIdOrThrow(request) });
  }

  @PermissionDecorator(Module.congregation, ModuleAction.delete)
  @Get(':id/deletion-preview')
  deletionPreview(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.getDeletionPreview({ id, userId: getRequestUserIdOrThrow(request) });
  }

  @PermissionDecorator(Module.congregation, ModuleAction.delete)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({ id, userId: getRequestUserIdOrThrow(request) });
  }
}
