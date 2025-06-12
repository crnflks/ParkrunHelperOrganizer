import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = module.get<AppService>(AppService);
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const result = service.getHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('service', 'parkrun-helper-backend');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('timestamp');
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return current timestamp', () => {
      const before = new Date();
      const result = service.getHealth();
      const after = new Date();

      const timestamp = new Date(result.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getSecureData', () => {
    it('should return secure data with proper structure', () => {
      const result = service.getSecureData();

      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('totalVolunteers', 42);
      expect(result.data).toHaveProperty('upcomingEvents', 5);
      expect(result.data).toHaveProperty('lastUpdated');
    });

    it('should return message about protected data', () => {
      const result = service.getSecureData();

      expect(result.message).toContain('protected data');
      expect(result.message).toContain('Parkrun Helper API');
    });

    it('should return current timestamps', () => {
      const before = new Date();
      const result = service.getSecureData();
      const after = new Date();

      const timestamp = new Date(result.timestamp);
      const lastUpdated = new Date(result.data.lastUpdated);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(lastUpdated.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(lastUpdated.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should return consistent data structure', () => {
      const result1 = service.getSecureData();
      const result2 = service.getSecureData();

      // Data structure should be consistent
      expect(result1.data.totalVolunteers).toBe(result2.data.totalVolunteers);
      expect(result1.data.upcomingEvents).toBe(result2.data.upcomingEvents);
      
      // But timestamps should be different (unless called at exact same millisecond)
      expect(result1.message).toBe(result2.message);
    });
  });
});