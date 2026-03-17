import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { AssetType } from '../enums/asset-type.enum';

export class UpdateAssetDto {
	@ApiPropertyOptional({
		example: 'Yamaha NMAX 2024',
		maxLength: 120,
	})
	@IsOptional()
	@IsString()
	@MaxLength(120)
	name?: string;

	@ApiPropertyOptional({
		enum: AssetType,
		enumName: 'AssetType',
	})
	@IsOptional()
	@IsEnum(AssetType)
	type?: AssetType;
}
