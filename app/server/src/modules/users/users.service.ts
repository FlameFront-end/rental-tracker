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

  async findOrCreateByTelegramId(telegramId: string) {
    const existingUser = await this.findByTelegramId(telegramId);

    if (existingUser) {
      return existingUser;
    }

    try {
      return await this.create({
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
}
