import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Event } from '../event/event.entity';
import { PersonField } from '../person-field/person-field.entity';
import { ProcessStep } from '../process/process-step.entity';
import { User } from '../user/user.entity';
import { EventTypeController } from './event-type.controller';
import { EventType } from './event-type.entity';
import { EventTypeService } from './event-type.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventType, ProcessStep, Event, User, Congregation, PersonField])],
  providers: [EventTypeService],
  controllers: [EventTypeController],
  exports: [EventTypeService, TypeOrmModule],
})
export class EventTypeModule {}
