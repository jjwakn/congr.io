import type { RequestType } from 'src/common/common.types';
import { ListParamsQuery } from 'src/common/common.types';
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
import { PersonFieldService } from './person-field.service';
import { PersonFieldDto } from './person-field.types';

@Controller('person-field')
@UseGuards(AuthGuard, PermissionGuard)
export class PersonFieldController {
  constructor(private service: PersonFieldService) {}
  private context(request: RequestType) {
    return { userId: getRequestUserIdOrThrow(request), congregationId: getRequestCongregationId(request) };
  }
  @Get() @PermissionDecorator(Module.person_field, ModuleAction.get) list(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ListParamsQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({ query, ...this.context(request) });
  }
  @Get(':id') @PermissionDecorator(Module.person_field, ModuleAction.get) get(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: RequestType,
  ) {
    return this.service.get({ id, ...this.context(request) });
  }
  @Post() @PermissionDecorator(Module.person_field, ModuleAction.create) create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: PersonFieldDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({ data, ...this.context(request) });
  }
  @Put(':id') @PermissionDecorator(Module.person_field, ModuleAction.update) update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: PersonFieldDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({ id, data, ...this.context(request) });
  }
  @Delete(':id') @PermissionDecorator(Module.person_field, ModuleAction.delete) remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: RequestType,
  ) {
    return this.service.remove({ id, ...this.context(request) });
  }
}
