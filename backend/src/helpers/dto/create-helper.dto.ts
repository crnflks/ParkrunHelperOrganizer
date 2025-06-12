// filename: backend/src/helpers/dto/create-helper.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { 
  IsParkrunId, 
  IsValidPhoneNumber, 
  IsAlphanumericWithSpaces 
} from '../../common/validation/custom-validators';
import { 
  SanitizeString, 
  NormalizeEmail, 
  NormalizePhone, 
  CapitalizeWords, 
  TrimWhitespace 
} from '../../common/sanitization/sanitization.pipe';

export class CreateHelperDto {
  @ApiProperty({ example: 'John Smith', description: 'Full name of the helper' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @IsAlphanumericWithSpaces()
  @TrimWhitespace()
  @CapitalizeWords()
  @SanitizeString()
  name: string;

  @ApiProperty({ example: 'A1234567', description: 'Parkrun ID of the helper' })
  @IsString()
  @IsNotEmpty()
  @IsParkrunId()
  @Transform(({ value }) => typeof value === 'string' ? value.toUpperCase().trim() : value)
  @SanitizeString()
  parkrunId: string;

  @ApiProperty({ 
    example: 'john.smith@example.com', 
    description: 'Email address (optional)',
    required: false 
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(254)
  @NormalizeEmail()
  @SanitizeString()
  email?: string;

  @ApiProperty({ 
    example: '+44 7700 900123', 
    description: 'Phone number (optional)',
    required: false 
  })
  @IsOptional()
  @IsValidPhoneNumber()
  @MaxLength(20)
  @NormalizePhone()
  @SanitizeString()
  phone?: string;
}