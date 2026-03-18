import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ApiAccessTokenAuth } from '../../common/decorators/api-access-token-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { DashboardOccupancyDto } from './dto/dashboard-occupancy.dto';
import { DashboardOccupancyQueryDto } from './dto/dashboard-occupancy-query.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiAccessTokenAuth()
@UseGuards(AccessTokenGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOkResponse({
    type: DashboardSummaryDto,
  })
  getSummary(@CurrentUser() user: RequestUser) {
    return this.dashboardService.getSummary(user.userId);
  }

  @Get('occupancy')
  @ApiOkResponse({
    type: DashboardOccupancyDto,
  })
  getOccupancy(
    @CurrentUser() user: RequestUser,
    @Query() query: DashboardOccupancyQueryDto,
  ) {
    return this.dashboardService.getOccupancy(user.userId, query);
  }
}
