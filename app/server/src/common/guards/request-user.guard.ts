import {
	CanActivate,
	type ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

import { CURRENT_USER_HEADER } from '../decorators/api-current-user-header.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RequestUserGuard implements CanActivate {
	canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const headerValue = request.headers[CURRENT_USER_HEADER];
		const userId = Array.isArray(headerValue) ? headerValue[0] : headerValue;

		if (!userId || !isUUID(userId, '4')) {
			throw new UnauthorizedException(
				`${CURRENT_USER_HEADER} header must contain a valid user UUID.`,
			);
		}

		request.user = {
			userId,
		};

		return true;
	}
}
