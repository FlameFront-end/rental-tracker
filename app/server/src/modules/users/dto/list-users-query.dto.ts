import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export const ADMIN_USERS_ACCESS_FILTERS = [
  'active',
  'trial',
  'expired',
  'none',
] as const;

export type AdminUsersAccessFilter =
  (typeof ADMIN_USERS_ACCESS_FILTERS)[number];

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search by @username, Telegram ID, or UUID.',
    example: '@Artem_Kaliganov',
  })
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalizedValue = value.trim();

    return normalizedValue ? normalizedValue : undefined;
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    enum: ADMIN_USERS_ACCESS_FILTERS,
  })
  @IsOptional()
  @IsIn(ADMIN_USERS_ACCESS_FILTERS)
  access?: AdminUsersAccessFilter;
}
