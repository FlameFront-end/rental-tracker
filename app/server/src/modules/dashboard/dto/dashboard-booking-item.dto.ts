import { ApiProperty } from '@nestjs/swagger';

import { BookingStatus } from '../../bookings/enums/booking-status.enum';

export class DashboardBookingItemDto {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
  })
  assetId!: string;

  @ApiProperty({
    example: 'Yamaha NMAX 2024',
  })
  assetName!: string;

  @ApiProperty({
    example: 'John Smith',
  })
  clientName!: string;

  @ApiProperty({
    example: '2026-03-17',
  })
  startDate!: string;

  @ApiProperty({
    example: '2026-03-20',
  })
  endDate!: string;

  @ApiProperty({
    example: 150,
  })
  price!: number;

  @ApiProperty({
    enum: BookingStatus,
    enumName: 'BookingStatus',
  })
  status!: BookingStatus;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
