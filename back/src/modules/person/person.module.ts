import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { User } from '../user/user.entity';
import { PersonController } from './person.controller';
import { Person } from './person.entity';
import { PersonService } from './person.service';

@Module({
  imports: [TypeOrmModule.forFeature([Person, User, Congregation])],
  controllers: [PersonController],
  providers: [PersonService],
  exports: [PersonService, TypeOrmModule],
})
export class PersonModule {}
