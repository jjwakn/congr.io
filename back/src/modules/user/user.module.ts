import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CongregationModule } from '../congregation/congregation.module';
import { LocationModule } from '../location/location.module';
import { PermissionModule } from '../permission/permission.module';
import { Person } from '../person/person.entity';
import { RoleModule } from '../role/role.module';
import { UserController } from './user.controller';
import { User } from './user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Person]), RoleModule, PermissionModule, CongregationModule, LocationModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
