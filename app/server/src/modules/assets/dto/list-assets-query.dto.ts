import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { AssetType } from '../enums/asset-type.enum';

export class ListAssetsQueryDto {
	@ApiPropertyOptional({
		enum: AssetType,
		enumName: 'AssetType',
	})
	@IsOptional()
	@IsEnum(AssetType)
	type?: AssetType;
}
