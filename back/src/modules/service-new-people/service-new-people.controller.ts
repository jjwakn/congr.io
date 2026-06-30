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
import { ServiceNewPeopleService } from './service-new-people.service';
import { ServiceNewPeopleDto, ServiceNewPeopleQuery, ServiceNewPersonDto } from './service-new-people.types';

@Controller('service-new-people')
@UseGuards(AuthGuard, PermissionGuard)
export class ServiceNewPeopleController {
  constructor(private readonly service: ServiceNewPeopleService) {}

  private context(request: RequestType) {
    return { userId: getRequestUserIdOrThrow(request), congregationId: getRequestCongregationId(request) };
  }

  @Get()
  @PermissionDecorator(Module.service_new_people, ModuleAction.get)
  list(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ServiceNewPeopleQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({ query, ...this.context(request) });
  }

  @Get(':id')
  @PermissionDecorator(Module.service_new_people, ModuleAction.get)
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({ id, ...this.context(request) });
  }

  @Post()
  @PermissionDecorator(Module.service_new_people, ModuleAction.create)
  create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ServiceNewPeopleDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({ data, ...this.context(request) });
  }

  @Post(':id/person')
  @PermissionDecorator(Module.service_new_people, ModuleAction.create)
  addPerson(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ServiceNewPersonDto,
    @Req() request: RequestType,
  ) {
    return this.service.addPerson({ id, data, ...this.context(request) });
  }

  @Put(':id')
  @PermissionDecorator(Module.service_new_people, ModuleAction.update)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ServiceNewPeopleDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({ id, data, ...this.context(request) });
  }

  @Delete(':id/person/:personId')
  @PermissionDecorator(Module.service_new_people, ModuleAction.update)
  removePerson(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('personId', new ParseUUIDPipe({ version: '4' })) personId: string,
    @Req() request: RequestType,
  ) {
    return this.service.removePerson({ id, personId, ...this.context(request) });
  }

  @Delete(':id')
  @PermissionDecorator(Module.service_new_people, ModuleAction.delete)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({ id, ...this.context(request) });
  }
}
