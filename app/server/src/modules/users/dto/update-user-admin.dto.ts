import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateUserAdminDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  isAdmin!: boolean;
}
