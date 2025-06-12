// filename: backend/src/helpers/dto/create-helper.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';

export class CreateHelperDto {
  @ApiProperty({ example: 'John Smith', description: 'Full name of the helper' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A1234567', description: 'Parkrun ID of the helper' })
  @IsString()
  @IsNotEmpty()
  parkrunId: string;

  @ApiProperty({ 
    example: 'john.smith@example.com', 
    description: 'Email address (optional)',
    required: false 
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ 
    example: '+44 7700 900123', 
    description: 'Phone number (optional)',
    required: false 
  })
  @IsOptional()
  @IsString()
  phone?: string;
}