import { ApiProperty } from '@nestjs/swagger';

import { DashboardBookingItemDto } from './dashboard-booking-item.dto';

export class DashboardMetricsDto {
  @ApiProperty({
    example: 12,
  })
  bikeCount!: number;

  @ApiProperty({
    example: 4,
  })
  activeTodayCount!: number;

  @ApiProperty({
    example: 2,
  })
  endingTodayCount!: number;

  @ApiProperty({
    example: 1,
  })
  endingTomorrowCount!: number;

  @ApiProperty({
    example: 3,
  })
  pendingCount!: number;
}

export class DashboardSummaryDto {
  @ApiProperty({
    type: DashboardMetricsDto,
  })
  metrics!: DashboardMetricsDto;

  @ApiProperty({
    type: DashboardBookingItemDto,
    isArray: true,
  })
  endingToday!: DashboardBookingItemDto[];

  @ApiProperty({
    type: DashboardBookingItemDto,
    isArray: true,
  })
  endingTomorrow!: DashboardBookingItemDto[];

  @ApiProperty({
    type: DashboardBookingItemDto,
    isArray: true,
  })
  pending!: DashboardBookingItemDto[];
}
