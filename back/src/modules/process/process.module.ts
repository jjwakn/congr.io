import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { EventType } from '../event-type/event-type.entity';
import { User } from '../user/user.entity';
import { ProcessStep } from './process-step.entity';
import { ProcessController } from './process.controller';
import { Process } from './process.entity';
import { ProcessService } from './process.service';

@Module({
  imports: [TypeOrmModule.forFeature([Process, ProcessStep, EventType, User, Congregation])],
  providers: [ProcessService],
  controllers: [ProcessController],
  exports: [ProcessService, TypeOrmModule],
})
export class ProcessModule {}
