import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

export const CURRENT_USER_HEADER = 'x-user-id';

export function ApiCurrentUserHeader() {
	return applyDecorators(
		ApiHeader({
			name: CURRENT_USER_HEADER,
			required: true,
			description:
				'Temporary current-user header until Telegram auth is implemented.',
			schema: {
				type: 'string',
				format: 'uuid',
			},
		}),
	);
}
