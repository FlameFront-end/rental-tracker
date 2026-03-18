import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ApiAccessTokenAuth } from '../../common/decorators/api-access-token-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { DispatchNotificationsDto } from './dto/dispatch-notifications.dto';
import { NotificationsDispatchResultDto } from './dto/notifications-dispatch-result.dto';
import { NotificationsStatusDto } from './dto/notifications-status.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiAccessTokenAuth()
@UseGuards(AccessTokenGuard)
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

  @Post('run')
  @ApiOkResponse({
    type: NotificationsDispatchResultDto,
    isArray: true,
  })
  run(@CurrentUser() user: RequestUser, @Body() dto: DispatchNotificationsDto) {
    return this.notificationsService.runManualDispatch(user.userId, dto);
  }
}
