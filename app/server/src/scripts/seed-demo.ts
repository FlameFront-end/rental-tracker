import 'dotenv/config';

import appDataSource from '../database/data-source';
import {
  addDaysToDateOnly,
  getCurrentDateOnly,
} from '../common/utils/date.util';
import { AssetEntity } from '../modules/assets/entities/asset.entity';
import { BookingEntity } from '../modules/bookings/entities/booking.entity';
import { BookingStatus } from '../modules/bookings/enums/booking-status.enum';
import { UserEntity } from '../modules/users/entities/user.entity';

const DEMO_TELEGRAM_ID = '900000001';

async function seedDemo() {
  await appDataSource.initialize();

  const userRepository = appDataSource.getRepository(UserEntity);
  const assetRepository = appDataSource.getRepository(AssetEntity);
  const bookingRepository = appDataSource.getRepository(BookingEntity);
  const today = getCurrentDateOnly();
  const tomorrow = addDaysToDateOnly(today, 1);
  const dayAfterTomorrow = addDaysToDateOnly(today, 2);
  const nextWeek = addDaysToDateOnly(today, 7);
  const nextWeekPlusTwo = addDaysToDateOnly(today, 9);

  let user = await userRepository.findOne({
    where: {
      telegramId: DEMO_TELEGRAM_ID,
    },
  });

  if (!user) {
    user = await userRepository.save(
      userRepository.create({
        telegramId: DEMO_TELEGRAM_ID,
      }),
    );
  }

  const existingAssets = await assetRepository.find({
    where: {
      userId: user.id,
    },
  });
  const existingAssetIds = existingAssets.map((asset) => asset.id);

  if (existingAssetIds.length > 0) {
    await bookingRepository
      .createQueryBuilder()
      .delete()
      .from(BookingEntity)
      .where('asset_id IN (:...assetIds)', {
        assetIds: existingAssetIds,
      })
      .execute();

    await assetRepository
      .createQueryBuilder()
      .delete()
      .from(AssetEntity)
      .where('user_id = :userId', {
        userId: user.id,
      })
      .execute();
  }

  const bikes = await assetRepository.save([
    assetRepository.create({
      userId: user.id,
      name: 'NMAX 01',
    }),
    assetRepository.create({
      userId: user.id,
      name: 'NMAX 02',
    }),
    assetRepository.create({
      userId: user.id,
      name: 'Scoopy 03',
    }),
  ]);

  const bookings = await bookingRepository.save([
    bookingRepository.create({
      assetId: bikes[0].id,
      clientName: 'Alex Carter',
      startDate: addDaysToDateOnly(today, -2),
      endDate: today,
      price: 150,
      status: BookingStatus.PENDING,
    }),
    bookingRepository.create({
      assetId: bikes[1].id,
      clientName: 'Mia Johnson',
      startDate: today,
      endDate: tomorrow,
      price: 180,
      status: BookingStatus.PAID,
    }),
    bookingRepository.create({
      assetId: bikes[2].id,
      clientName: 'Leo Park',
      startDate: dayAfterTomorrow,
      endDate: nextWeek,
      price: 210,
      status: BookingStatus.PENDING,
    }),
    bookingRepository.create({
      assetId: bikes[0].id,
      clientName: 'Sofia Chen',
      startDate: nextWeek,
      endDate: nextWeekPlusTwo,
      price: 190,
      status: BookingStatus.PAID,
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        message: 'Demo data seeded successfully.',
        telegramId: DEMO_TELEGRAM_ID,
        userId: user.id,
        bikes: bikes.map((bike) => ({
          id: bike.id,
          name: bike.name,
        })),
        bookings: bookings.map((booking) => ({
          id: booking.id,
          assetId: booking.assetId,
          clientName: booking.clientName,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status,
        })),
      },
      null,
      2,
    ),
  );
}

void seedDemo()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (appDataSource.isInitialized) {
      await appDataSource.destroy();
    }
  });
