import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Congregation } from '../congregation/congregation.entity';
import { User } from '../user/user.entity';
import { FilesController } from './files.controller';
import { StoredFile } from './files.entity';
import { FilesService } from './files.service';

@Module({
  imports: [TypeOrmModule.forFeature([StoredFile, User, Congregation])],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, TypeOrmModule],
})
export class FilesModule {}
