import { UserLocale } from '../enums/user-locale.enum';

export const USER_LOCALE_VALUES = Object.values(UserLocale);

export const normalizeUserLocale = (value?: string | null): UserLocale => {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue) {
    return UserLocale.EN;
  }

  if (
    normalizedValue === UserLocale.RU ||
    normalizedValue.startsWith(`${UserLocale.RU}-`)
  ) {
    return UserLocale.RU;
  }

  if (
    normalizedValue === UserLocale.ID ||
    normalizedValue === 'in' ||
    normalizedValue.startsWith(`${UserLocale.ID}-`) ||
    normalizedValue.startsWith('in-')
  ) {
    return UserLocale.ID;
  }

  return UserLocale.EN;
};
