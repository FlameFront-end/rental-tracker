import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
	addDaysToDateOnly,
	assertDateRange,
	normalizeDateOnly,
} from '../../common/utils/date.util';
import { AssetsService } from '../assets/assets.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ExtendBookingDto } from './dto/extend-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingEntity } from './entities/booking.entity';

@Injectable()
export class BookingsService {
	constructor(
		@InjectRepository(BookingEntity)
		private readonly bookingsRepository: Repository<BookingEntity>,
		private readonly assetsService: AssetsService,
	) {}

	async create(userId: string, dto: CreateBookingDto) {
		await this.assetsService.findOwnedAssetOrFail(userId, dto.assetId);

		const startDate = normalizeDateOnly(dto.startDate, 'startDate');
		const endDate = normalizeDateOnly(dto.endDate, 'endDate');

		assertDateRange(startDate, endDate);
		await this.ensureNoOverlap(dto.assetId, startDate, endDate);

		const booking = this.bookingsRepository.create({
			...dto,
			startDate,
			endDate,
		});

		return this.bookingsRepository.save(booking);
	}

	async findAll(userId: string, query: ListBookingsQueryDto) {
		const qb = this.bookingsRepository
			.createQueryBuilder('booking')
			.innerJoin('booking.asset', 'asset')
			.where('asset.userId = :userId', { userId })
			.orderBy('booking.startDate', 'ASC')
			.addOrderBy('booking.createdAt', 'DESC');

		if (query.assetId) {
			qb.andWhere('booking.assetId = :assetId', {
				assetId: query.assetId,
			});
		}

		if (query.status) {
			qb.andWhere('booking.status = :status', {
				status: query.status,
			});
		}

		if (query.date) {
			const date = normalizeDateOnly(query.date, 'date');

			qb.andWhere('booking.startDate <= :date', { date }).andWhere(
				'booking.endDate >= :date',
				{ date },
			);
		}

		return qb.getMany();
	}

	async findOwnedBookingOrFail(userId: string, bookingId: string) {
		const booking = await this.bookingsRepository
			.createQueryBuilder('booking')
			.innerJoin('booking.asset', 'asset')
			.where('booking.id = :bookingId', { bookingId })
			.andWhere('asset.userId = :userId', { userId })
			.getOne();

		if (!booking) {
			throw new NotFoundException(`Booking ${bookingId} was not found.`);
		}

		return booking;
	}

	async update(userId: string, bookingId: string, dto: UpdateBookingDto) {
		const booking = await this.findOwnedBookingOrFail(userId, bookingId);
		const startDate = normalizeDateOnly(
			dto.startDate ?? booking.startDate,
			'startDate',
		);
		const endDate = normalizeDateOnly(
			dto.endDate ?? booking.endDate,
			'endDate',
		);

		assertDateRange(startDate, endDate);
		await this.ensureNoOverlap(booking.assetId, startDate, endDate, booking.id);

		const nextBooking = this.bookingsRepository.merge(booking, dto, {
			startDate,
			endDate,
		});

		return this.bookingsRepository.save(nextBooking);
	}

	async remove(userId: string, bookingId: string) {
		const booking = await this.findOwnedBookingOrFail(userId, bookingId);

		await this.bookingsRepository.remove(booking);
	}

	async extend(userId: string, bookingId: string, dto: ExtendBookingDto) {
		const booking = await this.findOwnedBookingOrFail(userId, bookingId);
		const nextEndDate = addDaysToDateOnly(booking.endDate, dto.days);

		await this.ensureNoOverlap(
			booking.assetId,
			booking.startDate,
			nextEndDate,
			booking.id,
		);

		booking.endDate = nextEndDate;

		return this.bookingsRepository.save(booking);
	}

	async updateStatus(
		userId: string,
		bookingId: string,
		dto: UpdateBookingStatusDto,
	) {
		const booking = await this.findOwnedBookingOrFail(userId, bookingId);

		booking.status = dto.status;

		return this.bookingsRepository.save(booking);
	}

	private async ensureNoOverlap(
		assetId: string,
		startDate: string,
		endDate: string,
		excludeBookingId?: string,
	) {
		const qb = this.bookingsRepository
			.createQueryBuilder('booking')
			.where('booking.assetId = :assetId', { assetId })
			.andWhere('booking.startDate <= :endDate', { endDate })
			.andWhere('booking.endDate >= :startDate', { startDate });

		if (excludeBookingId) {
			qb.andWhere('booking.id != :excludeBookingId', {
				excludeBookingId,
			});
		}

		const overlappingBooking = await qb.getOne();

		if (overlappingBooking) {
			throw new ConflictException(
				'Booking dates overlap with an existing booking for this asset.',
			);
		}
	}
}
