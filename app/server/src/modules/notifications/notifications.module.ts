import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BookingEntity } from '../bookings/entities/booking.entity';
import { UsersModule } from '../users/users.module';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([BookingEntity, NotificationDeliveryEntity]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
