import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Software Consultation',
    description: 'Title of the service',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @ApiProperty({
    example:
      'A one-hour consultation session for software architecture and development.',
    description: 'Detailed description of the service',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({
    example: 60,
    description: 'Service duration in minutes',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  duration!: number;

  @ApiProperty({
    example: 5000,
    description: 'Price of the service',
    minimum: 0,
  })
  @IsNumber(
    {
      maxDecimalPlaces: 2,
      allowNaN: false,
      allowInfinity: false,
    },
    {
      message: 'price must be a valid number with up to 2 decimal places',
    },
  )
  @Min(0)
  price!: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether customers can currently book the service',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}