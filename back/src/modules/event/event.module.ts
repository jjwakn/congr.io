import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { EventType } from '../event-type/event-type.entity';
import { FilesModule } from '../files/files.module';
import { PersonField } from '../person-field/person-field.entity';
import { User } from '../user/user.entity';
import { EventController, PublicEventController } from './event.controller';
import { Event } from './event.entity';
import { EventService } from './event.service';

@Module({
  imports: [TypeOrmModule.forFeature([Event, EventType, User, Congregation, PersonField]), FilesModule],
  providers: [EventService],
  controllers: [EventController, PublicEventController],
  exports: [EventService, TypeOrmModule],
})
export class EventModule {}
