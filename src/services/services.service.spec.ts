import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { ServicesService } from './services.service';

type TestService = {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

describe('ServicesService', () => {
  let service: ServicesService;

  const prismaMock = {
    service: {
      create: jest.fn<
        (args: unknown) => Promise<TestService>
      >(),

      findMany: jest.fn<
        (args: unknown) => Promise<TestService[]>
      >(),

      findUnique: jest.fn<
        (args: unknown) =>
          Promise<TestService | { id: string } | null>
      >(),

      update: jest.fn<
        (args: unknown) => Promise<TestService>
      >(),

      delete: jest.fn<
        (args: unknown) => Promise<TestService>
      >(),
    },

    booking: {
      count: jest.fn<
        (args: unknown) => Promise<number>
      >(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ServicesService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get<ServicesService>(
      ServicesService,
    );

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a service successfully', async () => {
      prismaMock.service.create.mockResolvedValue({
        id: 'service-id',
        title: 'Consultation',
        description: 'Software consultation service',
        duration: 60,
        price: '5000.00',
        isActive: true,
      });

      const result = await service.create({
        title: ' Consultation ',
        description: ' Software consultation service ',
        duration: 60,
        price: 5000,
        isActive: true,
      });

      expect(prismaMock.service.create).toHaveBeenCalledWith({
        data: {
          title: 'Consultation',
          description: 'Software consultation service',
          duration: 60,
          price: 5000,
          isActive: true,
        },
      });

      expect(result.message).toBe(
        'Service created successfully',
      );

      expect(result.data.id).toBe('service-id');
    });

    it('uses true when isActive is not provided', async () => {
      prismaMock.service.create.mockResolvedValue({
        id: 'service-id',
        title: 'Consultation',
        description: 'Software consultation',
        duration: 60,
        price: '5000.00',
        isActive: true,
      });

      await service.create({
        title: 'Consultation',
        description: 'Software consultation',
        duration: 60,
        price: 5000,
      });

      expect(prismaMock.service.create).toHaveBeenCalledWith({
        data: {
          title: 'Consultation',
          description: 'Software consultation',
          duration: 60,
          price: 5000,
          isActive: true,
        },
      });
    });
  });

  describe('findAll', () => {
    it('returns all services ordered by newest first', async () => {
      prismaMock.service.findMany.mockResolvedValue([
        {
          id: 'service-id',
          title: 'Consultation',
          description: 'Software consultation',
          duration: 60,
          price: '5000.00',
          isActive: true,
        },
      ]);

      const result = await service.findAll();

      expect(prismaMock.service.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result.message).toBe(
        'Services retrieved successfully',
      );

      expect(result.data).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('returns a service by id', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: 'service-id',
        title: 'Consultation',
        description: 'Software consultation',
        duration: 60,
        price: '5000.00',
        isActive: true,
      });

      const result = await service.findOne('service-id');

      expect(prismaMock.service.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'service-id',
        },
      });

      expect(result.data.id).toBe('service-id');
    });

    it('throws when service does not exist', async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('missing-service-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an existing service', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: 'service-id',
      });

      prismaMock.service.update.mockResolvedValue({
        id: 'service-id',
        title: 'Updated Consultation',
        description: 'Updated description',
        duration: 90,
        price: '7500.00',
        isActive: false,
      });

      const result = await service.update('service-id', {
        title: ' Updated Consultation ',
        description: ' Updated description ',
        duration: 90,
        price: 7500,
        isActive: false,
      });

      expect(prismaMock.service.update).toHaveBeenCalledWith({
        where: {
          id: 'service-id',
        },
        data: {
          title: 'Updated Consultation',
          description: 'Updated description',
          duration: 90,
          price: 7500,
          isActive: false,
        },
      });

      expect(result.message).toBe(
        'Service updated successfully',
      );
    });

    it('throws when updating a missing service', async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing-service-id', {
          title: 'Updated Service',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(
        prismaMock.service.update,
      ).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('prevents deleting a service with bookings', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: 'service-id',
      });

      prismaMock.booking.count.mockResolvedValue(2);

      await expect(
        service.remove('service-id'),
      ).rejects.toThrow(ConflictException);

      expect(
        prismaMock.service.delete,
      ).not.toHaveBeenCalled();
    });

    it('deletes a service without bookings', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: 'service-id',
      });

      prismaMock.booking.count.mockResolvedValue(0);

      prismaMock.service.delete.mockResolvedValue({
        id: 'service-id',
        title: 'Temporary Service',
        description: 'Temporary description',
        duration: 30,
        price: '1000.00',
        isActive: true,
      });

      const result = await service.remove('service-id');

      expect(prismaMock.service.delete).toHaveBeenCalledWith({
        where: {
          id: 'service-id',
        },
      });

      expect(result.message).toBe(
        'Service deleted successfully',
      );
    });

    it('throws when deleting a missing service', async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('missing-service-id'),
      ).rejects.toThrow(NotFoundException);

      expect(
        prismaMock.booking.count,
      ).not.toHaveBeenCalled();

      expect(
        prismaMock.service.delete,
      ).not.toHaveBeenCalled();
    });
  });
});