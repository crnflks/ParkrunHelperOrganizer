// filename: backend/src/helpers/helpers.module.ts

import { Module } from '@nestjs/common';
import { HelpersController } from './helpers.controller';
import { HelpersService } from './helpers.service';
import { HelpersRepository } from './helpers.repository';

@Module({
  controllers: [HelpersController],
  providers: [HelpersService, HelpersRepository],
  exports: [HelpersService],
})
export class HelpersModule {}