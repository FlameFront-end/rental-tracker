import { Injectable } from '@nestjs/common';

import { NotificationsStatusDto } from './dto/notifications-status.dto';

@Injectable()
export class NotificationsService {
	getStatus(): NotificationsStatusDto {
		return {
			status: 'todo',
			message: 'Telegram reminder jobs will be implemented in a later step.',
		};
	}
}
