import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  BookingStatus,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({
      where: {
        id: createBookingDto.serviceId,
      },
      select: {
        id: true,
        title: true,
        isActive: true,
      },
    });

    if (!service) {
      throw new NotFoundException(
        `Service with ID "${createBookingDto.serviceId}" was not found`,
      );
    }

    if (!service.isActive) {
      throw new BadRequestException(
        'Bookings cannot be created for an inactive service',
      );
    }

    const bookingDate = this.parseBookingDate(
      createBookingDto.bookingDate,
    );

    const bookingTime = this.parseBookingTime(
      createBookingDto.bookingTime,
    );

    this.validateBookingDateIsNotPast(bookingDate);

    try {
      const booking = await this.prisma.booking.create({
        data: {
          customerName: createBookingDto.customerName.trim(),
          customerEmail: createBookingDto.customerEmail
            .trim()
            .toLowerCase(),
          customerPhone: createBookingDto.customerPhone.trim(),
          serviceId: createBookingDto.serviceId,
          bookingDate,
          bookingTime,
          status: BookingStatus.PENDING,
          notes: createBookingDto.notes?.trim() || null,
        },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              duration: true,
              price: true,
              isActive: true,
            },
          },
        },
      });

      return {
        message: 'Booking created successfully',
        data: booking,
      };
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This service is already booked for the selected date and time',
        );
      }

      throw error;
    }
  }

  async findAll(query: BookingQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const normalizedSearch = query.search?.trim();

    const where: Prisma.BookingWhereInput = {
      ...(query.status && {
        status: query.status,
      }),

      ...(query.serviceId && {
        serviceId: query.serviceId,
      }),

      ...(query.bookingDate && {
        bookingDate: this.parseBookingDate(query.bookingDate),
      }),

      ...(normalizedSearch && {
        OR: [
          {
            customerName: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
          {
            customerEmail: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
          {
            customerPhone: {
              contains: normalizedSearch,
            },
          },
          {
            notes: {
              contains: normalizedSearch,
              mode: 'insensitive',
            },
          },
        ],
      }),
    };

    const [bookings, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          {
            bookingDate: 'desc',
          },
          {
            bookingTime: 'desc',
          },
        ],
        include: {
          service: {
            select: {
              id: true,
              title: true,
              duration: true,
              price: true,
              isActive: true,
            },
          },
        },
      }),

      this.prisma.booking.count({
        where,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Bookings retrieved successfully',
      data: {
        bookings,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id,
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

    if (!booking) {
      throw new NotFoundException(
        `Booking with ID "${id}" was not found`,
      );
    }

    return {
      message: 'Booking retrieved successfully',
      data: booking,
    };
  }

  async updateStatus(
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    const booking = await this.getBookingOrThrow(id);
    const newStatus = updateBookingStatusDto.status;

    this.validateStatusTransition(booking.status, newStatus);

    const updatedBooking = await this.prisma.booking.update({
      where: {
        id,
      },
      data: {
        status: newStatus,
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

    return {
      message: 'Booking status updated successfully',
      data: updatedBooking,
    };
  }

  async cancel(id: string) {
    const booking = await this.getBookingOrThrow(id);

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException(
        'A completed booking cannot be cancelled',
      );
    }

    if (booking.status === BookingStatus.CANCELLED) {
      return {
        message: 'Booking is already cancelled',
        data: booking,
      };
    }

    const cancelledBooking = await this.prisma.booking.update({
      where: {
        id,
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

    return {
      message: 'Booking cancelled successfully',
      data: cancelledBooking,
    };
  }

  private async getBookingOrThrow(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id,
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Booking with ID "${id}" was not found`,
      );
    }

    return booking;
  }

  private validateStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
  ): void {
    if (
      currentStatus === BookingStatus.CANCELLED &&
      newStatus === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'A cancelled booking cannot be marked as completed',
      );
    }

    if (
      currentStatus === BookingStatus.COMPLETED &&
      newStatus === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'A completed booking cannot be cancelled',
      );
    }
  }

  private parseBookingDate(date: string): Date {
    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        'bookingDate must be a valid date',
      );
    }

    const normalizedDate = parsedDate
      .toISOString()
      .slice(0, 10);

    if (normalizedDate !== date) {
      throw new BadRequestException(
        'bookingDate must be a valid calendar date',
      );
    }

    return parsedDate;
  }

  private parseBookingTime(time: string): Date {
    const parsedTime = new Date(
      `1970-01-01T${time}:00.000Z`,
    );

    if (Number.isNaN(parsedTime.getTime())) {
      throw new BadRequestException(
        'bookingTime must be a valid time',
      );
    }

    return parsedTime;
  }

  private validateBookingDateIsNotPast(
    bookingDate: Date,
  ): void {
    const today = new Date();

    const todayUtc = new Date(
      Date.UTC(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      ),
    );

    if (bookingDate < todayUtc) {
      throw new BadRequestException(
        'Booking date cannot be in the past',
      );
    }
  }
}