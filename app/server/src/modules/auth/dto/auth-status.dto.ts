import { ApiProperty } from '@nestjs/swagger';

export class AuthStatusDto {
  @ApiProperty({
    example: 'ok',
  })
  status!: string;

  @ApiProperty({
    example: 'Telegram and JWT auth flow is available.',
  })
  message!: string;
}
