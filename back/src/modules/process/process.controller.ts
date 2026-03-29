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
import { ProcessService } from './process.service';
import { ProcessDto, ProcessQuery } from './process.types';

@ApiTags('process')
@Controller('process')
@UseGuards(AuthGuard, PermissionGuard)
export class ProcessController {
  constructor(private readonly service: ProcessService) {}

  @PermissionDecorator(Module.process, ModuleAction.get)
  @Get()
  async list(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: ProcessQuery,
    @Req() request: RequestType,
  ) {
    return this.service.list({
      query,
      userId: getRequestUserIdOrThrow(request),
    });
  }

  @PermissionDecorator(Module.process, ModuleAction.get)
  @Get(':id')
  async get(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.get({
      id,
      userId: getRequestUserIdOrThrow(request),
    });
  }

  @PermissionDecorator(Module.process, ModuleAction.create)
  @Post()
  @ApiBody({ type: ProcessDto })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ProcessDto,
    @Req() request: RequestType,
  ) {
    return this.service.create({
      data,
      userId: getRequestUserIdOrThrow(request),
    });
  }

  @PermissionDecorator(Module.process, ModuleAction.update)
  @Put(':id')
  @ApiBody({ type: ProcessDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) data: ProcessDto,
    @Req() request: RequestType,
  ) {
    return this.service.update({
      id,
      data,
      userId: getRequestUserIdOrThrow(request),
    });
  }

  @PermissionDecorator(Module.process, ModuleAction.delete)
  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Req() request: RequestType) {
    return this.service.remove({
      id,
      userId: getRequestUserIdOrThrow(request),
    });
  }
}
