import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { AssetType } from '../enums/asset-type.enum';

export class CreateAssetDto {
	@ApiProperty({
		example: 'Yamaha NMAX 2024',
		maxLength: 120,
	})
	@IsString()
	@IsNotEmpty()
	@MaxLength(120)
	name!: string;

	@ApiProperty({
		enum: AssetType,
		enumName: 'AssetType',
	})
	@IsEnum(AssetType)
	type!: AssetType;
}
