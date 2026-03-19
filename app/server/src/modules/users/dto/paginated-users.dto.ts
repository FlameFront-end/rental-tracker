import { ApiProperty } from '@nestjs/swagger';

import { UserEntity } from '../entities/user.entity';

export class AdminUsersSummaryDto {
  @ApiProperty({
    example: 48,
  })
  totalUsers!: number;

  @ApiProperty({
    example: 6,
  })
  admins!: number;

  @ApiProperty({
    example: 18,
  })
  active!: number;

  @ApiProperty({
    example: 7,
  })
  trial!: number;

  @ApiProperty({
    example: 9,
  })
  expired!: number;

  @ApiProperty({
    example: 14,
  })
  none!: number;
}

export class PaginatedUsersDto {
  @ApiProperty({
    type: UserEntity,
    isArray: true,
  })
  items!: UserEntity[];

  @ApiProperty({
    example: 1,
  })
  page!: number;

  @ApiProperty({
    example: 12,
  })
  limit!: number;

  @ApiProperty({
    example: 24,
  })
  total!: number;

  @ApiProperty({
    example: 2,
  })
  totalPages!: number;

  @ApiProperty({
    example: true,
  })
  hasMore!: boolean;

  @ApiProperty({
    type: AdminUsersSummaryDto,
  })
  summary!: AdminUsersSummaryDto;
}
