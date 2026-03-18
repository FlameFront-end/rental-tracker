import { ApiProperty } from '@nestjs/swagger';

import { DashboardBookingItemDto } from './dashboard-booking-item.dto';

export class DashboardOccupancyBikeDto {
  @ApiProperty({
    format: 'uuid',
  })
  assetId!: string;

  @ApiProperty({
    example: 'Yamaha NMAX 2024',
  })
  assetName!: string;

  @ApiProperty({
    type: DashboardBookingItemDto,
    isArray: true,
  })
  bookings!: DashboardBookingItemDto[];
}

export class DashboardOccupancyDto {
  @ApiProperty({
    example: '2026-03-17',
  })
  from!: string;

  @ApiProperty({
    example: '2026-03-23',
  })
  to!: string;

  @ApiProperty({
    example: ['2026-03-17', '2026-03-18'],
    isArray: true,
  })
  days!: string[];

  @ApiProperty({
    type: DashboardOccupancyBikeDto,
    isArray: true,
  })
  bikes!: DashboardOccupancyBikeDto[];
}
