import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { NotificationDeliveryStatus } from '../enums/notification-delivery-status.enum';
import { SubscriptionNotificationType } from '../enums/subscription-notification-type.enum';

@Entity({ name: 'subscription_notification_deliveries' })
@Index('uq_subscription_notification_deliveries_dedupe_key', ['dedupeKey'], {
  unique: true,
})
@Index('idx_subscription_notification_deliveries_status', ['status'])
@Index('idx_subscription_notification_deliveries_user_id', ['userId'])
@Index('idx_subscription_notification_deliveries_subscription_ends_at', [
  'subscriptionEndsAt',
])
export class SubscriptionNotificationDeliveryEntity {
  @ApiProperty({
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: 'user-id:trial_expired:2026-03-19T11:15:00.000Z',
  })
  @Column({
    name: 'dedupe_key',
    type: 'varchar',
    length: 255,
  })
  dedupeKey!: string;

  @ApiProperty({
    format: 'uuid',
  })
  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    example: '123456789',
  })
  @Column({
    name: 'telegram_chat_id',
    type: 'bigint',
  })
  telegramChatId!: string;

  @ApiProperty({
    enum: SubscriptionNotificationType,
    enumName: 'SubscriptionNotificationType',
  })
  @Column({
    name: 'notification_type',
    type: 'enum',
    enum: SubscriptionNotificationType,
    enumName: 'subscription_notification_type_enum',
  })
  notificationType!: SubscriptionNotificationType;

  @ApiProperty({
    example: '2026-03-19T11:15:00.000Z',
  })
  @Column({
    name: 'subscription_ends_at',
    type: 'timestamptz',
  })
  subscriptionEndsAt!: Date;

  @ApiProperty({
    enum: NotificationDeliveryStatus,
    enumName: 'NotificationDeliveryStatus',
  })
  @Column({
    type: 'enum',
    enum: NotificationDeliveryStatus,
    enumName: 'notification_delivery_status_enum',
    default: NotificationDeliveryStatus.PROCESSING,
  })
  status!: NotificationDeliveryStatus;

  @ApiProperty({
    example: 1,
  })
  @Column({
    name: 'attempt_count',
    type: 'int',
    default: 1,
  })
  attemptCount!: number;

  @ApiProperty({
    example: 'Telegram API returned 400: chat not found',
    required: false,
    nullable: true,
  })
  @Column({
    name: 'last_error',
    type: 'text',
    nullable: true,
  })
  lastError!: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  @Column({
    name: 'sent_at',
    type: 'timestamptz',
    nullable: true,
  })
  sentAt!: Date | null;

  @ApiProperty()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ApiProperty()
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt!: Date;
}
