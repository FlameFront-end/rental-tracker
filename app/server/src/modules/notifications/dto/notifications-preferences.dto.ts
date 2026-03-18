import { ApiProperty } from '@nestjs/swagger';

export class NotificationsPreferencesDto {
  @ApiProperty({
    example: true,
  })
  reminderTodayEnabled!: boolean;

  @ApiProperty({
    example: true,
  })
  reminderTomorrowEnabled!: boolean;
}
