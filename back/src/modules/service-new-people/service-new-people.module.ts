import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Person } from '../person/person.entity';
import { PersonModule } from '../person/person.module';
import { Service } from '../service/service.entity';
import { User } from '../user/user.entity';
import { ServiceNewPeopleController } from './service-new-people.controller';
import { ServiceNewPeople, ServiceNewPerson } from './service-new-people.entity';
import { ServiceNewPeopleService } from './service-new-people.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceNewPeople, ServiceNewPerson, Service, Person, User, Congregation]),
    PersonModule,
  ],
  controllers: [ServiceNewPeopleController],
  providers: [ServiceNewPeopleService],
  exports: [ServiceNewPeopleService, TypeOrmModule],
})
export class ServiceNewPeopleModule {}
