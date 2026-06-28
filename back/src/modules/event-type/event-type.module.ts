import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { EventField } from '../event-field/event-field.entity';
import { EventFieldModule } from '../event-field/event-field.module';
import { Event } from '../event/event.entity';
import { ProcessStep } from '../process/process-step.entity';
import { User } from '../user/user.entity';
import { EventTypeController } from './event-type.controller';
import { EventType } from './event-type.entity';
import { EventTypeService } from './event-type.service';

@Module({
  imports: [
    EventFieldModule,
    TypeOrmModule.forFeature([EventType, EventField, ProcessStep, Event, User, Congregation]),
  ],
  providers: [EventTypeService],
  controllers: [EventTypeController],
  exports: [EventTypeService, TypeOrmModule],
})
export class EventTypeModule {}
