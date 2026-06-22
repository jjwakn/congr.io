import type { Response } from 'express';
import type { RequestType } from 'src/common/common.types';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { PermissionDecorator, PermissionGuard } from 'src/modules/permission/permission.guard';
import { Module, ModuleAction } from 'src/utils/constants';
import { getRequestCongregationId, getRequestUserIdOrThrow } from 'src/utils/request';
import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @UseGuards(AuthGuard)
  @Get('status')
  status() {
    return this.service.getStatus();
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.event, ModuleAction.create)
  @Post('event-image')
  @UseInterceptors(FileInterceptor('file'))
  uploadEventImage(@UploadedFile() file: Express.Multer.File, @Req() request: RequestType) {
    return this.service.uploadImage({
      file,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.congregation, ModuleAction.update)
  @Post('congregation-logo/:kind')
  @UseInterceptors(FileInterceptor('file'))
  uploadCongregationLogo(
    @Param('kind') kind: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: RequestType,
  ) {
    return this.service.uploadCongregationLogo({
      file,
      kind,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @Get('public/:id')
  async publicFile(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Res() response: Response) {
    const { file, stream } = await this.service.getFile(id, true);
    response.type(file.mime_type);
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);
    stream.pipe(response);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async privateFile(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() request: RequestType,
    @Res() response: Response,
  ) {
    const { file, stream } = await this.service.getFile(id, false, getRequestCongregationId(request));
    response.type(file.mime_type);
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);
    stream.pipe(response);
  }
}
