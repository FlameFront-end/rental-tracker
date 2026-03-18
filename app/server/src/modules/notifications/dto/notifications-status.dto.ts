import { ApiProperty } from '@nestjs/swagger';

export class NotificationsStatusDto {
  @ApiProperty({
    example: 'ready',
  })
  status!: string;

  @ApiProperty({
    example: 'Telegram reminders are configured and scheduled.',
  })
  message!: string;

  @ApiProperty({
    example: true,
  })
  botConfigured!: boolean;

  @ApiProperty({
    example: true,
  })
  schedulerEnabled!: boolean;

  @ApiProperty({
    example: 12,
  })
  sentCount!: number;

  @ApiProperty({
    example: 1,
  })
  failedCount!: number;
}
