import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export const DEFAULT_LIST_PAGE = 1;
export const DEFAULT_LIST_LIMIT = 12;
export const MAX_LIST_LIMIT = 50;

export class PaginationQueryDto {
  @ApiPropertyOptional({
    default: DEFAULT_LIST_PAGE,
    example: DEFAULT_LIST_PAGE,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = DEFAULT_LIST_PAGE;

  @ApiPropertyOptional({
    default: DEFAULT_LIST_LIMIT,
    example: DEFAULT_LIST_LIMIT,
    minimum: 1,
    maximum: MAX_LIST_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIST_LIMIT)
  limit = DEFAULT_LIST_LIMIT;
}
