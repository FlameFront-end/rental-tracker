import { Injectable } from '@nestjs/common';

import { AuthStatusDto } from './dto/auth-status.dto';

@Injectable()
export class AuthService {
	getStatus(): AuthStatusDto {
		return {
			status: 'todo',
			message:
				'JWT and Telegram Mini App auth will be implemented in the next step.',
		};
	}
}
