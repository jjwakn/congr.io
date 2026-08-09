import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { Person } from '../person/person.entity';
import { User } from '../user/user.entity';
import { PersonFieldController } from './person-field.controller';
import { PersonField } from './person-field.entity';
import { PersonFieldService } from './person-field.service';

@Module({
  imports: [TypeOrmModule.forFeature([PersonField, Person, User, Congregation])],
  controllers: [PersonFieldController],
  providers: [PersonFieldService],
  exports: [PersonFieldService, TypeOrmModule],
})
export class PersonFieldModule {}
