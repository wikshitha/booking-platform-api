import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Wikshitha Umindu',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name !: string;

  @ApiProperty({
    example: 'wikshitha@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  @MaxLength(255)
  email !: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'Password must contain at least 8 characters',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password !: string;
}