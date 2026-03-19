import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

import { UserLocale } from '../enums/user-locale.enum';
import { UserSubscriptionStatus } from '../enums/user-subscription-status.enum';
import { USER_LOCALE_VALUES } from '../utils/user-locale.util';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: '123456789',
  })
  @IsOptional()
  @Matches(/^\d+$/, {
    message: 'telegramId must contain only digits.',
  })
  telegramId?: string;

  @ApiPropertyOptional({
    example: 'Artem_Kaliganov',
    nullable: true,
  })
  @IsOptional()
  @Matches(/^@?[A-Za-z0-9_]{5,32}$/, {
    message: 'telegramUsername must contain only Telegram username characters.',
  })
  @MaxLength(64)
  telegramUsername?: string | null;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notificationReminderTodayEnabled?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  notificationReminderTomorrowEnabled?: boolean;

  @ApiPropertyOptional({
    enum: UserLocale,
    enumName: 'UserLocale',
    example: UserLocale.EN,
  })
  @IsOptional()
  @IsIn(USER_LOCALE_VALUES)
  locale?: UserLocale;

  @ApiPropertyOptional({
    enum: UserSubscriptionStatus,
    enumName: 'UserSubscriptionStatus',
    example: UserSubscriptionStatus.ACTIVE,
  })
  @IsOptional()
  @IsIn(Object.values(UserSubscriptionStatus))
  subscriptionStatus?: UserSubscriptionStatus;

  @ApiPropertyOptional({
    example: '2026-04-19T12:00:00.000Z',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  subscriptionEndsAt?: string | null;

  @ApiPropertyOptional({
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
