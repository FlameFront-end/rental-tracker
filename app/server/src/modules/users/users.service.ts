import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { isPostgresError } from '../../common/utils/database-error.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserLocale } from './enums/user-locale.enum';
import { UserSubscriptionStatus } from './enums/user-subscription-status.enum';

const TRIAL_DURATION_DAYS = 7;
const MS_IN_DAY = 1000 * 60 * 60 * 24;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateUserDto) {
    try {
      const user = this.usersRepository.create(dto);

      return await this.usersRepository.save(user);
    } catch (error) {
      if (isPostgresError(error, '23505', 'uq_users_telegram_id')) {
        throw new ConflictException(
          'User with this telegramId already exists.',
        );
      }

      throw error;
    }
  }

  findAll() {
    return this.usersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findByIdOrFail(userId: string) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(`User ${userId} was not found.`);
    }

    return user;
  }

  findByTelegramId(telegramId: string) {
    return this.usersRepository.findOne({
      where: {
        telegramId,
      },
    });
  }

  async findOrCreateByTelegramId(telegramId: string, locale?: UserLocale) {
    const existingUser = await this.findByTelegramId(telegramId);

    if (existingUser) {
      if (locale && existingUser.locale !== locale) {
        return this.update(existingUser.id, {
          locale,
        });
      }

      return existingUser;
    }

    try {
      return await this.create({
        ...(locale
          ? {
              locale,
            }
          : {}),
        telegramId,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        const user = await this.findByTelegramId(telegramId);

        if (user) {
          return user;
        }
      }

      throw error;
    }
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.findByIdOrFail(userId);

    try {
      const nextUser = this.usersRepository.merge(user, dto);

      return await this.usersRepository.save(nextUser);
    } catch (error) {
      if (isPostgresError(error, '23505', 'uq_users_telegram_id')) {
        throw new ConflictException(
          'User with this telegramId already exists.',
        );
      }

      throw error;
    }
  }

  async activateTrial(userId: string) {
    const user = await this.findByIdOrFail(userId);

    if (user.subscriptionStatus !== UserSubscriptionStatus.NONE) {
      throw new ConflictException(
        'Free trial has already been activated for this user.',
      );
    }

    const subscriptionEndsAt = new Date(
      Date.now() + TRIAL_DURATION_DAYS * MS_IN_DAY,
    );
    const nextUser = this.usersRepository.merge(user, {
      subscriptionEndsAt,
      subscriptionStatus: UserSubscriptionStatus.TRIAL,
    });

    return this.usersRepository.save(nextUser);
  }

  updateLocale(userId: string, locale: UserLocale) {
    return this.update(userId, {
      locale,
    });
  }
}
