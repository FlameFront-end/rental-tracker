import type { DataSourceOptions } from 'typeorm';

import { InitialSchema1710878400000 } from './migrations/1710878400000-initial-schema';
import { AssetEntity } from '../modules/assets/entities/asset.entity';
import { BookingEntity } from '../modules/bookings/entities/booking.entity';
import { UserEntity } from '../modules/users/entities/user.entity';

export const databaseEntities = [UserEntity, AssetEntity, BookingEntity];
export const databaseMigrations = [InitialSchema1710878400000];

export function buildDataSourceOptions(): DataSourceOptions {
	return {
		type: 'postgres',
		host: process.env.DB_HOST ?? 'localhost',
		port: Number(process.env.DB_PORT ?? 5432),
		username: process.env.DB_USERNAME ?? 'postgres',
		password: process.env.DB_PASSWORD ?? 'postgres',
		database: process.env.DB_NAME ?? 'rental_tracker',
		entities: databaseEntities,
		migrations: databaseMigrations,
		migrationsTableName: 'typeorm_migrations',
		synchronize: false,
		logging: (process.env.NODE_ENV ?? 'development') === 'development',
	};
}
