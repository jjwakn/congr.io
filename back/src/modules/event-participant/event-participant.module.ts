import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Event } from '../event/event.entity';
import { Person } from '../person/person.entity';
import { User } from '../user/user.entity';
import { EventParticipantController, PublicEventRegistrationController } from './event-participant.controller';
import { EventParticipant } from './event-participant.entity';
import { EventParticipantService } from './event-participant.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventParticipant, Event, Person, User, Congregation])],
  controllers: [EventParticipantController, PublicEventRegistrationController],
  providers: [EventParticipantService],
  exports: [EventParticipantService, TypeOrmModule],
})
export class EventParticipantModule {}
