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
import { EventService } from './event.service';
import { EventDto, EventQuery, EventRegistrationLockDto } from './event.types';

const can = (request: RequestType, section: Module, action: ModuleAction) =>
  Boolean(request.user?.auth.fullAccess || request.user?.auth.permissions[section]?.includes(action));

@ApiTags('event')
@Controller('event')
@UseGuards(AuthGuard)
export class EventController {
  constructor(private readonly service: EventService) {}

  @Get()
  async list(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: EventQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({
      query,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
      canViewAll: can(request, Module.event, ModuleAction.get),
    });
  }

  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({
      id,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
      canViewAll: can(request, Module.event, ModuleAction.get),
    });
  }

  @PermissionDecorator(Module.event, ModuleAction.create)
  @UseGuards(PermissionGuard)
  @Post()
  @ApiBody({ type: EventDto })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: EventDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({
      data,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event, ModuleAction.update)
  @UseGuards(PermissionGuard)
  @Put(':id')
  @ApiBody({ type: EventDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: EventDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({
      id,
      data,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_registration, ModuleAction.lock)
  @UseGuards(PermissionGuard)
  @Put(':id/registration-lock')
  setRegistrationLock(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: EventRegistrationLockDto,
    @Req() request: RequestType,
  ) {
    return this.service.setRegistrationLock({
      id,
      locked: data.locked,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event, ModuleAction.delete)
  @UseGuards(PermissionGuard)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({
      id,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }
}

@ApiTags('public-events')
@Controller('public/events')
export class PublicEventController {
  constructor(private readonly service: EventService) {}

  @Get()
  list(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: EventQuery,
    @Query('congregation_id', new ParseUUIDPipe({ version: '4' })) congregationId: string,
  ) {
    return this.service.listPublic({ congregationId, query });
  }

  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.getPublic(id);
  }
}
