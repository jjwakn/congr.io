import type { RequestType } from 'src/common/common.types';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { PermissionDecorator, PermissionGuard } from 'src/modules/permission/permission.guard';
import { Module, ModuleAction } from 'src/utils/constants';
import { getRequestCongregationId, getRequestUserIdOrThrow } from 'src/utils/request';
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
import { EventTypeService } from './event-type.service';
import { EventTypeDto, EventTypeQuery } from './event-type.types';

@ApiTags('event_type')
@Controller('event_type')
@UseGuards(AuthGuard, PermissionGuard)
export class EventTypeController {
  constructor(private readonly service: EventTypeService) {}

  @PermissionDecorator(Module.event_type, ModuleAction.get)
  @Get()
  async list(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: EventTypeQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({
      query,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_type, ModuleAction.get)
  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({
      id,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_type, ModuleAction.create)
  @Post()
  @ApiBody({ type: EventTypeDto })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: EventTypeDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({
      data,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_type, ModuleAction.update)
  @Put(':id')
  @ApiBody({ type: EventTypeDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: EventTypeDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({
      id,
      data,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_type, ModuleAction.delete)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({
      id,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }
}
