import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AssetEntity } from '../../assets/entities/asset.entity';
import { UserLocale } from '../enums/user-locale.enum';
import { UserSubscriptionStatus } from '../enums/user-subscription-status.enum';

@Entity({ name: 'users' })
export class UserEntity {
  @ApiProperty({
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ApiProperty({
    example: '123456789',
  })
  @Column({
    name: 'telegram_id',
    type: 'bigint',
    unique: true,
  })
  telegramId!: string;

  @ApiProperty()
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt!: Date;

  @ApiProperty({
    enum: UserLocale,
    example: UserLocale.EN,
  })
  @Column({
    type: 'enum',
    enum: UserLocale,
    enumName: 'user_locale_enum',
    default: UserLocale.EN,
  })
  locale!: UserLocale;

  @ApiProperty({
    enum: UserSubscriptionStatus,
    example: UserSubscriptionStatus.NONE,
  })
  @Column({
    name: 'subscription_status',
    type: 'enum',
    enum: UserSubscriptionStatus,
    enumName: 'user_subscription_status_enum',
    default: UserSubscriptionStatus.NONE,
  })
  subscriptionStatus!: UserSubscriptionStatus;

  @ApiPropertyOptional({
    example: '2026-03-26T11:15:00.000Z',
    format: 'date-time',
    nullable: true,
  })
  @Column({
    name: 'subscription_ends_at',
    type: 'timestamptz',
    nullable: true,
  })
  subscriptionEndsAt!: Date | null;

  @ApiProperty({
    example: true,
  })
  @Column({
    name: 'notification_reminder_today_enabled',
    type: 'boolean',
    default: true,
  })
  notificationReminderTodayEnabled!: boolean;

  @ApiProperty({
    example: true,
  })
  @Column({
    name: 'notification_reminder_tomorrow_enabled',
    type: 'boolean',
    default: true,
  })
  notificationReminderTomorrowEnabled!: boolean;

  @OneToMany(() => AssetEntity, (asset) => asset.user)
  assets!: AssetEntity[];
}
