import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookingEntity } from '../bookings/entities/booking.entity';
import { UsersModule } from '../users/users.module';
import { AssetEntity } from './entities/asset.entity';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AssetEntity, BookingEntity]),
    UsersModule,
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService, TypeOrmModule],
})
export class AssetsModule {}
