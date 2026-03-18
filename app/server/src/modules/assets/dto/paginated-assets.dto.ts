import { ApiProperty } from '@nestjs/swagger';

import { AssetEntity } from '../entities/asset.entity';

export class PaginatedAssetsDto {
  @ApiProperty({
    type: AssetEntity,
    isArray: true,
  })
  items!: AssetEntity[];

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
}
