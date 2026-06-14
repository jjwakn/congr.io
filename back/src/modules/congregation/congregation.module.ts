import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { CongregationController } from './congregation.controller';
import { Congregation } from './congregation.entity';
import { CongregationService } from './congregation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Congregation]), forwardRef(() => UserModule)],
  providers: [CongregationService],
  controllers: [CongregationController],
  exports: [CongregationService, TypeOrmModule],
})
export class CongregationModule {}
