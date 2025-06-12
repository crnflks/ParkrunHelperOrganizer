// Backup controller for manual backup operations
import { Controller, Post, Get, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BackupService, BackupOptions, BackupResult } from './backup.service';

@ApiTags('Backup')
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('full')
  @ApiOperation({ 
    summary: 'Create full backup',
    description: 'Creates a full backup of all containers in the database'
  })
  @ApiBody({
    description: 'Backup options',
    required: false,
    schema: {
      type: 'object',
      properties: {
        includeMetadata: { type: 'boolean', default: true },
        compress: { type: 'boolean', default: true },
        format: { type: 'string', enum: ['json', 'ndjson'], default: 'json' },
        batchSize: { type: 'number', default: 1000 },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Backup created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        backupId: { type: 'string' },
        timestamp: { type: 'string' },
        filePath: { type: 'string' },
        fileSize: { type: 'number' },
        recordCount: { type: 'number' },
        duration: { type: 'number' },
      },
    },
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Backup failed' 
  })
  async createFullBackup(@Body() options: BackupOptions = {}): Promise<BackupResult> {
    return this.backupService.createFullBackup({
      includeMetadata: true,
      compress: true,
      format: 'json',
      batchSize: 1000,
      ...options,
    });
  }

  @Post('incremental')
  @ApiOperation({ 
    summary: 'Create incremental backup',
    description: 'Creates an incremental backup containing only changes since the specified date'
  })
  @ApiBody({
    description: 'Incremental backup options',
    required: true,
    schema: {
      type: 'object',
      properties: {
        since: { type: 'string', format: 'date-time', description: 'ISO date string for changes since' },
        includeMetadata: { type: 'boolean', default: true },
        compress: { type: 'boolean', default: true },
        format: { type: 'string', enum: ['json', 'ndjson'], default: 'json' },
        batchSize: { type: 'number', default: 1000 },
      },
      required: ['since'],
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Incremental backup created successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid date format' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Backup failed' 
  })
  async createIncrementalBackup(@Body() body: { since: string } & BackupOptions): Promise<BackupResult> {
    const since = new Date(body.since);
    
    if (isNaN(since.getTime())) {
      throw new Error('Invalid date format. Please provide a valid ISO date string.');
    }

    const options = {
      includeMetadata: true,
      compress: true,
      format: 'json' as const,
      batchSize: 1000,
      ...body,
    };

    return this.backupService.createIncrementalBackup(since, options);
  }

  @Get('list')
  @ApiOperation({ 
    summary: 'List all backups',
    description: 'Returns a list of all available backup files'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of backups retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fileName: { type: 'string' },
          filePath: { type: 'string' },
          size: { type: 'number' },
          created: { type: 'string', format: 'date-time' },
          modified: { type: 'string', format: 'date-time' },
          type: { type: 'string', enum: ['full', 'incremental'] },
        },
      },
    },
  })
  async listBackups() {
    return this.backupService.listBackups();
  }

  @Post('restore/:backupId')
  @ApiOperation({ 
    summary: 'Restore from backup',
    description: 'Restores data from a specific backup'
  })
  @ApiParam({
    name: 'backupId',
    description: 'ID of the backup to restore from',
    type: 'string',
  })
  @ApiQuery({
    name: 'container',
    description: 'Specific container to restore (optional)',
    required: false,
    type: 'string',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Restore completed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        recordsRestored: { type: 'number' },
      },
    },
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Backup not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Restore failed' 
  })
  async restoreFromBackup(
    @Param('backupId') backupId: string,
    @Query('container') containerName?: string,
  ) {
    return this.backupService.restoreFromBackup(backupId, containerName);
  }

  @Delete('cleanup')
  @ApiOperation({ 
    summary: 'Clean up old backups',
    description: 'Deletes backup files older than the specified retention period'
  })
  @ApiQuery({
    name: 'retentionDays',
    description: 'Number of days to retain backups',
    required: false,
    type: 'number',
    example: 30,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cleanup completed successfully',
    schema: {
      type: 'object',
      properties: {
        deletedCount: { type: 'number' },
        message: { type: 'string' },
      },
    },
  })
  async cleanupOldBackups(@Query('retentionDays') retentionDays?: number) {
    const deletedCount = await this.backupService.deleteOldBackups(retentionDays || 30);
    
    return {
      deletedCount,
      message: `Deleted ${deletedCount} old backup files`,
    };
  }
}