import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional } from 'class-validator';

import { NotificationReminderType } from '../enums/notification-reminder-type.enum';

export class DispatchNotificationsDto {
  @ApiPropertyOptional({
    enum: ['all', ...Object.values(NotificationReminderType)],
    default: 'all',
  })
  @IsOptional()
  @IsIn(['all', ...Object.values(NotificationReminderType)])
  kind: 'all' | NotificationReminderType = 'all';

  @ApiPropertyOptional({
    default: true,
  })
  @IsOptional()
  @Transform(
    ({ value }) =>
      value === true || value === 'true' || value === 1 || value === '1',
  )
  @IsBoolean()
  dryRun = true;
}
