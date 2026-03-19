import { UserLocale } from '../users/enums/user-locale.enum';

type NotificationCopy = {
  bookingClientLabel: string;
  bookingEndDateLabel: string;
  bookingEndsToday: string;
  bookingEndsTomorrow: string;
  bookingItemLabel: string;
  subscriptionEndedAtLabel: string;
  subscriptionExpiredCta: string;
  subscriptionExpiredTitle: string;
  trialExpiredCta: string;
  trialExpiredTitle: string;
};

const intlLocaleMap: Record<UserLocale, string> = {
  [UserLocale.EN]: 'en-US',
  [UserLocale.RU]: 'ru-RU',
  [UserLocale.ID]: 'id-ID',
};

const notificationCopyMap: Record<UserLocale, NotificationCopy> = {
  [UserLocale.EN]: {
    bookingClientLabel: 'Client',
    bookingEndDateLabel: 'End date',
    bookingEndsToday: 'Rental reminder: booking ends today.',
    bookingEndsTomorrow: 'Rental reminder: booking ends tomorrow.',
    bookingItemLabel: 'Bike',
    subscriptionEndedAtLabel: 'Ended at',
    subscriptionExpiredCta:
      'Open the Mini App and renew the subscription to continue.',
    subscriptionExpiredTitle: 'Your Rental Tracker subscription has ended.',
    trialExpiredCta:
      'Open the Mini App and activate a subscription to continue.',
    trialExpiredTitle: 'Your 7-day free trial in Rental Tracker has ended.',
  },
  [UserLocale.RU]: {
    bookingClientLabel: 'Клиент',
    bookingEndDateLabel: 'Дата окончания',
    bookingEndsToday: 'Напоминание по аренде: аренда заканчивается сегодня.',
    bookingEndsTomorrow: 'Напоминание по аренде: аренда заканчивается завтра.',
    bookingItemLabel: 'Байк',
    subscriptionEndedAtLabel: 'Завершилась',
    subscriptionExpiredCta:
      'Откройте Mini App и продлите подписку, чтобы продолжить работу.',
    subscriptionExpiredTitle: 'Ваша подписка в Rental Tracker закончилась.',
    trialExpiredCta:
      'Откройте Mini App и оформите подписку, чтобы продолжить работу.',
    trialExpiredTitle:
      'Ваш бесплатный пробный период 7 дней в Rental Tracker закончился.',
  },
  [UserLocale.ID]: {
    bookingClientLabel: 'Klien',
    bookingEndDateLabel: 'Tanggal selesai',
    bookingEndsToday: 'Pengingat rental: booking berakhir hari ini.',
    bookingEndsTomorrow: 'Pengingat rental: booking berakhir besok.',
    bookingItemLabel: 'Motor',
    subscriptionEndedAtLabel: 'Berakhir pada',
    subscriptionExpiredCta:
      'Buka Mini App dan perpanjang langganan untuk melanjutkan.',
    subscriptionExpiredTitle: 'Langganan Rental Tracker Anda telah berakhir.',
    trialExpiredCta:
      'Buka Mini App dan aktifkan langganan untuk melanjutkan.',
    trialExpiredTitle:
      'Masa uji coba gratis 7 hari Anda di Rental Tracker telah berakhir.',
  },
};

const formatDate = (
  value: string,
  locale: UserLocale,
  options: Intl.DateTimeFormatOptions,
) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(intlLocaleMap[locale], {
    ...options,
    timeZone: 'UTC',
  }).format(date);
};

export const getNotificationCopy = (locale: UserLocale) =>
  notificationCopyMap[locale] ?? notificationCopyMap[UserLocale.EN];

export const formatNotificationDateOnly = (
  value: string,
  locale: UserLocale,
) =>
  formatDate(value, locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatNotificationDateTime = (
  value: string,
  locale: UserLocale,
) =>
  `${formatDate(value, locale, {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  })} UTC`;
