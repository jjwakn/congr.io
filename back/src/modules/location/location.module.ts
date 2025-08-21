import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { Location } from './location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Location]),
    UserModule,
    ConfigModule.forRoot(),
  ],
  exports: [TypeOrmModule],
})
export class LocationModule {}
