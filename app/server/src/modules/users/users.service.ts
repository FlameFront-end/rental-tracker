import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { isPostgresError } from '../../common/utils/database-error.util';
import { CreateUserDto } from './dto/create-user.dto';
import { type UserSubscriptionAdminAction } from './dto/update-user-subscription.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserEntity } from './entities/user.entity';
import { UserLocale } from './enums/user-locale.enum';
import { UserSubscriptionStatus } from './enums/user-subscription-status.enum';
import {
  hasAdminAccess,
  isBootstrapAdminUsername,
  normalizeTelegramUsername,
} from './utils/admin-access.util';

const TRIAL_DURATION_DAYS = 7;
const MONTHLY_SUBSCRIPTION_DURATION_DAYS = 30;
const MS_IN_DAY = 1000 * 60 * 60 * 24;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(dto: CreateUserDto) {
    try {
      const normalizedTelegramUsername = normalizeTelegramUsername(
        dto.telegramUsername,
      );
      const user = this.usersRepository.create({
        ...dto,
        ...(normalizedTelegramUsername
          ? {
              telegramUsername: normalizedTelegramUsername,
            }
          : {}),
        isAdmin:
          dto.isAdmin || isBootstrapAdminUsername(normalizedTelegramUsername),
      });

      return this.resolveAdminAccess(await this.usersRepository.save(user));
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
    return this.usersRepository
      .find({
        order: {
          createdAt: 'DESC',
        },
      })
      .then((users) => users.map((user) => this.resolveAdminAccess(user)));
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

    return this.resolveAdminAccess(user);
  }

  findByTelegramId(telegramId: string) {
    return this.usersRepository.findOne({
      where: {
        telegramId,
      },
    });
  }

  async findOrCreateByTelegramId(
    telegramId: string,
    locale?: UserLocale,
    telegramUsername?: string | null,
  ) {
    const existingUser = await this.findByTelegramId(telegramId);
    const normalizedTelegramUsername =
      telegramUsername === undefined
        ? undefined
        : normalizeTelegramUsername(telegramUsername);

    if (existingUser) {
      const shouldUpdateLocale = Boolean(
        locale && existingUser.locale !== locale,
      );
      const shouldUpdateUsername =
        normalizedTelegramUsername !== undefined &&
        existingUser.telegramUsername !== normalizedTelegramUsername;
      const shouldGrantBootstrapAdmin =
        Boolean(normalizedTelegramUsername) &&
        isBootstrapAdminUsername(normalizedTelegramUsername) &&
        !existingUser.isAdmin;

      if (
        shouldUpdateLocale ||
        shouldUpdateUsername ||
        shouldGrantBootstrapAdmin
      ) {
        return this.update(existingUser.id, {
          ...(shouldUpdateLocale
            ? {
                locale,
              }
            : {}),
          ...(shouldUpdateUsername
            ? {
                telegramUsername: normalizedTelegramUsername,
              }
            : {}),
          ...(shouldGrantBootstrapAdmin
            ? {
                isAdmin: true,
              }
            : {}),
        });
      }

      return this.resolveAdminAccess(existingUser);
    }

    try {
      return await this.create({
        ...(locale
          ? {
              locale,
            }
          : {}),
        ...(normalizedTelegramUsername
          ? {
              telegramUsername: normalizedTelegramUsername,
            }
          : {}),
        telegramId,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        const user = await this.findByTelegramId(telegramId);

        if (user) {
          return this.resolveAdminAccess(user);
        }
      }

      throw error;
    }
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.findByIdOrFail(userId);
    const normalizedTelegramUsername =
      dto.telegramUsername === undefined
        ? undefined
        : normalizeTelegramUsername(dto.telegramUsername);

    try {
      const nextUser = this.usersRepository.merge(user, {
        ...dto,
        ...(normalizedTelegramUsername !== undefined
          ? {
              telegramUsername: normalizedTelegramUsername,
            }
          : {}),
        ...(dto.subscriptionEndsAt !== undefined
          ? {
              subscriptionEndsAt: dto.subscriptionEndsAt
                ? new Date(dto.subscriptionEndsAt)
                : null,
            }
          : {}),
      });

      return this.resolveAdminAccess(await this.usersRepository.save(nextUser));
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

    return this.resolveAdminAccess(await this.usersRepository.save(nextUser));
  }

  updateLocale(userId: string, locale: UserLocale) {
    return this.update(userId, {
      locale,
    });
  }

  setAdminStatus(userId: string, isAdmin: boolean) {
    return this.update(userId, {
      isAdmin,
    });
  }

  async updateSubscription(
    userId: string,
    action: UserSubscriptionAdminAction,
  ) {
    const user = await this.findByIdOrFail(userId);
    const now = Date.now();

    if (action === 'clear') {
      return this.update(userId, {
        subscriptionEndsAt: null,
        subscriptionStatus: UserSubscriptionStatus.NONE,
      });
    }

    if (action === 'grant_trial') {
      return this.update(userId, {
        subscriptionEndsAt: new Date(
          now + TRIAL_DURATION_DAYS * MS_IN_DAY,
        ).toISOString(),
        subscriptionStatus: UserSubscriptionStatus.TRIAL,
      });
    }

    const currentSubscriptionEndsAt = user.subscriptionEndsAt?.getTime() ?? 0;
    const baseTimestamp =
      currentSubscriptionEndsAt > now ? currentSubscriptionEndsAt : now;

    return this.update(userId, {
      subscriptionEndsAt: new Date(
        baseTimestamp + MONTHLY_SUBSCRIPTION_DURATION_DAYS * MS_IN_DAY,
      ).toISOString(),
      subscriptionStatus: UserSubscriptionStatus.ACTIVE,
    });
  }

  private resolveAdminAccess(user: UserEntity) {
    user.isAdmin = hasAdminAccess(user);

    return user;
  }
}
