import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new authenticated platform user',
  })
  @ApiCreatedResponse({
    description: 'User registered successfully',
  })
  @ApiConflictResponse({
    description: 'Email already exists',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login and receive a JWT access token',
  })
  @ApiOkResponse({
    description: 'Login successful',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}