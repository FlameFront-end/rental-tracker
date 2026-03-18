import { ApiProperty } from '@nestjs/swagger';
import { Matches } from 'class-validator';

export class DashboardOccupancyQueryDto {
  @ApiProperty({
    example: '2026-03-17',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must be in YYYY-MM-DD format.',
  })
  from!: string;

  @ApiProperty({
    example: '2026-03-23',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must be in YYYY-MM-DD format.',
  })
  to!: string;
}
