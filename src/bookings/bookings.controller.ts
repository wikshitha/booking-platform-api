import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookingStatus } from '../generated/prisma/client';
import { BookingsService } from './bookings.service';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a customer booking',
    description:
      'Customers can create a booking without authentication.',
  })
  @ApiCreatedResponse({
    description: 'Booking created successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid booking data, past date, or inactive service',
  })
  @ApiNotFoundResponse({
    description: 'Selected service was not found',
  })
  @ApiConflictResponse({
    description:
      'The selected service, date, and time are already booked',
  })
  create(
    @Body()
    createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all bookings',
    description:
      'Returns paginated bookings with optional search and filtering.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'john',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
  })
  @ApiQuery({
    name: 'bookingDate',
    required: false,
    example: '2026-07-20',
  })
  @ApiQuery({
    name: 'serviceId',
    required: false,
  })
  @ApiOkResponse({
    description: 'Bookings retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameter',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid JWT access token is required',
  })
  findAll(
    @Query()
    query: BookingQueryDto,
  ) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get a booking by ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Booking retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking UUID',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid JWT access token is required',
  })
  @ApiNotFoundResponse({
    description: 'Booking was not found',
  })
  findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update booking status',
    description:
      'Updates a booking to PENDING, CONFIRMED, CANCELLED, or COMPLETED.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
  })
  @ApiOkResponse({
    description: 'Booking status updated successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid UUID, status, or forbidden status transition',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid JWT access token is required',
  })
  @ApiNotFoundResponse({
    description: 'Booking was not found',
  })
  updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,

    @Body()
    updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(
      id,
      updateBookingStatusDto,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'Changes the booking status to CANCELLED. Completed bookings cannot be cancelled.',
  })
  @ApiParam({
    name: 'id',
    description: 'Booking UUID',
  })
  @ApiOkResponse({
    description: 'Booking cancelled successfully',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid UUID or completed booking cannot be cancelled',
  })
  @ApiUnauthorizedResponse({
    description: 'A valid JWT access token is required',
  })
  @ApiNotFoundResponse({
    description: 'Booking was not found',
  })
  cancel(
    @Param('id', new ParseUUIDPipe({ version: '4' }))
    id: string,
  ) {
    return this.bookingsService.cancel(id);
  }
}