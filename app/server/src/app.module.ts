import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { buildDataSourceOptions } from './database/database.config';
import { HealthModule } from './health/health.module';
import { AssetsModule } from './modules/assets/assets.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRoot(buildDataSourceOptions()),
    AuthModule,
    UsersModule,
    AssetsModule,
    BookingsModule,
    NotificationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
