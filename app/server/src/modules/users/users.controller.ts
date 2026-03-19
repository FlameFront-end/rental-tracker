import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ApiAccessTokenAuth } from '../../common/decorators/api-access-token-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UpdateUserSubscriptionDto } from './dto/update-user-subscription.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AccessTokenGuard, AdminGuard)
  @ApiAccessTokenAuth()
  @ApiCreatedResponse({
    type: UserEntity,
  })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @UseGuards(AccessTokenGuard, AdminGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: PaginatedUsersDto,
  })
  findAll(@Query() query: ListUsersQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  findMe(@CurrentUser() user: RequestUser) {
    return this.usersService.findByIdOrFail(user.userId);
  }

  @Get(':userId')
  @UseGuards(AccessTokenGuard, AdminGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  findById(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.usersService.findByIdOrFail(userId);
  }

  @Patch(':userId')
  @UseGuards(AccessTokenGuard, AdminGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  update(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Patch(':userId/admin')
  @UseGuards(AccessTokenGuard, AdminGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  updateAdminStatus(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateUserAdminDto,
  ) {
    return this.usersService.setAdminStatus(userId, dto.isAdmin);
  }

  @Patch(':userId/subscription')
  @UseGuards(AccessTokenGuard, AdminGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  updateSubscription(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateUserSubscriptionDto,
  ) {
    return this.usersService.updateSubscription(userId, dto.action);
  }
}
