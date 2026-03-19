import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';

import { UserLocale } from '../../users/enums/user-locale.enum';
import { USER_LOCALE_VALUES } from '../../users/utils/user-locale.util';

export class DevLoginDto {
  @ApiProperty({
    example: '900000001',
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
  telegramUsername?: string;

  @ApiPropertyOptional({
    enum: UserLocale,
    enumName: 'UserLocale',
    example: UserLocale.EN,
  })
  @IsOptional()
  @IsIn(USER_LOCALE_VALUES)
  locale?: UserLocale;
}
