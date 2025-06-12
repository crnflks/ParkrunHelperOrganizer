// filename: backend/src/database/database.module.ts

import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosClient } from '@azure/cosmos';

@Global()
@Module({
  providers: [
    {
      provide: 'COSMOS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const endpoint = configService.get<string>('COSMOS_ENDPOINT');
        const key = configService.get<string>('COSMOS_KEY');
        
        if (!endpoint || !key) {
          throw new Error('COSMOS_ENDPOINT and COSMOS_KEY must be configured');
        }

        return new CosmosClient({
          endpoint,
          key,
          userAgentSuffix: 'ParkrunHelperApp',
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'DATABASE_NAME',
      useFactory: (configService: ConfigService) => {
        return configService.get<string>('COSMOS_DATABASE_NAME', 'parkrunhelper');
      },
      inject: [ConfigService],
    },
  ],
  exports: ['COSMOS_CLIENT', 'DATABASE_NAME'],
})
export class DatabaseModule {}