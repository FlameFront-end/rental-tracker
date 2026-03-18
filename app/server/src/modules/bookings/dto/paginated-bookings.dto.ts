import { ApiProperty } from '@nestjs/swagger';

import { BookingEntity } from '../entities/booking.entity';

export class PaginatedBookingsDto {
  @ApiProperty({
    type: BookingEntity,
    isArray: true,
  })
  items!: BookingEntity[];

  @ApiProperty({
    example: 1,
  })
  page!: number;

  @ApiProperty({
    example: 12,
  })
  limit!: number;

  @ApiProperty({
    example: 48,
  })
  total!: number;

  @ApiProperty({
    example: 4,
  })
  totalPages!: number;

  @ApiProperty({
    example: true,
  })
  hasMore!: boolean;
}
