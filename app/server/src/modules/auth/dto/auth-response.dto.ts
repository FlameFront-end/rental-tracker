import { ApiProperty } from '@nestjs/swagger';

import { UserEntity } from '../../users/entities/user.entity';

export class AuthResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwiZXhwIjoxNzAwMDAwMDAwfQ.example',
  })
  accessToken!: string;

  @ApiProperty({
    type: UserEntity,
  })
  user!: UserEntity;
}
