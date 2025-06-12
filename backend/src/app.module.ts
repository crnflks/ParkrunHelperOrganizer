// filename: backend/src/app.module.ts

import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { HelpersModule } from './helpers/helpers.module';
import { SchedulesModule } from './schedules/schedules.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { BackupModule } from './backup/backup.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { WinstonLoggerModule, AppLoggerService, HttpLoggerMiddleware } from './common/logging';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    WinstonLoggerModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hour
        limit: 1000, // 1000 requests per hour
      },
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    DatabaseModule,
    AuthModule,
    HelpersModule,
    SchedulesModule,
    HealthModule,
    BackupModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLoggerService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, HttpLoggerMiddleware)
      .forRoutes('*');
  }
}