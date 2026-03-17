import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, Matches } from 'class-validator';

import { BookingStatus } from '../enums/booking-status.enum';

export class ListBookingsQueryDto {
	@ApiPropertyOptional({
		format: 'uuid',
	})
	@IsOptional()
	@IsUUID('4')
	assetId?: string;

	@ApiPropertyOptional({
		enum: BookingStatus,
		enumName: 'BookingStatus',
	})
	@IsOptional()
	@IsEnum(BookingStatus)
	status?: BookingStatus;

	@ApiPropertyOptional({
		example: '2026-03-17',
		description:
			'Returns bookings that overlap the provided date in YYYY-MM-DD format.',
	})
	@IsOptional()
	@Matches(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'date must be in YYYY-MM-DD format.',
	})
	date?: string;
}
