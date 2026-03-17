import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class ExtendBookingDto {
  @ApiProperty({
    example: 2,
    description: 'How many days to extend the booking by.',
  })
  @IsInt()
  @Min(1)
  @Max(365)
  days!: number;
}
