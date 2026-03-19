import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { UsersService } from '../../modules/users/users.service';
import { hasAdminAccess } from '../../modules/users/utils/admin-access.util';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException(
        'Admin access requires an authenticated user.',
      );
    }

    const user = await this.usersService.findByIdOrFail(userId);

    if (!hasAdminAccess(user)) {
      throw new ForbiddenException('Admin access is denied for this user.');
    }

    return true;
  }
}
