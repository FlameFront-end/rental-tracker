import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  addDaysToDateOnly,
  assertDateRange,
  buildDateOnlyRange,
  getCurrentDateOnly,
  getDateOnlyDiffDays,
  normalizeDateOnly,
} from '../../common/utils/date.util';
import { AssetEntity } from '../assets/entities/asset.entity';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../bookings/enums/booking-status.enum';
import { DashboardBookingItemDto } from './dto/dashboard-booking-item.dto';
import { DashboardOccupancyQueryDto } from './dto/dashboard-occupancy-query.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

const MAX_OCCUPANCY_RANGE_DAYS = 31;

type DashboardBookingRow = {
  id: string;
  assetId: string;
  assetName: string;
  clientName: string;
  startDate: string;
  endDate: string;
  price: string | number;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(AssetEntity)
    private readonly assetsRepository: Repository<AssetEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
  ) {}

  async getSummary(userId: string): Promise<DashboardSummaryDto> {
    const today = getCurrentDateOnly();
    const tomorrow = addDaysToDateOnly(today, 1);

    const [bikeCount, endingToday, endingTomorrow, pending, activeTodayCount] =
      await Promise.all([
        this.assetsRepository.count({
          where: {
            userId,
          },
        }),
        this.findDashboardBookings(userId, {
          endDate: today,
        }),
        this.findDashboardBookings(userId, {
          endDate: tomorrow,
        }),
        this.findDashboardBookings(userId, {
          status: BookingStatus.PENDING,
        }),
        this.countActiveBookings(userId, today),
      ]);

    return {
      metrics: {
        bikeCount,
        activeTodayCount,
        endingTodayCount: endingToday.length,
        endingTomorrowCount: endingTomorrow.length,
        pendingCount: pending.length,
      },
      endingToday,
      endingTomorrow,
      pending,
    };
  }

  async getOccupancy(userId: string, query: DashboardOccupancyQueryDto) {
    const from = normalizeDateOnly(query.from, 'from');
    const to = normalizeDateOnly(query.to, 'to');

    assertDateRange(from, to);

    if (getDateOnlyDiffDays(from, to) > MAX_OCCUPANCY_RANGE_DAYS - 1) {
      throw new BadRequestException(
        `Occupancy range cannot exceed ${MAX_OCCUPANCY_RANGE_DAYS} days.`,
      );
    }

    const [bikes, bookings] = await Promise.all([
      this.assetsRepository.find({
        where: {
          userId,
        },
        order: {
          createdAt: 'DESC',
        },
      }),
      this.findDashboardBookings(userId, {
        from,
        to,
      }),
    ]);

    const bookingsByAssetId = new Map<string, DashboardBookingItemDto[]>();

    for (const booking of bookings) {
      const assetBookings = bookingsByAssetId.get(booking.assetId) ?? [];
      assetBookings.push(booking);
      bookingsByAssetId.set(booking.assetId, assetBookings);
    }

    return {
      from,
      to,
      days: buildDateOnlyRange(from, to),
      bikes: bikes.map((bike) => ({
        assetId: bike.id,
        assetName: bike.name,
        bookings: bookingsByAssetId.get(bike.id) ?? [],
      })),
    };
  }

  private async countActiveBookings(userId: string, date: string) {
    return this.bookingsRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.asset', 'asset')
      .where('asset.userId = :userId', { userId })
      .andWhere('booking.startDate <= :date', { date })
      .andWhere('booking.endDate >= :date', { date })
      .getCount();
  }

  private async findDashboardBookings(
    userId: string,
    filters: {
      endDate?: string;
      from?: string;
      status?: BookingStatus;
      to?: string;
    },
  ) {
    const qb = this.bookingsRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.asset', 'asset')
      .select('booking.id', 'id')
      .addSelect('booking.assetId', 'assetId')
      .addSelect('asset.name', 'assetName')
      .addSelect('booking.clientName', 'clientName')
      .addSelect('booking.startDate', 'startDate')
      .addSelect('booking.endDate', 'endDate')
      .addSelect('booking.price', 'price')
      .addSelect('booking.status', 'status')
      .addSelect('booking.createdAt', 'createdAt')
      .addSelect('booking.updatedAt', 'updatedAt')
      .where('asset.userId = :userId', { userId })
      .orderBy('booking.endDate', 'ASC')
      .addOrderBy('booking.startDate', 'ASC')
      .addOrderBy('booking.createdAt', 'DESC');

    if (filters.endDate) {
      qb.andWhere('booking.endDate = :endDate', {
        endDate: filters.endDate,
      });
    }

    if (filters.status) {
      qb.andWhere('booking.status = :status', {
        status: filters.status,
      });
    }

    if (filters.from && filters.to) {
      qb.andWhere('booking.startDate <= :to', {
        to: filters.to,
      }).andWhere('booking.endDate >= :from', {
        from: filters.from,
      });
    }

    const rows = await qb.getRawMany<DashboardBookingRow>();

    return rows.map((row) => this.mapDashboardBooking(row));
  }

  private mapDashboardBooking(
    row: DashboardBookingRow,
  ): DashboardBookingItemDto {
    return {
      id: row.id,
      assetId: row.assetId,
      assetName: row.assetName,
      clientName: row.clientName,
      startDate: row.startDate,
      endDate: row.endDate,
      price: Number(row.price),
      status: row.status,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
