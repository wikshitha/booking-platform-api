import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { BookingStatus } from '../../generated/prisma/client';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
    description: 'New booking status',
  })
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}