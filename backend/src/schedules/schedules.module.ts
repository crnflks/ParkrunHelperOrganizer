// filename: backend/src/schedules/schedules.module.ts

import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { SchedulesRepository } from './schedules.repository';
import { HelpersModule } from '../helpers/helpers.module';

@Module({
  imports: [HelpersModule],
  controllers: [SchedulesController],
  providers: [SchedulesService, SchedulesRepository],
})
export class SchedulesModule {}