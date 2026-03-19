import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

import { USER_LOCALE_VALUES } from '../../users/utils/user-locale.util';
import { UserLocale } from '../../users/enums/user-locale.enum';

export class UpdateCurrentUserLocaleDto {
  @ApiProperty({
    enum: UserLocale,
    enumName: 'UserLocale',
    example: UserLocale.EN,
  })
  @IsIn(USER_LOCALE_VALUES)
  locale!: UserLocale;
}
