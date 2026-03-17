import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class CreateUserDto {
	@ApiProperty({
		example: '123456789',
		description: 'Telegram user id as a numeric string.',
	})
	@IsNotEmpty()
	@Matches(/^\d+$/, {
		message: 'telegramId must contain only digits.',
	})
	telegramId!: string;
}
