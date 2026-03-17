import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { ApiAccessTokenAuth } from '../../common/decorators/api-access-token-auth.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../../common/guards/access-token.guard';
import type { RequestUser } from '../../common/interfaces/request-user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiCreatedResponse({
    type: UserEntity,
  })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: UserEntity,
    isArray: true,
  })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiAccessTokenAuth()
  @ApiOkResponse({
    type: UserEntity,
  })
  findMe(@CurrentUser() user: RequestUser) {
    return this.usersService.findByIdOrFail(user.userId);
  }

  @Get(':userId')
  @ApiOkResponse({
    type: UserEntity,
  })
  findById(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.usersService.findByIdOrFail(userId);
  }

  @Patch(':userId')
  @ApiOkResponse({
    type: UserEntity,
  })
  update(
    @Param('userId', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }
}
