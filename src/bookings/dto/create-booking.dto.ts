import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 'Anjitha Janidu',
    description: 'Full name of the customer',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName!: string;

  @ApiProperty({
    example: 'anjitha@example.com',
    description: 'Customer email address',
    maxLength: 255,
  })
  @IsEmail()
  @MaxLength(255)
  customerEmail!: string;

  @ApiProperty({
    example: '+94771234567',
    description: 'Customer phone number',
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @Matches(/^[0-9+\-()\s]+$/, {
    message:
      'customerPhone may contain only numbers, spaces, +, -, and parentheses',
  })
  customerPhone!: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID of the selected service',
  })
  @IsUUID('4')
  serviceId!: string;

  @ApiProperty({
    example: '2026-07-20',
    description: 'Booking date in YYYY-MM-DD format',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate must use YYYY-MM-DD format',
  })
  bookingDate!: string;

  @ApiProperty({
    example: '14:30',
    description: 'Booking time in 24-hour HH:mm format',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'bookingTime must use 24-hour HH:mm format',
  })
  bookingTime!: string;

  @ApiPropertyOptional({
    example: 'Please call before the appointment.',
    description: 'Optional customer notes',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}