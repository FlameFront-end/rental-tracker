import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { NotificationsStatusDto } from './dto/notifications-status.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('status')
  @ApiOkResponse({
    type: NotificationsStatusDto,
  })
  getStatus() {
    return this.notificationsService.getStatus();
  }
}
