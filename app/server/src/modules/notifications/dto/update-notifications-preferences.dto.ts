import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationsPreferencesDto {
  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  reminderTodayEnabled?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  reminderTomorrowEnabled?: boolean;
}
