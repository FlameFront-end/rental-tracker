import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { BookingStatus } from '../enums/booking-status.enum';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    enumName: 'BookingStatus',
  })
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
