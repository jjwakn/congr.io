import type { Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import type { RequestType } from 'src/common/common.types';
import { MAX_UPLOAD_BYTES } from 'src/config/security';
import { AuthGuard } from 'src/modules/auth/auth.guard';
import { PermissionDecorator, PermissionGuard } from 'src/modules/permission/permission.guard';
import { Module, ModuleAction } from 'src/utils/constants';
import { getRequestCongregationId, getRequestUserIdOrThrow } from 'src/utils/request';
import {
  Controller,
  ForbiddenException,
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
import { SecurityRateLimitService } from '../security/security-rate-limit.service';
import { SecurityRateLimitScope } from '../security/security.types';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(
    private readonly service: FilesService,
    private readonly i18n: I18nService,
    private readonly rateLimiter?: SecurityRateLimitService,
  ) {}

  @UseGuards(AuthGuard)
  @Get('status')
  status(@Req() request: RequestType) {
    if (!request.user?.auth.fullAccess) throw new ForbiddenException(this.i18n.t('errors.auth.unauthorized'));
    return this.service.getStatus();
  }

  @UseGuards(AuthGuard)
  @Get('event-image-options')
  eventImageOptions() {
    return this.service.getEventImageOptions();
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.event, ModuleAction.create)
  @Post('event-image')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4 } }))
  uploadEventImage(@UploadedFile() file: Express.Multer.File, @Req() request: RequestType) {
    this.rateLimiter?.assertAllowed(
      SecurityRateLimitScope.fileUpload,
      `${getRequestUserIdOrThrow(request)}:${request.ip ?? 'unavailable'}`,
    );
    return this.service.uploadImage({
      file,
      userId: getRequestUserIdOrThrow(request),
      congregationId: getRequestCongregationId(request),
    });
  }

  @UseGuards(AuthGuard, PermissionGuard)
  @PermissionDecorator(Module.congregation, ModuleAction.update)
  @Post('congregation-logo/:kind')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4 } }))
  uploadCongregationLogo(
    @Param('kind') kind: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() request: RequestType,
  ) {
    this.rateLimiter?.assertAllowed(
      SecurityRateLimitScope.fileUpload,
      `${getRequestUserIdOrThrow(request)}:${request.ip ?? 'unavailable'}`,
    );
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
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
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
    const { file, stream } = await this.service.getFile(
      id,
      false,
      getRequestCongregationId(request),
      getRequestUserIdOrThrow(request),
    );
    response.type(file.mime_type);
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);
    stream.pipe(response);
  }
}
