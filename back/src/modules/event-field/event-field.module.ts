import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { PersonField } from '../person-field/person-field.entity';
import { User } from '../user/user.entity';
import { EventFieldController } from './event-field.controller';
import { EventField } from './event-field.entity';
import { EventFieldService } from './event-field.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventField, PersonField, User, Congregation])],
  controllers: [EventFieldController],
  providers: [EventFieldService],
  exports: [EventFieldService, TypeOrmModule],
})
export class EventFieldModule {}
