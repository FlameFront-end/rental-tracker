import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import { BookingStatus } from '../enums/booking-status.enum';

export class CreateBookingDto {
  @ApiProperty({
    format: 'uuid',
  })
  @IsUUID('4')
  assetId!: string;

  @ApiProperty({
    example: 'John Smith',
    maxLength: 120,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  clientName!: string;

  @ApiProperty({
    example: '2026-03-17',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format.',
  })
  startDate!: string;

  @ApiProperty({
    example: '2026-03-20',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format.',
  })
  endDate!: string;

  @ApiProperty({
    example: 150,
  })
  @Type(() => Number)
  @IsNumber(
    {
      maxDecimalPlaces: 2,
    },
    {
      message: 'price must be a number with up to 2 decimal places.',
    },
  )
  @Min(0)
  price!: number;

  @ApiProperty({
    enum: BookingStatus,
    enumName: 'BookingStatus',
    example: BookingStatus.PENDING,
  })
  @IsEnum(BookingStatus)
  status!: BookingStatus;
}
