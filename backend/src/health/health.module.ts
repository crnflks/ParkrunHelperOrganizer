// Health check module for comprehensive application monitoring
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { ExternalApiHealthIndicator } from './indicators/external-api.health';
import { BusinessLogicHealthIndicator } from './indicators/business-logic.health';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    DatabaseHealthIndicator,
    ExternalApiHealthIndicator,
    BusinessLogicHealthIndicator,
  ],
  exports: [HealthService],
})
export class HealthModule {}