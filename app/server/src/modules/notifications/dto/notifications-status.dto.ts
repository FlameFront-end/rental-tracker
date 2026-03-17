import { ApiProperty } from '@nestjs/swagger';

export class NotificationsStatusDto {
	@ApiProperty({
		example: 'todo',
	})
	status!: string;

	@ApiProperty({
		example: 'Telegram reminder jobs will be implemented in a later step.',
	})
	message!: string;
}
