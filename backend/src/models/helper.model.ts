// filename: backend/src/models/helper.model.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class Helper {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'John Smith' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A1234567' })
  @IsString()
  @IsNotEmpty()
  parkrunId: string;

  @ApiProperty({ example: 'john.smith@example.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+44 7700 900123' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ example: 'user123' })
  createdBy: string;

  constructor(partial: Partial<Helper> = {}) {
    Object.assign(this, partial);
    this.createdAt = this.createdAt || new Date();
    this.updatedAt = this.updatedAt || new Date();
  }
}