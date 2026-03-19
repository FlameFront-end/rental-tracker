import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import {
  getCurrentDateOnly,
  addDaysToDateOnly,
} from '../../common/utils/date.util';
import { BookingEntity } from '../bookings/entities/booking.entity';
import { UserEntity } from '../users/entities/user.entity';
import { UserLocale } from '../users/enums/user-locale.enum';
import { UserSubscriptionStatus } from '../users/enums/user-subscription-status.enum';
import { UsersService } from '../users/users.service';
import { DispatchNotificationsDto } from './dto/dispatch-notifications.dto';
import { NotificationsPreferencesDto } from './dto/notifications-preferences.dto';
import { NotificationsDispatchResultDto } from './dto/notifications-dispatch-result.dto';
import { NotificationsStatusDto } from './dto/notifications-status.dto';
import { UpdateNotificationsPreferencesDto } from './dto/update-notifications-preferences.dto';
import { NotificationDeliveryEntity } from './entities/notification-delivery.entity';
import { SubscriptionNotificationDeliveryEntity } from './entities/subscription-notification-delivery.entity';
import { NotificationDeliveryStatus } from './enums/notification-delivery-status.enum';
import { NotificationReminderType } from './enums/notification-reminder-type.enum';
import { SubscriptionNotificationType } from './enums/subscription-notification-type.enum';
import {
  formatNotificationDateOnly,
  formatNotificationDateTime,
  getNotificationCopy,
} from './notification-locale.util';

type DueReminderBooking = {
  assetName: string;
  bookingId: string;
  clientName: string;
  endDate: string;
  locale: UserLocale;
  telegramChatId: string;
  userId: string;
};

type RawDueReminderBooking = Omit<DueReminderBooking, 'endDate'> & {
  endDate: Date | string;
};

const TODAY_CRON = '0 * * * *';
const TOMORROW_CRON = '10 * * * *';
const SUBSCRIPTION_EXPIRY_CRON = '20 * * * *';

type DueSubscriptionNotification = {
  locale: UserLocale;
  notificationType: SubscriptionNotificationType;
  subscriptionEndsAt: string;
  telegramChatId: string;
  userId: string;
};

type RawDueSubscriptionNotification = Omit<
  DueSubscriptionNotification,
  'notificationType' | 'subscriptionEndsAt'
> & {
  subscriptionEndsAt: Date | string;
  subscriptionStatus: UserSubscriptionStatus;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectRepository(BookingEntity)
    private readonly bookingsRepository: Repository<BookingEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(NotificationDeliveryEntity)
    private readonly deliveriesRepository: Repository<NotificationDeliveryEntity>,
    @InjectRepository(SubscriptionNotificationDeliveryEntity)
    private readonly subscriptionDeliveriesRepository: Repository<SubscriptionNotificationDeliveryEntity>,
  ) {}

  async getStatus(): Promise<NotificationsStatusDto> {
    const [
      bookingSentCount,
      bookingFailedCount,
      subscriptionSentCount,
      subscriptionFailedCount,
    ] = await Promise.all([
      this.deliveriesRepository.count({
        where: {
          status: NotificationDeliveryStatus.SENT,
        },
      }),
      this.deliveriesRepository.count({
        where: {
          status: NotificationDeliveryStatus.FAILED,
        },
      }),
      this.subscriptionDeliveriesRepository.count({
        where: {
          status: NotificationDeliveryStatus.SENT,
        },
      }),
      this.subscriptionDeliveriesRepository.count({
        where: {
          status: NotificationDeliveryStatus.FAILED,
        },
      }),
    ]);
    const botConfigured = this.isBotConfigured();

    return {
      status: botConfigured ? 'ready' : 'disabled',
      message: botConfigured
        ? 'Telegram reminders and subscription alerts are configured and scheduled.'
        : 'Telegram reminders and subscription alerts are disabled because TELEGRAM_BOT_TOKEN is empty.',
      botConfigured,
      schedulerEnabled: botConfigured,
      sentCount: bookingSentCount + subscriptionSentCount,
      failedCount: bookingFailedCount + subscriptionFailedCount,
    };
  }

  async getPreferences(userId: string): Promise<NotificationsPreferencesDto> {
    const user = await this.usersService.findByIdOrFail(userId);

    return this.mapPreferences(user);
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationsPreferencesDto,
  ): Promise<NotificationsPreferencesDto> {
    const user = await this.usersService.update(userId, {
      ...(dto.reminderTodayEnabled !== undefined
        ? {
            notificationReminderTodayEnabled: dto.reminderTodayEnabled,
          }
        : {}),
      ...(dto.reminderTomorrowEnabled !== undefined
        ? {
            notificationReminderTomorrowEnabled: dto.reminderTomorrowEnabled,
          }
        : {}),
    });

    return this.mapPreferences(user);
  }

  @Cron(TODAY_CRON, {
    name: 'notifications-today',
  })
  async dispatchTodayCron() {
    await this.dispatchReminders(NotificationReminderType.TODAY);
  }

  @Cron(TOMORROW_CRON, {
    name: 'notifications-tomorrow',
  })
  async dispatchTomorrowCron() {
    await this.dispatchReminders(NotificationReminderType.TOMORROW);
  }

  @Cron(SUBSCRIPTION_EXPIRY_CRON, {
    name: 'notifications-subscription-expiry',
  })
  async dispatchSubscriptionExpiryCron() {
    await this.dispatchSubscriptionExpiryNotifications();
  }

  async runManualDispatch(
    userId: string,
    dto: DispatchNotificationsDto,
  ): Promise<NotificationsDispatchResultDto[]> {
    const reminderTypes =
      dto.kind === 'all'
        ? [NotificationReminderType.TODAY, NotificationReminderType.TOMORROW]
        : [dto.kind];

    const results: NotificationsDispatchResultDto[] = [];

    for (const reminderType of reminderTypes) {
      results.push(
        await this.dispatchReminders(reminderType, {
          dryRun: dto.dryRun,
          userId,
        }),
      );
    }

    return results;
  }

  private async dispatchReminders(
    reminderType: NotificationReminderType,
    options?: {
      dryRun?: boolean;
      userId?: string;
    },
  ): Promise<NotificationsDispatchResultDto> {
    const targetDate = this.getTargetDate(reminderType);
    const dueBookings = await this.findDueBookings(
      targetDate,
      reminderType,
      options?.userId,
    );
    const result: NotificationsDispatchResultDto = {
      reminderType,
      targetDate,
      dryRun: options?.dryRun ?? false,
      dueCount: dueBookings.length,
      sentCount: 0,
      skippedCount: 0,
      failedCount: 0,
      items: [],
    };

    if (!this.isBotConfigured() && !options?.dryRun) {
      this.logger.warn(
        `Skipping ${reminderType} reminders because TELEGRAM_BOT_TOKEN is not configured.`,
      );

      result.skippedCount = dueBookings.length;
      result.items = dueBookings.map((booking) => ({
        bookingId: booking.bookingId,
        userId: booking.userId,
        bikeName: booking.assetName,
        clientName: booking.clientName,
        endDate: booking.endDate,
        outcome: 'skipped',
        message: this.buildReminderMessage(booking, reminderType),
        error: 'TELEGRAM_BOT_TOKEN is not configured.',
      }));

      return result;
    }

    for (const booking of dueBookings) {
      const message = this.buildReminderMessage(booking, reminderType);

      if (options?.dryRun) {
        result.sentCount += 1;
        result.items.push({
          bookingId: booking.bookingId,
          userId: booking.userId,
          bikeName: booking.assetName,
          clientName: booking.clientName,
          endDate: booking.endDate,
          outcome: 'dry-run',
          message,
          error: null,
        });

        continue;
      }

      const claimedDelivery = await this.claimDelivery(booking, reminderType);

      if (!claimedDelivery) {
        result.skippedCount += 1;
        result.items.push({
          bookingId: booking.bookingId,
          userId: booking.userId,
          bikeName: booking.assetName,
          clientName: booking.clientName,
          endDate: booking.endDate,
          outcome: 'skipped',
          message,
          error:
            'A sent reminder already exists for this booking and reminder type.',
        });

        continue;
      }

      try {
        await this.sendTelegramMessage(booking.telegramChatId, message);
        await this.deliveriesRepository.update(claimedDelivery.id, {
          status: NotificationDeliveryStatus.SENT,
          sentAt: new Date(),
          lastError: null,
        });

        result.sentCount += 1;
        result.items.push({
          bookingId: booking.bookingId,
          userId: booking.userId,
          bikeName: booking.assetName,
          clientName: booking.clientName,
          endDate: booking.endDate,
          outcome: 'sent',
          message,
          error: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown Telegram error.';

        await this.deliveriesRepository.update(claimedDelivery.id, {
          status: NotificationDeliveryStatus.FAILED,
          lastError: errorMessage,
        });

        result.failedCount += 1;
        result.items.push({
          bookingId: booking.bookingId,
          userId: booking.userId,
          bikeName: booking.assetName,
          clientName: booking.clientName,
          endDate: booking.endDate,
          outcome: 'failed',
          message,
          error: errorMessage,
        });

        this.logger.error(
          `Failed to send ${reminderType} reminder for booking ${booking.bookingId}: ${errorMessage}`,
        );
      }
    }

    return result;
  }

  private async dispatchSubscriptionExpiryNotifications() {
    const dueNotifications = await this.findDueSubscriptionNotifications();

    if (!dueNotifications.length) {
      return;
    }

    if (!this.isBotConfigured()) {
      this.logger.warn(
        `Skipping ${dueNotifications.length} subscription expiry notifications because TELEGRAM_BOT_TOKEN is not configured.`,
      );

      return;
    }

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const notification of dueNotifications) {
      const message = this.buildSubscriptionExpiryMessage(notification);
      const claimedDelivery =
        await this.claimSubscriptionDelivery(notification);

      if (!claimedDelivery) {
        skippedCount += 1;
        continue;
      }

      try {
        await this.sendTelegramMessage(notification.telegramChatId, message);
        await this.subscriptionDeliveriesRepository.update(claimedDelivery.id, {
          status: NotificationDeliveryStatus.SENT,
          sentAt: new Date(),
          lastError: null,
        });
        sentCount += 1;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown Telegram error.';

        await this.subscriptionDeliveriesRepository.update(claimedDelivery.id, {
          status: NotificationDeliveryStatus.FAILED,
          lastError: errorMessage,
        });
        failedCount += 1;

        this.logger.error(
          `Failed to send ${notification.notificationType} notification for user ${notification.userId}: ${errorMessage}`,
        );
      }
    }

    if (sentCount || skippedCount || failedCount) {
      this.logger.log(
        `Processed subscription expiry notifications: sent=${sentCount}, skipped=${skippedCount}, failed=${failedCount}.`,
      );
    }
  }

  private async findDueBookings(
    targetDate: string,
    reminderType: NotificationReminderType,
    userId?: string,
  ) {
    const qb = this.bookingsRepository
      .createQueryBuilder('booking')
      .innerJoin('booking.asset', 'asset')
      .innerJoin('asset.user', 'user')
      .select('booking.id', 'bookingId')
      .addSelect('booking.clientName', 'clientName')
      .addSelect('booking.endDate', 'endDate')
      .addSelect('asset.name', 'assetName')
      .addSelect('user.locale', 'locale')
      .addSelect('user.id', 'userId')
      .addSelect('user.telegramId', 'telegramChatId')
      .where('booking.endDate = :targetDate', { targetDate })
      .orderBy('booking.createdAt', 'ASC');

    qb.andWhere(
      reminderType === NotificationReminderType.TODAY
        ? 'user.notificationReminderTodayEnabled = true'
        : 'user.notificationReminderTomorrowEnabled = true',
    );

    if (userId) {
      qb.andWhere('user.id = :userId', {
        userId,
      });
    }

    const rows = await qb.getRawMany<RawDueReminderBooking>();

    return rows.map((row) => ({
      ...row,
      endDate: this.formatDateOnlyValue(row.endDate),
    }));
  }

  private async claimDelivery(
    booking: DueReminderBooking,
    reminderType: NotificationReminderType,
  ) {
    const dedupeKey = this.buildDedupeKey(
      booking.bookingId,
      reminderType,
      booking.endDate,
    );
    const existingDelivery = await this.deliveriesRepository.findOne({
      where: {
        dedupeKey,
      },
    });

    if (!existingDelivery) {
      try {
        return await this.deliveriesRepository.save(
          this.deliveriesRepository.create({
            dedupeKey,
            userId: booking.userId,
            bookingId: booking.bookingId,
            telegramChatId: booking.telegramChatId,
            reminderType,
            targetDate: booking.endDate,
            status: NotificationDeliveryStatus.PROCESSING,
            attemptCount: 1,
            lastError: null,
            sentAt: null,
          }),
        );
      } catch (error) {
        const duplicateDelivery = await this.deliveriesRepository.findOne({
          where: {
            dedupeKey,
          },
        });

        if (!duplicateDelivery) {
          throw error;
        }

        if (duplicateDelivery.status === NotificationDeliveryStatus.SENT) {
          return null;
        }

        duplicateDelivery.status = NotificationDeliveryStatus.PROCESSING;
        duplicateDelivery.attemptCount += 1;
        duplicateDelivery.lastError = null;
        duplicateDelivery.telegramChatId = booking.telegramChatId;

        return this.deliveriesRepository.save(duplicateDelivery);
      }
    }

    if (existingDelivery.status === NotificationDeliveryStatus.SENT) {
      return null;
    }

    existingDelivery.status = NotificationDeliveryStatus.PROCESSING;
    existingDelivery.attemptCount += 1;
    existingDelivery.lastError = null;
    existingDelivery.telegramChatId = booking.telegramChatId;

    return this.deliveriesRepository.save(existingDelivery);
  }

  private async findDueSubscriptionNotifications(userId?: string) {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .select('user.id', 'userId')
      .addSelect('user.telegramId', 'telegramChatId')
      .addSelect('user.locale', 'locale')
      .addSelect('user.subscriptionStatus', 'subscriptionStatus')
      .addSelect('user.subscriptionEndsAt', 'subscriptionEndsAt')
      .where('user.subscriptionEndsAt IS NOT NULL')
      .andWhere('user.subscriptionEndsAt <= :now', {
        now: new Date().toISOString(),
      })
      .andWhere('user.subscriptionStatus IN (:...statuses)', {
        statuses: [
          UserSubscriptionStatus.TRIAL,
          UserSubscriptionStatus.ACTIVE,
        ],
      })
      .orderBy('user.subscriptionEndsAt', 'ASC');

    if (userId) {
      qb.andWhere('user.id = :userId', {
        userId,
      });
    }

    const rows = await qb.getRawMany<RawDueSubscriptionNotification>();

    return rows.map((row) => ({
      notificationType:
        row.subscriptionStatus === UserSubscriptionStatus.TRIAL
          ? SubscriptionNotificationType.TRIAL_EXPIRED
          : SubscriptionNotificationType.SUBSCRIPTION_EXPIRED,
      subscriptionEndsAt: this.formatDateTimeValue(row.subscriptionEndsAt),
      locale: row.locale,
      telegramChatId: row.telegramChatId,
      userId: row.userId,
    }));
  }

  private async claimSubscriptionDelivery(
    notification: DueSubscriptionNotification,
  ) {
    const dedupeKey = this.buildSubscriptionDedupeKey(
      notification.userId,
      notification.notificationType,
      notification.subscriptionEndsAt,
    );
    const existingDelivery =
      await this.subscriptionDeliveriesRepository.findOne({
        where: {
          dedupeKey,
        },
      });

    if (!existingDelivery) {
      try {
        return await this.subscriptionDeliveriesRepository.save(
          this.subscriptionDeliveriesRepository.create({
            dedupeKey,
            userId: notification.userId,
            telegramChatId: notification.telegramChatId,
            notificationType: notification.notificationType,
            subscriptionEndsAt: new Date(notification.subscriptionEndsAt),
            status: NotificationDeliveryStatus.PROCESSING,
            attemptCount: 1,
            lastError: null,
            sentAt: null,
          }),
        );
      } catch (error) {
        const duplicateDelivery =
          await this.subscriptionDeliveriesRepository.findOne({
            where: {
              dedupeKey,
            },
          });

        if (!duplicateDelivery) {
          throw error;
        }

        if (duplicateDelivery.status === NotificationDeliveryStatus.SENT) {
          return null;
        }

        duplicateDelivery.status = NotificationDeliveryStatus.PROCESSING;
        duplicateDelivery.attemptCount += 1;
        duplicateDelivery.lastError = null;
        duplicateDelivery.telegramChatId = notification.telegramChatId;

        return this.subscriptionDeliveriesRepository.save(duplicateDelivery);
      }
    }

    if (existingDelivery.status === NotificationDeliveryStatus.SENT) {
      return null;
    }

    existingDelivery.status = NotificationDeliveryStatus.PROCESSING;
    existingDelivery.attemptCount += 1;
    existingDelivery.lastError = null;
    existingDelivery.telegramChatId = notification.telegramChatId;

    return this.subscriptionDeliveriesRepository.save(existingDelivery);
  }

  private buildDedupeKey(
    bookingId: string,
    reminderType: NotificationReminderType,
    targetDate: string,
  ) {
    return `${bookingId}:${reminderType}:${targetDate}`;
  }

  private buildSubscriptionDedupeKey(
    userId: string,
    notificationType: SubscriptionNotificationType,
    subscriptionEndsAt: string,
  ) {
    return `${userId}:${notificationType}:${subscriptionEndsAt}`;
  }

  private buildReminderMessage(
    booking: DueReminderBooking,
    reminderType: NotificationReminderType,
  ) {
    const copy = getNotificationCopy(booking.locale);
    const dateLabel = formatNotificationDateOnly(booking.endDate, booking.locale);

    return [
      reminderType === NotificationReminderType.TODAY
        ? copy.bookingEndsToday
        : copy.bookingEndsTomorrow,
      `${copy.bookingItemLabel}: ${booking.assetName}`,
      `${copy.bookingClientLabel}: ${booking.clientName}`,
      `${copy.bookingEndDateLabel}: ${dateLabel}`,
    ].join('\n');
  }

  private buildSubscriptionExpiryMessage(
    notification: DueSubscriptionNotification,
  ) {
    const copy = getNotificationCopy(notification.locale);
    const endedAtLabel = formatNotificationDateTime(
      notification.subscriptionEndsAt,
      notification.locale,
    );

    if (
      notification.notificationType ===
      SubscriptionNotificationType.TRIAL_EXPIRED
    ) {
      return [
        copy.trialExpiredTitle,
        `${copy.subscriptionEndedAtLabel}: ${endedAtLabel}`,
        copy.trialExpiredCta,
      ].join('\n');
    }

    return [
      copy.subscriptionExpiredTitle,
      `${copy.subscriptionEndedAtLabel}: ${endedAtLabel}`,
      copy.subscriptionExpiredCta,
    ].join('\n');
  }

  private mapPreferences(user: {
    notificationReminderTodayEnabled: boolean;
    notificationReminderTomorrowEnabled: boolean;
  }): NotificationsPreferencesDto {
    return {
      reminderTodayEnabled: user.notificationReminderTodayEnabled,
      reminderTomorrowEnabled: user.notificationReminderTomorrowEnabled,
    };
  }

  private formatDateOnlyValue(value: Date | string) {
    if (typeof value === 'string') {
      return value;
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatDateTimeValue(value: Date | string) {
    if (typeof value === 'string') {
      return value;
    }

    return value.toISOString();
  }

  private getTargetDate(reminderType: NotificationReminderType) {
    const today = getCurrentDateOnly();

    return reminderType === NotificationReminderType.TODAY
      ? today
      : addDaysToDateOnly(today, 1);
  }

  private isBotConfigured() {
    return Boolean(
      this.configService.get<string>('TELEGRAM_BOT_TOKEN', '').trim(),
    );
  }

  private async sendTelegramMessage(chatId: string, text: string) {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN', '');
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
        }),
      },
    );
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(
        `Telegram API returned ${response.status}: ${responseText}`,
      );
    }
  }
}
