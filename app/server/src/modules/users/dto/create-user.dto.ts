import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

import { UserLocale } from '../enums/user-locale.enum';
import { USER_LOCALE_VALUES } from '../utils/user-locale.util';

export class CreateUserDto {
  @ApiProperty({
    example: '123456789',
    description: 'Telegram user id as a numeric string.',
  })
  @IsNotEmpty()
  @Matches(/^\d+$/, {
    message: 'telegramId must contain only digits.',
  })
  telegramId!: string;

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
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @ApiPropertyOptional({
    enum: UserLocale,
    enumName: 'UserLocale',
    example: UserLocale.EN,
  })
  @IsOptional()
  @IsIn(USER_LOCALE_VALUES)
  locale?: UserLocale;
}
