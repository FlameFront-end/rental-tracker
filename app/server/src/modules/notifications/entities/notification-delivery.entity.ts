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
import { NotificationReminderType } from '../enums/notification-reminder-type.enum';

@Entity({ name: 'notification_deliveries' })
@Index('uq_notification_deliveries_dedupe_key', ['dedupeKey'], {
  unique: true,
})
@Index('idx_notification_deliveries_booking_id', ['bookingId'])
@Index('idx_notification_deliveries_status', ['status'])
export class NotificationDeliveryEntity {
  @ApiProperty({
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: 'booking-id:today:2026-03-17',
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
    format: 'uuid',
  })
  @Column({
    name: 'booking_id',
    type: 'uuid',
  })
  bookingId!: string;

  @ApiProperty({
    example: '123456789',
  })
  @Column({
    name: 'telegram_chat_id',
    type: 'bigint',
  })
  telegramChatId!: string;

  @ApiProperty({
    enum: NotificationReminderType,
    enumName: 'NotificationReminderType',
  })
  @Column({
    name: 'reminder_type',
    type: 'enum',
    enum: NotificationReminderType,
  })
  reminderType!: NotificationReminderType;

  @ApiProperty({
    example: '2026-03-17',
  })
  @Column({
    name: 'target_date',
    type: 'date',
  })
  targetDate!: string;

  @ApiProperty({
    enum: NotificationDeliveryStatus,
    enumName: 'NotificationDeliveryStatus',
  })
  @Column({
    type: 'enum',
    enum: NotificationDeliveryStatus,
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
