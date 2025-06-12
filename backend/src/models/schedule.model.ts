// filename: backend/src/models/schedule.model.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class VolunteerAssignment {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString()
  helperId: string;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  helperName: string;

  @ApiProperty({ example: 'A1234567' })
  @IsString()
  helperParkrunId: string;

  @ApiProperty()
  assignedAt: Date;
}

export class Schedule {
  @ApiProperty({ example: '2024-01-06' })
  @IsString()
  @IsNotEmpty()
  weekKey: string;

  @ApiProperty({ example: '2024-01-06T09:00:00.000Z' })
  @IsDateString()
  eventDate: string;

  @ApiProperty({ 
    description: 'Volunteer assignments by role',
    example: {
      'run_director': {
        helperId: '550e8400-e29b-41d4-a716-446655440000',
        helperName: 'John Smith',
        helperParkrunId: 'A1234567',
        assignedAt: '2024-01-01T10:00:00.000Z'
      }
    }
  })
  @IsObject()
  @ValidateNested()
  @Type(() => VolunteerAssignment)
  assignments: Record<string, VolunteerAssignment>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ example: 'user123' })
  createdBy: string;

  @ApiProperty({ example: 'user456' })
  @IsOptional()
  lastModifiedBy?: string;

  constructor(partial: Partial<Schedule> = {}) {
    Object.assign(this, partial);
    this.assignments = this.assignments || {};
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}