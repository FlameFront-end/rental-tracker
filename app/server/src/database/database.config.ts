import type { DataSourceOptions } from 'typeorm';

import { InitialSchema1710878400000 } from './migrations/1710878400000-initial-schema';
import { RemoveAssetType1710964800000 } from './migrations/1710964800000-remove-asset-type';
import { AddNotificationDeliveries1711051200000 } from './migrations/1711051200000-add-notification-deliveries';
import { AssetEntity } from '../modules/assets/entities/asset.entity';
import { BookingEntity } from '../modules/bookings/entities/booking.entity';
import { NotificationDeliveryEntity } from '../modules/notifications/entities/notification-delivery.entity';
import { UserEntity } from '../modules/users/entities/user.entity';

export const databaseEntities = [
  UserEntity,
  AssetEntity,
  BookingEntity,
  NotificationDeliveryEntity,
];
export const databaseMigrations = [
  InitialSchema1710878400000,
  RemoveAssetType1710964800000,
  AddNotificationDeliveries1711051200000,
];

export function buildDataSourceOptions(): DataSourceOptions {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const isSslEnabled = (process.env.DB_SSL ?? 'false') === 'true';

  return {
    type: 'postgres',
    url: databaseUrl || undefined,
    host: databaseUrl ? undefined : (process.env.DB_HOST ?? 'localhost'),
    port: databaseUrl ? undefined : Number(process.env.DB_PORT ?? 5432),
    username: databaseUrl ? undefined : (process.env.DB_USERNAME ?? 'postgres'),
    password: databaseUrl ? undefined : (process.env.DB_PASSWORD ?? 'postgres'),
    database: databaseUrl
      ? undefined
      : (process.env.DB_NAME ?? 'rental_tracker'),
    entities: databaseEntities,
    migrations: databaseMigrations,
    migrationsTableName: 'typeorm_migrations',
    synchronize: false,
    logging: (process.env.NODE_ENV ?? 'development') === 'development',
    ssl: isSslEnabled ? { rejectUnauthorized: false } : undefined,
  };
}
