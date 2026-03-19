import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { UserLocale } from '../../users/enums/user-locale.enum';
import { USER_LOCALE_VALUES } from '../../users/utils/user-locale.util';

export class TelegramAuthDto {
  @ApiProperty({
    description: 'Raw initData string received from Telegram Mini App.',
    example:
      'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A123456789%7D&auth_date=1710000000&hash=abcdef',
  })
  @IsString()
  @IsNotEmpty()
  initData!: string;

  @ApiPropertyOptional({
    enum: UserLocale,
    enumName: 'UserLocale',
    example: UserLocale.EN,
  })
  @IsOptional()
  @IsIn(USER_LOCALE_VALUES)
  locale?: UserLocale;
}
