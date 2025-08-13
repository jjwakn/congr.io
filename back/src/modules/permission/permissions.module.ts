import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';

@Module({
  providers: [PermissionService],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
