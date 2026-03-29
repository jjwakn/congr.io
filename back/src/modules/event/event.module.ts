import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { EventType } from '../event-type/event-type.entity';
import { User } from '../user/user.entity';
import { EventController } from './event.controller';
import { Event } from './event.entity';
import { EventService } from './event.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventType, User, Congregation])],
  providers: [EventService],
  controllers: [EventController],
  exports: [EventService, TypeOrmModule],
})
export class EventModule {}
