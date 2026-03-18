import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, Matches } from 'class-validator';

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
