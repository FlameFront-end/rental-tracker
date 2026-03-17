import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TelegramAuthDto {
  @ApiProperty({
    description: 'Raw initData string received from Telegram Mini App.',
    example:
      'query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A123456789%7D&auth_date=1710000000&hash=abcdef',
  })
  @IsString()
  @IsNotEmpty()
  initData!: string;
}
