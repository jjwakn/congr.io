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
import { EventFieldService } from './event-field.service';
import { EventFieldDto, EventFieldQuery } from './event-field.types';

@ApiTags('event_field')
@Controller('event-field')
@UseGuards(AuthGuard, PermissionGuard)
export class EventFieldController {
  constructor(private readonly service: EventFieldService) {}

  @PermissionDecorator(Module.event_field, ModuleAction.get)
  @Get()
  list(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: EventFieldQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({
      query,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_field, ModuleAction.get)
  @Get(':id')
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({
      id,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_field, ModuleAction.create)
  @Post()
  @ApiBody({ type: EventFieldDto })
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: EventFieldDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({
      data,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_field, ModuleAction.update)
  @Put(':id')
  @ApiBody({ type: EventFieldDto })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: EventFieldDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({
      id,
      data,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @PermissionDecorator(Module.event_field, ModuleAction.delete)
  @Delete(':id')
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({
      id,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }
}
