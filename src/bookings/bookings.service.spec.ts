import {
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import {
  BookingStatus,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingsService } from './bookings.service';

type TestService = {
  id: string;
  title?: string;
  isActive: boolean;
};

type TestBooking = {
  id: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceId?: string;
  bookingDate?: Date;
  bookingTime?: Date;
  status: BookingStatus;
  notes?: string | null;
};

describe('BookingsService', () => {
  let service: BookingsService;

  const prismaMock = {
    service: {
      findUnique: jest.fn<
        (args: unknown) => Promise<TestService | null>
      >(),
    },

    booking: {
      create: jest.fn<
        (args: unknown) => Promise<TestBooking>
      >(),

      findMany: jest.fn<
        (args: unknown) => Promise<TestBooking[]>
      >(),

      findUnique: jest.fn<
        (args: unknown) => Promise<TestBooking | null>
      >(),

      count: jest.fn<
        (args: unknown) => Promise<number>
      >(),

      update: jest.fn<
        (args: unknown) => Promise<TestBooking>
      >(),
    },

    $transaction: jest.fn<
      (operations: unknown[]) =>
        Promise<[TestBooking[], number]>
    >(),
  };

  beforeEach(async () => {
    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          BookingsService,
          {
            provide: PrismaService,
            useValue: prismaMock,
          },
        ],
      }).compile();

    service = module.get<BookingsService>(
      BookingsService,
    );

    jest.clearAllMocks();
  });

  const createBookingDto = {
    customerName: 'John Silva',
    customerEmail: 'john@example.com',
    customerPhone: '+94771234567',
    serviceId:
      '550e8400-e29b-41d4-a716-446655440000',
    bookingDate: '2030-07-20',
    bookingTime: '14:30',
    notes: 'Test booking',
  };

  describe('create', () => {
    it('creates a booking with PENDING status', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: createBookingDto.serviceId,
        title: 'Consultation',
        isActive: true,
      });

      prismaMock.booking.create.mockResolvedValue({
        id: 'booking-id',
        serviceId: createBookingDto.serviceId,
        status: BookingStatus.PENDING,
      });

      const result = await service.create(
        createBookingDto,
      );

      expect(
        prismaMock.service.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: createBookingDto.serviceId,
        },
        select: {
          id: true,
          title: true,
          isActive: true,
        },
      });

      expect(
        prismaMock.booking.create,
      ).toHaveBeenCalled();

      const createArguments =
        prismaMock.booking.create.mock.calls[0][0] as {
          data: {
            customerName: string;
            customerEmail: string;
            customerPhone: string;
            serviceId: string;
            bookingDate: Date;
            bookingTime: Date;
            status: BookingStatus;
            notes: string | null;
          };
        };

      expect(createArguments.data.status).toBe(
        BookingStatus.PENDING,
      );

      expect(createArguments.data.customerEmail).toBe(
        'john@example.com',
      );

      expect(result.message).toBe(
        'Booking created successfully',
      );
    });

    it('rejects a booking for a missing service', async () => {
      prismaMock.service.findUnique.mockResolvedValue(null);

      await expect(
        service.create(createBookingDto),
      ).rejects.toThrow(NotFoundException);

      expect(
        prismaMock.booking.create,
      ).not.toHaveBeenCalled();
    });

    it('rejects a booking for an inactive service', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: createBookingDto.serviceId,
        isActive: false,
      });

      await expect(
        service.create(createBookingDto),
      ).rejects.toThrow(BadRequestException);

      expect(
        prismaMock.booking.create,
      ).not.toHaveBeenCalled();
    });

    it('rejects a booking date in the past', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: createBookingDto.serviceId,
        isActive: true,
      });

      await expect(
        service.create({
          ...createBookingDto,
          bookingDate: '2020-01-01',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(
        prismaMock.booking.create,
      ).not.toHaveBeenCalled();
    });

    it('converts duplicate booking error to ConflictException', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: createBookingDto.serviceId,
        isActive: true,
      });

      const prismaError =
        new Prisma.PrismaClientKnownRequestError(
          'Unique constraint failed',
          {
            code: 'P2002',
            clientVersion: '7.8.0',
            meta: {
              target: [
                'serviceId',
                'bookingDate',
                'bookingTime',
              ],
            },
          },
        );

      prismaMock.booking.create.mockRejectedValue(
        prismaError,
      );

      await expect(
        service.create(createBookingDto),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects an invalid calendar date', async () => {
      prismaMock.service.findUnique.mockResolvedValue({
        id: createBookingDto.serviceId,
        isActive: true,
      });

      await expect(
        service.create({
          ...createBookingDto,
          bookingDate: '2030-02-30',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(
        prismaMock.booking.create,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('returns a booking by id', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.PENDING,
      });

      const result = await service.findOne('booking-id');

      expect(
        prismaMock.booking.findUnique,
      ).toHaveBeenCalledWith({
        where: {
          id: 'booking-id',
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              description: true,
              duration: true,
              price: true,
              isActive: true,
            },
          },
        },
      });

      expect(result.data.id).toBe('booking-id');
    });

    it('throws when booking does not exist', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('missing-booking-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('updates a valid booking status', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.PENDING,
      });

      prismaMock.booking.update.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.CONFIRMED,
      });

      const result = await service.updateStatus(
        'booking-id',
        {
          status: BookingStatus.CONFIRMED,
        },
      );

      expect(
        prismaMock.booking.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'booking-id',
        },
        data: {
          status: BookingStatus.CONFIRMED,
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              duration: true,
              price: true,
            },
          },
        },
      });

      expect(result.message).toBe(
        'Booking status updated successfully',
      );
    });

    it('prevents CANCELLED to COMPLETED transition', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.updateStatus('booking-id', {
          status: BookingStatus.COMPLETED,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(
        prismaMock.booking.update,
      ).not.toHaveBeenCalled();
    });

    it('prevents COMPLETED to CANCELLED transition', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.updateStatus('booking-id', {
          status: BookingStatus.CANCELLED,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(
        prismaMock.booking.update,
      ).not.toHaveBeenCalled();
    });

    it('throws when booking does not exist', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('missing-booking-id', {
          status: BookingStatus.CONFIRMED,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancels a pending booking', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.PENDING,
      });

      prismaMock.booking.update.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancel(
        'booking-id',
      );

      expect(
        prismaMock.booking.update,
      ).toHaveBeenCalledWith({
        where: {
          id: 'booking-id',
        },
        data: {
          status: BookingStatus.CANCELLED,
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              duration: true,
              price: true,
            },
          },
        },
      });

      expect(result.message).toBe(
        'Booking cancelled successfully',
      );
    });

    it('returns existing booking when already cancelled', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.CANCELLED,
      });

      const result = await service.cancel(
        'booking-id',
      );

      expect(result.message).toBe(
        'Booking is already cancelled',
      );

      expect(
        prismaMock.booking.update,
      ).not.toHaveBeenCalled();
    });

    it('prevents cancelling a completed booking', async () => {
      prismaMock.booking.findUnique.mockResolvedValue({
        id: 'booking-id',
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.cancel('booking-id'),
      ).rejects.toThrow(BadRequestException);

      expect(
        prismaMock.booking.update,
      ).not.toHaveBeenCalled();
    });

    it('throws when booking does not exist', async () => {
      prismaMock.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.cancel('missing-booking-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('returns paginated bookings', async () => {
      prismaMock.$transaction.mockResolvedValue([
        [
          {
            id: 'booking-id',
            status: BookingStatus.PENDING,
          },
        ],
        1,
      ]);

      const result = await service.findAll({
        page: 1,
        limit: 10,
      });

      expect(prismaMock.$transaction).toHaveBeenCalled();

      expect(result.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });

      expect(result.data.bookings).toHaveLength(1);
    });
  });
});