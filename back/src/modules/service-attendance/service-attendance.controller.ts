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
import { ServiceAttendanceService } from './service-attendance.service';
import { ServiceAttendanceDeltaDto, ServiceAttendanceDto, ServiceAttendanceQuery } from './service-attendance.types';

@Controller('service-attendance')
@UseGuards(AuthGuard, PermissionGuard)
export class ServiceAttendanceController {
  constructor(private readonly service: ServiceAttendanceService) {}

  private context(request: RequestType) {
    return { userId: getRequestUserIdOrThrow(request), congregationId: getRequestCongregationId(request) };
  }

  @Get()
  @PermissionDecorator(Module.service_attendance, ModuleAction.get)
  list(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ServiceAttendanceQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({ query, ...this.context(request) });
  }

  @Get(':id')
  @PermissionDecorator(Module.service_attendance, ModuleAction.get)
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({ id, ...this.context(request) });
  }

  @Post()
  @PermissionDecorator(Module.service_attendance, ModuleAction.create)
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ServiceAttendanceDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({ data, ...this.context(request) });
  }

  @Post('delta')
  @PermissionDecorator(Module.service_attendance, ModuleAction.update)
  delta(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ServiceAttendanceDeltaDto,
    @Req() request: RequestType,
  ) {
    return this.service.applyDelta({ data, ...this.context(request) });
  }

  @Put(':id')
  @PermissionDecorator(Module.service_attendance, ModuleAction.update)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ServiceAttendanceDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({ id, data, ...this.context(request) });
  }

  @Delete(':id')
  @PermissionDecorator(Module.service_attendance, ModuleAction.delete)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({ id, ...this.context(request) });
  }
}
