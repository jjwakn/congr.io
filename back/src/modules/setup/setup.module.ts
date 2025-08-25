import { Module } from '@nestjs/common';
import { CongregationModule } from '../congregation/congregation.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  imports: [UserModule, RoleModule, CongregationModule],
  providers: [SetupService],
  controllers: [SetupController],
  exports: [SetupService],
})
export class SetupModule {}
