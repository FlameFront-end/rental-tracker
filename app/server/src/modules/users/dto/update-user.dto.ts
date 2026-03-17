import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: '123456789',
  })
  @IsOptional()
  @Matches(/^\d+$/, {
    message: 'telegramId must contain only digits.',
  })
  telegramId?: string;
}
