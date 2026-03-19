import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, Matches } from 'class-validator';

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
    enum: UserLocale,
    enumName: 'UserLocale',
    example: UserLocale.EN,
  })
  @IsOptional()
  @IsIn(USER_LOCALE_VALUES)
  locale?: UserLocale;
}
