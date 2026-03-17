import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches } from 'class-validator';

export class DevLoginDto {
  @ApiProperty({
    example: '900000001',
  })
  @IsNotEmpty()
  @Matches(/^\d+$/, {
    message: 'telegramId must contain only digits.',
  })
  telegramId!: string;
}
