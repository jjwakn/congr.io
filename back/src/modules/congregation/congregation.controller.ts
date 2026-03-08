import { CommonController } from 'src/common/common.controller';
import { Module } from 'src/utils/constants';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Congregation } from './congregation.entity';
import { CongregationService } from './congregation.service';
import { CongregationQuery } from './congregation.types';

@ApiTags('congregation')
@Controller('congregation')
export class CongregationController extends CommonController<Congregation, CongregationQuery> {
  protected module = Module.congregation;

  constructor(protected readonly service: CongregationService) {
    super();
  }
}
