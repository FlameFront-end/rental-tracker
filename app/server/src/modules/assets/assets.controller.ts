import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ApiAccessTokenAuth } from '../../common/decorators/api-access-token-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateAssetDto } from './dto/create-asset.dto';
import { ListAssetsQueryDto } from './dto/list-assets-query.dto';
import { PaginatedAssetsDto } from './dto/paginated-assets.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { AssetEntity } from './entities/asset.entity';
import { AssetsService } from './assets.service';

@ApiTags('assets')
@ApiAccessTokenAuth()
@UseGuards(AccessTokenGuard)
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  @ApiCreatedResponse({
    type: AssetEntity,
  })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateAssetDto) {
    return this.assetsService.create(user.userId, dto);
  }

  @Get()
  @ApiOkResponse({
    type: PaginatedAssetsDto,
  })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() query: ListAssetsQueryDto,
  ) {
    return this.assetsService.findAll(user.userId, query);
  }

  @Get('catalog')
  @ApiOkResponse({
    type: AssetEntity,
    isArray: true,
  })
  findCatalog(@CurrentUser() user: RequestUser) {
    return this.assetsService.findCatalog(user.userId);
  }

  @Get(':assetId')
  @ApiOkResponse({
    type: AssetEntity,
  })
  findById(
    @CurrentUser() user: RequestUser,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
  ) {
    return this.assetsService.findOwnedAssetOrFail(user.userId, assetId);
  }

  @Patch(':assetId')
  @ApiOkResponse({
    type: AssetEntity,
  })
  update(
    @CurrentUser() user: RequestUser,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.assetsService.update(user.userId, assetId, dto);
  }

  @Delete(':assetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('assetId', new ParseUUIDPipe({ version: '4' })) assetId: string,
  ) {
    await this.assetsService.remove(user.userId, assetId);
  }
}
