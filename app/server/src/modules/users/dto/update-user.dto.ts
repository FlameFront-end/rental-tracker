import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, Matches } from 'class-validator';

import { UserLocale } from '../enums/user-locale.enum';
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
}
