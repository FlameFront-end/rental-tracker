import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AssetsModule } from '../assets/assets.module';
import { BookingEntity } from './entities/booking.entity';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
	imports: [TypeOrmModule.forFeature([BookingEntity]), AssetsModule],
	controllers: [BookingsController],
	providers: [BookingsService],
	exports: [BookingsService, TypeOrmModule],
})
export class BookingsModule {}
