import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Service } from '../service/service.entity';
import { User } from '../user/user.entity';
import { ServiceAttendanceController } from './service-attendance.controller';
import { ServiceAttendance } from './service-attendance.entity';
import { ServiceAttendanceService } from './service-attendance.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceAttendance, Service, User, Congregation])],
  controllers: [ServiceAttendanceController],
  providers: [ServiceAttendanceService],
  exports: [ServiceAttendanceService, TypeOrmModule],
})
export class ServiceAttendanceModule {}
