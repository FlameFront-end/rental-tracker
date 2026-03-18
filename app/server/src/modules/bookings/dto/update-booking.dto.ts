import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

import { BookingStatus } from '../enums/booking-status.enum';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4')
  assetId?: string;

  @ApiPropertyOptional({
    example: 'John Smith',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clientName?: string;

  @ApiPropertyOptional({
    example: '2026-03-17',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format.',
  })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-03-20',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format.',
  })
  endDate?: string;

  @ApiPropertyOptional({
    example: 150,
  })
  @IsOptional()
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
  price?: number;

  @ApiPropertyOptional({
    enum: BookingStatus,
    enumName: 'BookingStatus',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
