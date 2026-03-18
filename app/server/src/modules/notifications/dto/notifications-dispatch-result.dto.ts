import { ApiProperty } from '@nestjs/swagger';

import { NotificationReminderType } from '../enums/notification-reminder-type.enum';

export class NotificationDispatchItemDto {
  @ApiProperty({
    format: 'uuid',
  })
  bookingId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    example: 'Yamaha NMAX 2024',
  })
  bikeName!: string;

  @ApiProperty({
    example: 'John Smith',
  })
  clientName!: string;

  @ApiProperty({
    example: '2026-03-17',
  })
  endDate!: string;

  @ApiProperty({
    example: 'ready',
  })
  outcome!: 'dry-run' | 'sent' | 'skipped' | 'failed';

  @ApiProperty({
    example:
      'Rental reminder: the booking for Yamaha NMAX 2024 (John Smith) ends on 2026-03-17.',
  })
  message!: string;

  @ApiProperty({
    required: false,
    nullable: true,
  })
  error!: string | null;
}

export class NotificationsDispatchResultDto {
  @ApiProperty({
    enum: NotificationReminderType,
    enumName: 'NotificationReminderType',
  })
  reminderType!: NotificationReminderType;

  @ApiProperty({
    example: '2026-03-17',
  })
  targetDate!: string;

  @ApiProperty({
    example: true,
  })
  dryRun!: boolean;

  @ApiProperty({
    example: 3,
  })
  dueCount!: number;

  @ApiProperty({
    example: 2,
  })
  sentCount!: number;

  @ApiProperty({
    example: 1,
  })
  skippedCount!: number;

  @ApiProperty({
    example: 0,
  })
  failedCount!: number;

  @ApiProperty({
    type: NotificationDispatchItemDto,
    isArray: true,
  })
  items!: NotificationDispatchItemDto[];
}
