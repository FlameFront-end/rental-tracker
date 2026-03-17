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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ExtendBookingDto } from './dto/extend-booking.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingEntity } from './entities/booking.entity';

@ApiTags('bookings')
@ApiAccessTokenAuth()
@UseGuards(AccessTokenGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiCreatedResponse({
    type: BookingEntity,
  })
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.userId, dto);
  }

  @Get()
  @ApiOkResponse({
    type: BookingEntity,
    isArray: true,
  })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() query: ListBookingsQueryDto,
  ) {
    return this.bookingsService.findAll(user.userId, query);
  }

  @Get(':bookingId')
  @ApiOkResponse({
    type: BookingEntity,
  })
  findById(
    @CurrentUser() user: RequestUser,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' }))
    bookingId: string,
  ) {
    return this.bookingsService.findOwnedBookingOrFail(user.userId, bookingId);
  }

  @Patch(':bookingId')
  @ApiOkResponse({
    type: BookingEntity,
  })
  update(
    @CurrentUser() user: RequestUser,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' }))
    bookingId: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(user.userId, bookingId, dto);
  }

  @Post(':bookingId/extend')
  @ApiOkResponse({
    type: BookingEntity,
  })
  extend(
    @CurrentUser() user: RequestUser,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' }))
    bookingId: string,
    @Body() dto: ExtendBookingDto,
  ) {
    return this.bookingsService.extend(user.userId, bookingId, dto);
  }

  @Patch(':bookingId/status')
  @ApiOkResponse({
    type: BookingEntity,
  })
  updateStatus(
    @CurrentUser() user: RequestUser,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' }))
    bookingId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(user.userId, bookingId, dto);
  }

  @Delete(':bookingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: RequestUser,
    @Param('bookingId', new ParseUUIDPipe({ version: '4' }))
    bookingId: string,
  ) {
    await this.bookingsService.remove(user.userId, bookingId);
  }
}
