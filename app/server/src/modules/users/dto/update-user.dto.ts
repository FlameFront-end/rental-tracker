import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, Matches } from 'class-validator';

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
}
