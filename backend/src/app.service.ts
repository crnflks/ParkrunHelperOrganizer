// filename: backend/src/app.service.ts

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'parkrun-helper-backend',
      version: '1.0.0',
    };
  }

  getSecureData() {
    return {
      message: 'This is protected data from the Parkrun Helper API',
      timestamp: new Date().toISOString(),
      data: {
        totalVolunteers: 42,
        upcomingEvents: 5,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}