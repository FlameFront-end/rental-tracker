import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { isPostgresError } from '../../common/utils/database-error.util';
import { getCurrentDateOnly } from '../../common/utils/date.util';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { UsersService } from '../users/users.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ListAssetsQueryDto } from './dto/list-assets-query.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetEntity } from './entities/asset.entity';

interface RemoveAssetOptions {
  removeRelatedBookings?: boolean;
}

interface AssetBookingStats {
  activeOrFutureBookings: number;
  historyBookings: number;
  totalBookings: number;
}

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(AssetEntity)
    private readonly assetsRepository: Repository<AssetEntity>,
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, dto: CreateAssetDto) {
    await this.usersService.findByIdOrFail(userId);

    const asset = this.assetsRepository.create({
      name: dto.name,
      userId,
    });

    return this.assetsRepository.save(asset);
  }

  async findAll(userId: string, query: ListAssetsQueryDto) {
    const [items, total] = await this.assetsRepository.findAndCount({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return createPaginatedResponse(items, query.page, query.limit, total);
  }

  findCatalog(userId: string) {
    return this.assetsRepository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOwnedAssetOrFail(userId: string, assetId: string) {
    const asset = await this.assetsRepository.findOne({
      where: {
        id: assetId,
        userId,
      },
    });

    if (!asset) {
      throw new NotFoundException(`Asset ${assetId} was not found.`);
    }

    return asset;
  }

  async update(userId: string, assetId: string, dto: UpdateAssetDto) {
    const asset = await this.findOwnedAssetOrFail(userId, assetId);
    const nextAsset = this.assetsRepository.merge(asset, dto);

    return this.assetsRepository.save(nextAsset);
  }

  async remove(
    userId: string,
    assetId: string,
    options: RemoveAssetOptions = {},
  ) {
    const asset = await this.findOwnedAssetOrFail(userId, assetId);
    const bookingStats = await this.getAssetBookingStats(asset.id);

    if (bookingStats.totalBookings > 0 && !options.removeRelatedBookings) {
      throw this.buildRemoveConflict(bookingStats);
    }

    try {
      if (options.removeRelatedBookings) {
        await this.assetsRepository.manager.transaction(async (manager) => {
          await manager.delete(BookingEntity, {
            assetId: asset.id,
          });
          await manager.delete(AssetEntity, {
            id: asset.id,
          });
        });

        return;
      }

      await this.assetsRepository.remove(asset);
    } catch (error) {
      if (isPostgresError(error, '23503', 'fk_bookings_asset_id')) {
        throw this.buildRemoveConflict(
          await this.getAssetBookingStats(asset.id),
        );
      }

      throw error;
    }
  }

  private async getAssetBookingStats(
    assetId: string,
  ): Promise<AssetBookingStats> {
    const today = getCurrentDateOnly();
    const [totalBookings, activeOrFutureBookings] = await Promise.all([
      this.bookingsRepository.count({
        where: {
          assetId,
        },
      }),
      this.bookingsRepository.count({
        where: {
          assetId,
          endDate: MoreThanOrEqual(today),
        },
      }),
    ]);

    return {
      totalBookings,
      activeOrFutureBookings,
      historyBookings: Math.max(totalBookings - activeOrFutureBookings, 0),
    };
  }

  private buildRemoveConflict(stats: AssetBookingStats) {
    return new ConflictException({
      code: 'ASSET_HAS_BOOKINGS',
      details: stats,
      message:
        stats.activeOrFutureBookings > 0
          ? 'Asset cannot be removed because it has active or future bookings.'
          : 'Asset cannot be removed because booking history still exists.',
    });
  }
}
