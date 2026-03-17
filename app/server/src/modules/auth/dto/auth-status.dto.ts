import { ApiProperty } from '@nestjs/swagger';

export class AuthStatusDto {
	@ApiProperty({
		example: 'todo',
	})
	status!: string;

	@ApiProperty({
		example:
			'JWT and Telegram Mini App auth will be implemented in the next step.',
	})
	message!: string;
}
