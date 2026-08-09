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
import { PersonService } from './person.service';
import { PersonDto, PersonQuery } from './person.types';

@Controller('person')
@UseGuards(AuthGuard, PermissionGuard)
export class PersonController {
  constructor(private readonly service: PersonService) {}
  private context(request: RequestType) {
    return { userId: getRequestUserIdOrThrow(request), congregationId: getRequestCongregationId(request) };
  }
  @Get()
  @PermissionDecorator(Module.person, ModuleAction.get)
  list(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: PersonQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({ query, ...this.context(request) });
  }
  @Get(':id/flows')
  @PermissionDecorator(Module.person, ModuleAction.get)
  flows(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.getFlows({ id, ...this.context(request) });
  }
  @Get(':id')
  @PermissionDecorator(Module.person, ModuleAction.get)
  get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({ id, ...this.context(request) });
  }
  @Post()
  @PermissionDecorator(Module.person, ModuleAction.create)
  create(@Body(new ValidationPipe({ transform: true, whitelist: true })) data: PersonDto, @Req() request: RequestType) {
    return this.service.create({ data, ...this.context(request) });
  }
  @Put(':id')
  @PermissionDecorator(Module.person, ModuleAction.update)
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: PersonDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({ id, data, ...this.context(request) });
  }
  @Delete(':id')
  @PermissionDecorator(Module.person, ModuleAction.delete)
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({ id, ...this.context(request) });
  }
}
