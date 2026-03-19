import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ApiAccessTokenAuth } from '../../common/decorators/api-access-token-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { UserEntity } from '../users/entities/user.entity';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthStatusDto } from './dto/auth-status.dto';
import { DevLoginDto } from './dto/dev-login.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { UpdateCurrentUserLocaleDto } from './dto/update-current-user-locale.dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  @ApiOkResponse({
    type: AuthStatusDto,
  })
  getStatus() {
    return this.authService.getStatus();
  }

  @Post('telegram')
  @ApiCreatedResponse({
    type: AuthResponseDto,
  })
  loginWithTelegram(@Body() dto: TelegramAuthDto) {
    return this.authService.loginWithTelegram(dto);
  }

  @Post('dev-login')
  @ApiCreatedResponse({
    type: AuthResponseDto,
  })
  loginForDevelopment(@Body() dto: DevLoginDto) {
    return this.authService.loginForDevelopment(dto);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  getMe(@CurrentUser() user: RequestUser) {
    return this.authService.getMe(user.userId);
  }

  @Post('trial')
  @UseGuards(AccessTokenGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  activateTrial(@CurrentUser() user: RequestUser) {
    return this.authService.activateTrial(user.userId);
  }

  @Patch('me/locale')
  @UseGuards(AccessTokenGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  updateCurrentUserLocale(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateCurrentUserLocaleDto,
  ) {
    return this.authService.updateCurrentUserLocale(user.userId, dto);
  }
}
