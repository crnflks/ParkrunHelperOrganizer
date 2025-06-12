// Backup scheduler for automated backup tasks using cron jobs
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackupService } from './backup.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(
    private readonly backupService: BackupService,
    private readonly configService: ConfigService,
  ) {}

  // Daily full backup at 2:00 AM
  @Cron('0 2 * * *', {
    name: 'daily-full-backup',
    timeZone: 'UTC',
  })
  async handleDailyFullBackup() {
    if (!this.isBackupEnabled()) {
      this.logger.debug('Backup is disabled, skipping daily full backup');
      return;
    }

    this.logger.log('Starting scheduled daily full backup');
    
    try {
      const result = await this.backupService.createFullBackup({
        includeMetadata: true,
        compress: true,
        format: 'json',
        batchSize: 1000,
      });

      if (result.success) {
        this.logger.log(`Daily full backup completed successfully: ${result.backupId}, ${result.recordCount} records, ${result.fileSize} bytes`);
      } else {
        this.logger.error(`Daily full backup failed: ${result.error}`);
      }
    } catch (error) {
      this.logger.error('Daily full backup encountered an error:', error);
    }
  }

  // Hourly incremental backup (during business hours: 9 AM - 6 PM UTC)
  @Cron('0 9-18 * * 1-5', {
    name: 'hourly-incremental-backup',
    timeZone: 'UTC',
  })
  async handleHourlyIncrementalBackup() {
    if (!this.isBackupEnabled()) {
      this.logger.debug('Backup is disabled, skipping hourly incremental backup');
      return;
    }

    this.logger.log('Starting scheduled hourly incremental backup');
    
    try {
      // Create incremental backup for changes in the last hour
      const since = new Date();
      since.setHours(since.getHours() - 1);

      const result = await this.backupService.createIncrementalBackup(since, {
        includeMetadata: true,
        compress: true,
        format: 'json',
        batchSize: 500,
      });

      if (result.success) {
        this.logger.log(`Hourly incremental backup completed: ${result.backupId}, ${result.recordCount} records, ${result.fileSize} bytes`);
      } else {
        this.logger.error(`Hourly incremental backup failed: ${result.error}`);
      }
    } catch (error) {
      this.logger.error('Hourly incremental backup encountered an error:', error);
    }
  }

  // Weekly cleanup of old backups on Sunday at 3:00 AM
  @Cron('0 3 * * 0', {
    name: 'weekly-backup-cleanup',
    timeZone: 'UTC',
  })
  async handleWeeklyBackupCleanup() {
    if (!this.isBackupEnabled()) {
      this.logger.debug('Backup is disabled, skipping weekly cleanup');
      return;
    }

    this.logger.log('Starting scheduled weekly backup cleanup');
    
    try {
      const retentionDays = parseInt(this.configService.get('BACKUP_RETENTION_DAYS', '30'));
      const deletedCount = await this.backupService.deleteOldBackups(retentionDays);
      
      this.logger.log(`Weekly backup cleanup completed: deleted ${deletedCount} old backup files`);
    } catch (error) {
      this.logger.error('Weekly backup cleanup encountered an error:', error);
    }
  }

  // Monthly verification backup on the 1st of each month at 4:00 AM
  @Cron('0 4 1 * *', {
    name: 'monthly-verification-backup',
    timeZone: 'UTC',
  })
  async handleMonthlyVerificationBackup() {
    if (!this.isBackupEnabled()) {
      this.logger.debug('Backup is disabled, skipping monthly verification backup');
      return;
    }

    this.logger.log('Starting scheduled monthly verification backup');
    
    try {
      // Create a comprehensive backup with extended validation
      const result = await this.backupService.createFullBackup({
        includeMetadata: true,
        compress: true,
        format: 'json',
        batchSize: 2000,
      });

      if (result.success) {
        this.logger.log(`Monthly verification backup completed: ${result.backupId}, ${result.recordCount} records, ${result.fileSize} bytes`);
        
        // Additional verification: list all backups to ensure backup directory is healthy
        const backups = await this.backupService.listBackups();
        this.logger.log(`Backup directory contains ${backups.length} backup files`);
        
        // Log backup statistics
        const fullBackups = backups.filter(b => b.type === 'full').length;
        const incrementalBackups = backups.filter(b => b.type === 'incremental').length;
        const totalSize = backups.reduce((sum, b) => sum + b.size, 0);
        
        this.logger.log(`Backup statistics: ${fullBackups} full, ${incrementalBackups} incremental, ${Math.round(totalSize / 1024 / 1024)}MB total`);
      } else {
        this.logger.error(`Monthly verification backup failed: ${result.error}`);
      }
    } catch (error) {
      this.logger.error('Monthly verification backup encountered an error:', error);
    }
  }

  private isBackupEnabled(): boolean {
    return this.configService.get('ENABLE_AUTOMATED_BACKUPS', 'true') === 'true';
  }
}