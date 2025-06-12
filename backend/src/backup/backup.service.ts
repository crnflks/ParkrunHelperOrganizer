// Backup service for automated Cosmos DB backups
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosClient, Container, Database } from '@azure/cosmos';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);

export interface BackupOptions {
  includeMetadata?: boolean;
  compress?: boolean;
  format?: 'json' | 'ndjson';
  batchSize?: number;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  timestamp: string;
  filePath?: string;
  fileSize?: number;
  recordCount?: number;
  duration?: number;
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly cosmosClient: CosmosClient;
  private readonly database: Database;
  private readonly backupDir: string;

  constructor(private configService: ConfigService) {
    this.cosmosClient = new CosmosClient({
      endpoint: this.configService.get('COSMOS_DB_ENDPOINT'),
      key: this.configService.get('COSMOS_DB_KEY'),
    });
    
    this.database = this.cosmosClient.database(
      this.configService.get('COSMOS_DB_DATABASE_NAME')
    );
    
    this.backupDir = this.configService.get('BACKUP_DIRECTORY') || './backups';
    this.ensureBackupDirectory();
  }

  async createFullBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    this.logger.log(`Starting full backup: ${backupId}`);
    
    try {
      const containers = ['helpers', 'schedules']; // Add other containers as needed
      const backupData: any = {
        metadata: {
          backupId,
          timestamp,
          type: 'full',
          version: '1.0.0',
        },
        containers: {},
      };

      let totalRecords = 0;

      // Backup each container
      for (const containerName of containers) {
        try {
          const container = this.database.container(containerName);
          const containerData = await this.backupContainer(container, options);
          backupData.containers[containerName] = containerData.records;
          totalRecords += containerData.count;
          
          this.logger.log(`Backed up ${containerData.count} records from ${containerName}`);
        } catch (error) {
          this.logger.error(`Failed to backup container ${containerName}:`, error);
          backupData.containers[containerName] = { error: error.message };
        }
      }

      // Write backup file
      const fileName = `${backupId}.json${options.compress ? '.gz' : ''}`;
      const filePath = path.join(this.backupDir, fileName);
      
      let jsonData = JSON.stringify(backupData, null, 2);
      let fileSize: number;

      if (options.compress) {
        const compressed = await gzip(Buffer.from(jsonData));
        fs.writeFileSync(filePath, compressed);
        fileSize = compressed.length;
      } else {
        fs.writeFileSync(filePath, jsonData);
        fileSize = Buffer.byteLength(jsonData);
      }

      const duration = Date.now() - startTime;

      this.logger.log(`Backup completed: ${backupId}, ${totalRecords} records, ${fileSize} bytes, ${duration}ms`);

      return {
        success: true,
        backupId,
        timestamp,
        filePath,
        fileSize,
        recordCount: totalRecords,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Backup failed: ${backupId}`, error);
      
      return {
        success: false,
        backupId,
        timestamp,
        duration,
        error: error.message,
      };
    }
  }

  async createIncrementalBackup(since: Date, options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const backupId = `incremental_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    this.logger.log(`Starting incremental backup since ${since.toISOString()}: ${backupId}`);
    
    try {
      const containers = ['helpers', 'schedules'];
      const backupData: any = {
        metadata: {
          backupId,
          timestamp,
          type: 'incremental',
          since: since.toISOString(),
          version: '1.0.0',
        },
        containers: {},
      };

      let totalRecords = 0;

      // Backup changes from each container since the specified date
      for (const containerName of containers) {
        try {
          const container = this.database.container(containerName);
          const containerData = await this.backupContainerIncremental(container, since, options);
          backupData.containers[containerName] = containerData.records;
          totalRecords += containerData.count;
          
          this.logger.log(`Backed up ${containerData.count} changed records from ${containerName}`);
        } catch (error) {
          this.logger.error(`Failed to backup container ${containerName}:`, error);
          backupData.containers[containerName] = { error: error.message };
        }
      }

      // Write backup file
      const fileName = `${backupId}.json${options.compress ? '.gz' : ''}`;
      const filePath = path.join(this.backupDir, fileName);
      
      let jsonData = JSON.stringify(backupData, null, 2);
      let fileSize: number;

      if (options.compress) {
        const compressed = await gzip(Buffer.from(jsonData));
        fs.writeFileSync(filePath, compressed);
        fileSize = compressed.length;
      } else {
        fs.writeFileSync(filePath, jsonData);
        fileSize = Buffer.byteLength(jsonData);
      }

      const duration = Date.now() - startTime;

      this.logger.log(`Incremental backup completed: ${backupId}, ${totalRecords} records, ${fileSize} bytes, ${duration}ms`);

      return {
        success: true,
        backupId,
        timestamp,
        filePath,
        fileSize,
        recordCount: totalRecords,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Incremental backup failed: ${backupId}`, error);
      
      return {
        success: false,
        backupId,
        timestamp,
        duration,
        error: error.message,
      };
    }
  }

  async listBackups(): Promise<any[]> {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(file => 
        file.startsWith('backup_') || file.startsWith('incremental_')
      );

      const backups = backupFiles.map(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          fileName: file,
          filePath,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          type: file.startsWith('incremental_') ? 'incremental' : 'full',
        };
      });

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      this.logger.error('Failed to list backups:', error);
      return [];
    }
  }

  async deleteOldBackups(retentionDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const backups = await this.listBackups();
      let deletedCount = 0;

      for (const backup of backups) {
        if (backup.created < cutoffDate) {
          try {
            fs.unlinkSync(backup.filePath);
            deletedCount++;
            this.logger.log(`Deleted old backup: ${backup.fileName}`);
          } catch (error) {
            this.logger.error(`Failed to delete backup ${backup.fileName}:`, error);
          }
        }
      }

      this.logger.log(`Deleted ${deletedCount} old backups (older than ${retentionDays} days)`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to delete old backups:', error);
      return 0;
    }
  }

  async restoreFromBackup(backupId: string, containerName?: string): Promise<{ success: boolean; message: string; recordsRestored?: number }> {
    try {
      const backups = await this.listBackups();
      const backup = backups.find(b => b.fileName.includes(backupId));
      
      if (!backup) {
        return { success: false, message: `Backup with ID ${backupId} not found` };
      }

      this.logger.log(`Starting restore from backup: ${backup.fileName}`);
      
      // Read backup file
      let backupData: any;
      const fileContent = fs.readFileSync(backup.filePath);
      
      if (backup.fileName.endsWith('.gz')) {
        const decompressed = zlib.gunzipSync(fileContent);
        backupData = JSON.parse(decompressed.toString());
      } else {
        backupData = JSON.parse(fileContent.toString());
      }

      let recordsRestored = 0;
      const containersToRestore = containerName ? [containerName] : Object.keys(backupData.containers);

      for (const name of containersToRestore) {
        if (!backupData.containers[name] || backupData.containers[name].error) {
          continue;
        }

        const container = this.database.container(name);
        const records = backupData.containers[name];
        
        for (const record of records) {
          try {
            await container.items.upsert(record);
            recordsRestored++;
          } catch (error) {
            this.logger.error(`Failed to restore record ${record.id}:`, error);
          }
        }
      }

      this.logger.log(`Restore completed: ${recordsRestored} records restored`);
      
      return { 
        success: true, 
        message: `Successfully restored ${recordsRestored} records from backup ${backupId}`,
        recordsRestored 
      };
    } catch (error) {
      this.logger.error(`Restore failed for backup ${backupId}:`, error);
      return { success: false, message: error.message };
    }
  }

  private async backupContainer(container: Container, options: BackupOptions): Promise<{ records: any[]; count: number }> {
    const batchSize = options.batchSize || 1000;
    const records: any[] = [];
    
    const querySpec = {
      query: 'SELECT * FROM c',
    };

    const queryIterator = container.items.query(querySpec, { maxItemCount: batchSize });
    
    while (queryIterator.hasMoreResults()) {
      const { resources } = await queryIterator.fetchNext();
      records.push(...resources);
    }

    return { records, count: records.length };
  }

  private async backupContainerIncremental(container: Container, since: Date, options: BackupOptions): Promise<{ records: any[]; count: number }> {
    const batchSize = options.batchSize || 1000;
    const records: any[] = [];
    
    // Assuming documents have a _ts (timestamp) field
    const querySpec = {
      query: 'SELECT * FROM c WHERE c._ts > @since',
      parameters: [
        { name: '@since', value: Math.floor(since.getTime() / 1000) }
      ],
    };

    const queryIterator = container.items.query(querySpec, { maxItemCount: batchSize });
    
    while (queryIterator.hasMoreResults()) {
      const { resources } = await queryIterator.fetchNext();
      records.push(...resources);
    }

    return { records, count: records.length };
  }

  private ensureBackupDirectory(): void {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      this.logger.log(`Created backup directory: ${this.backupDir}`);
    }
  }
}