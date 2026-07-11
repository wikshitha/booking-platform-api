import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

type TestUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt?: Date;
};

describe('AuthService', () => {
  let service: AuthService;

  const usersServiceMock = {
    findByEmail: jest.fn<
      (email: string) => Promise<TestUser | null>
    >(),

    create: jest.fn<
      (data: {
        name: string;
        email: string;
        password: string;
      }) => Promise<TestUser>
    >(),
  };

  const jwtServiceMock = {
    signAsync: jest.fn<
      (payload: { sub: string; email: string }) => Promise<string>
    >(),
  };

  const bcryptHashMock = bcrypt.hash as unknown as jest.MockedFunction<
    (
      data: string,
      saltOrRounds: string | number,
    ) => Promise<string>
  >;

  const bcryptCompareMock =
    bcrypt.compare as unknown as jest.MockedFunction<
      (data: string, encrypted: string) => Promise<boolean>
    >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersServiceMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('registers a user with a hashed password', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      bcryptHashMock.mockResolvedValue('hashed-password');

      usersServiceMock.create.mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date('2026-07-11T10:00:00.000Z'),
      });

      jwtServiceMock.signAsync.mockResolvedValue('access-token');

      const result = await service.register({
        name: ' Test User ',
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
      });

      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );

      expect(bcryptHashMock).toHaveBeenCalledWith(
        'Password123!',
        12,
      );

      expect(usersServiceMock.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      });

      expect(jwtServiceMock.signAsync).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'test@example.com',
      });

      expect(result.message).toBe(
        'User registered successfully',
      );

      expect(result.data.accessToken).toBe('access-token');
      expect(result.data.user).not.toHaveProperty('password');
    });

    it('rejects a duplicate email', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'existing-user',
        name: 'Existing User',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      });

      await expect(
        service.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);

      expect(usersServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns a token for valid credentials', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      });

      bcryptCompareMock.mockResolvedValue(true);
      jwtServiceMock.signAsync.mockResolvedValue('access-token');

      const result = await service.login({
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
      });

      expect(usersServiceMock.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );

      expect(bcryptCompareMock).toHaveBeenCalledWith(
        'Password123!',
        'hashed-password',
      );

      expect(result.message).toBe('Login successful');
      expect(result.data.accessToken).toBe('access-token');
      expect(result.data.user).not.toHaveProperty('password');
    });

    it('rejects an unknown user', async () => {
      usersServiceMock.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'missing@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(bcryptCompareMock).not.toHaveBeenCalled();
      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });

    it('rejects an incorrect password', async () => {
      usersServiceMock.findByEmail.mockResolvedValue({
        id: 'user-id',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
        createdAt: new Date(),
      });

      bcryptCompareMock.mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
    });
  });
});