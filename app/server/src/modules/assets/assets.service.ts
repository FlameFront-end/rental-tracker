import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { isPostgresError } from '../../common/utils/database-error.util';
import { getCurrentDateOnly } from '../../common/utils/date.util';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { UsersService } from '../users/users.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetEntity } from './entities/asset.entity';

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

  findAll(userId: string) {
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

  async remove(userId: string, assetId: string) {
    const asset = await this.findOwnedAssetOrFail(userId, assetId);
    const today = getCurrentDateOnly();
    const activeOrFutureBookings = await this.bookingsRepository.count({
      where: {
        assetId: asset.id,
        endDate: MoreThanOrEqual(today),
      },
    });

    if (activeOrFutureBookings > 0) {
      throw new ConflictException(
        'Asset cannot be removed because it has active or future bookings.',
      );
    }

    try {
      await this.assetsRepository.remove(asset);
    } catch (error) {
      if (isPostgresError(error, '23503', 'fk_bookings_asset_id')) {
        throw new ConflictException(
          'Asset cannot be removed because booking history still exists.',
        );
      }

      throw error;
    }
  }
}
