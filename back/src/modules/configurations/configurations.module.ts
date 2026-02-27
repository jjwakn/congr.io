import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { User } from '../user/user.entity';
import { ConfigurationsController } from './configurations.controller';
import { Configuration } from './configurations.entity';
import { ConfigurationsService } from './configurations.service';

@Module({
  imports: [TypeOrmModule.forFeature([Configuration, User, Congregation])],
  providers: [ConfigurationsService],
  controllers: [ConfigurationsController],
  exports: [ConfigurationsService, TypeOrmModule],
})
export class ConfigurationsModule {}
