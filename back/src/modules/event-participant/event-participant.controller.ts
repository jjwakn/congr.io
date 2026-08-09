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
import { EventParticipantService } from './event-participant.service';
import {
  ParticipantDto,
  ParticipantMatchDto,
  ParticipantQuery,
  PublicRegistrationDto,
} from './event-participant.types';

@Controller('event-participant')
@UseGuards(AuthGuard, PermissionGuard)
export class EventParticipantController {
  constructor(private service: EventParticipantService) {}
  private context(request: RequestType) {
    return { userId: getRequestUserIdOrThrow(request), congregationId: getRequestCongregationId(request) };
  }
  @Get('attendance') @PermissionDecorator(Module.event_attendance, ModuleAction.get) attendanceList(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ParticipantQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({ query, ...this.context(request) });
  }
  @Post('attendance') @PermissionDecorator(Module.event_attendance, ModuleAction.create) attendanceCreate(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ParticipantDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({ data: { ...data, attended: true }, ...this.context(request) });
  }
  @Get() @PermissionDecorator(Module.event_registration, ModuleAction.get) list(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ParticipantQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({ query, ...this.context(request) });
  }
  @Post() @PermissionDecorator(Module.event_registration, ModuleAction.create) create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ParticipantDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({ data, ...this.context(request) });
  }
  @Put(':id/match') @PermissionDecorator(Module.event_registration, ModuleAction.update) match(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ParticipantMatchDto,
    @Req() request: RequestType,
  ) {
    return this.service.match({ id, personId: data.person_id, ...this.context(request) });
  }
  @Put(':id/attendance') @PermissionDecorator(Module.event_attendance, ModuleAction.create) attendance(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body('attended') attended: boolean,
    @Req() request: RequestType,
  ) {
    return this.service.setAttended({ id, attended, ...this.context(request) });
  }
  @Delete('attendance/event/:id') @PermissionDecorator(Module.event_attendance, ModuleAction.delete) attendanceClear(
    @Param('id', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Req() request: RequestType,
  ) {
    return this.service.clearAttendance({ eventId, ...this.context(request) });
  }
  @Delete('attendance/:id') @PermissionDecorator(Module.event_attendance, ModuleAction.delete) attendanceRemove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: RequestType,
  ) {
    return this.service.remove({ id, ...this.context(request) });
  }
  @Delete('event/:id') @PermissionDecorator(Module.event_registration, ModuleAction.delete) clear(
    @Param('id', new ParseUUIDPipe({ version: '4' })) eventId: string,
    @Req() request: RequestType,
  ) {
    return this.service.clearRegistration({ eventId, ...this.context(request) });
  }
  @Delete(':id') @PermissionDecorator(Module.event_registration, ModuleAction.delete) remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: RequestType,
  ) {
    return this.service.remove({ id, ...this.context(request) });
  }
}
@Controller('public/event-registration')
export class PublicEventRegistrationController {
  constructor(private service: EventParticipantService) {}
  @Post(':id') register(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: PublicRegistrationDto,
  ) {
    return this.service.publicRegister(id, data);
  }
}
