import {
  CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { AccessTokenPayload } from '../interfaces/access-token-payload.interface';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header must contain a bearer token.',
      );
    }

    const accessToken = authorizationHeader.slice('Bearer '.length).trim();

    if (!accessToken) {
      throw new UnauthorizedException('Bearer token is missing.');
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<AccessTokenPayload>(accessToken);

      request.user = {
        userId: payload.sub,
        telegramId: payload.telegramId,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired.');
    }
  }
}
