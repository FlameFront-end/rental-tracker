import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import type { AccessTokenPayload } from '../../common/interfaces/access-token-payload.interface';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthStatusDto } from './dto/auth-status.dto';
import { DevLoginDto } from './dto/dev-login.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { validateTelegramInitData } from './utils/telegram-init-data.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  getStatus(): AuthStatusDto {
    return {
      status: 'ok',
      message: 'Telegram and JWT auth flow is available.',
    };
  }

  async loginWithTelegram(dto: TelegramAuthDto): Promise<AuthResponseDto> {
    const validatedInitData = validateTelegramInitData({
      botToken: this.configService.get<string>('TELEGRAM_BOT_TOKEN', ''),
      initData: dto.initData,
      maxAgeSeconds: this.configService.get<number>(
        'TELEGRAM_INIT_DATA_TTL_SECONDS',
        86400,
      ),
    });

    const user = await this.usersService.findOrCreateByTelegramId(
      validatedInitData.telegramId,
    );

    return this.buildAuthResponse(user.id, user.telegramId);
  }

  async loginForDevelopment(dto: DevLoginDto): Promise<AuthResponseDto> {
    if (
      this.configService.get<string>('NODE_ENV', 'development') === 'production'
    ) {
      throw new ForbiddenException(
        'Development login is disabled in production.',
      );
    }

    const user = await this.usersService.findOrCreateByTelegramId(
      dto.telegramId,
    );

    return this.buildAuthResponse(user.id, user.telegramId);
  }

  getMe(userId: string) {
    return this.usersService.findByIdOrFail(userId);
  }

  private async buildAuthResponse(
    userId: string,
    telegramId: string,
  ): Promise<AuthResponseDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: userId,
      telegramId,
    } satisfies AccessTokenPayload);
    const user = await this.usersService.findByIdOrFail(userId);

    return {
      accessToken,
      user,
    };
  }
}
