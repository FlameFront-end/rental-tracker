import type { AxiosError } from 'axios'

import { APP_LOCALES, DEFAULT_LOCALE, type AppLocale } from '@/shared/model'

const LOCALE_STORAGE_KEY = 'rental-tracker-locale'

const API_ERROR_TRANSLATIONS: Record<string, Record<AppLocale, string>> = {
  'Access token is invalid or expired.': {
    en: 'Your session has expired. Please sign in again.',
    ru: 'Сессия истекла. Войдите снова.',
    id: 'Sesi sudah berakhir. Silakan masuk lagi.'
  },
  'Admin access is denied for this user.': {
    en: 'You do not have access to this admin action.',
    ru: 'У вас нет доступа к этому действию администратора.',
    id: 'Anda tidak memiliki akses ke tindakan admin ini.'
  },
  'Admin access requires an authenticated user.': {
    en: 'Admin access requires authorization.',
    ru: 'Для доступа администратора нужна авторизация.',
    id: 'Akses admin memerlukan otorisasi.'
  },
  'Asset cannot be removed because booking history still exists.': {
    en: 'This bike cannot be removed until related rental history is handled.',
    ru: 'Этот байк нельзя удалить, пока с ним связана история аренд.',
    id: 'Motor ini tidak bisa dihapus selama riwayat sewa terkait masih ada.'
  },
  'Asset cannot be removed because it has active or future bookings.': {
    en: 'This bike cannot be removed because it has active or upcoming rentals.',
    ru: 'Этот байк нельзя удалить, потому что у него есть активные или будущие аренды.',
    id: 'Motor ini tidak bisa dihapus karena masih memiliki sewa aktif atau yang akan datang.'
  },
  'Authorization header must contain a bearer token.': {
    en: 'Authorization is missing. Please sign in again.',
    ru: 'Не удалось авторизоваться. Войдите снова.',
    id: 'Otorisasi tidak ditemukan. Silakan masuk lagi.'
  },
  'Bearer token is missing.': {
    en: 'Authorization is missing. Please sign in again.',
    ru: 'Не удалось авторизоваться. Войдите снова.',
    id: 'Otorisasi tidak ditemukan. Silakan masuk lagi.'
  },
  'Booking dates overlap with an existing booking for this asset.': {
    en: 'These dates overlap with another rental for this bike.',
    ru: 'Эти даты пересекаются с другой арендой этого байка.',
    id: 'Tanggal ini bertabrakan dengan sewa lain untuk motor ini.'
  },
  'Development login is disabled in production.': {
    en: 'Development login is disabled in production.',
    ru: 'Dev-вход отключён в production.',
    id: 'Login development dinonaktifkan di production.'
  },
  'Free trial has already been activated for this user.': {
    en: 'The free trial has already been activated.',
    ru: 'Пробный период уже был активирован.',
    id: 'Trial gratis sudah pernah diaktifkan.'
  },
  'price must be a number with up to 2 decimal places.': {
    en: 'The amount must be a number with up to 2 decimal places.',
    ru: 'Сумма должна быть числом максимум с двумя знаками после запятой.',
    id: 'Nominal harus berupa angka dengan maksimal 2 angka di belakang koma.'
  },
  'startDate must be less than or equal to endDate.': {
    en: 'The end date cannot be earlier than the start date.',
    ru: 'Дата окончания не может быть раньше даты начала.',
    id: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai.'
  },
  'telegramId must contain only digits.': {
    en: 'Telegram ID must contain digits only.',
    ru: 'Telegram ID должен содержать только цифры.',
    id: 'Telegram ID hanya boleh berisi angka.'
  },
  'telegramUsername must contain only Telegram username characters.': {
    en: 'Telegram username contains invalid characters.',
    ru: 'В Telegram username есть недопустимые символы.',
    id: 'Username Telegram berisi karakter yang tidak valid.'
  },
  'Telegram auth is unavailable because TELEGRAM_BOT_TOKEN is not configured.':
    {
      en: 'Telegram sign-in is temporarily unavailable.',
      ru: 'Вход через Telegram временно недоступен.',
      id: 'Login Telegram sementara tidak tersedia.'
    },
  'Telegram initData auth_date is in the future.': {
    en: 'Telegram authorization data is invalid. Please reopen the app.',
    ru: 'Данные авторизации Telegram некорректны. Откройте приложение заново.',
    id: 'Data otorisasi Telegram tidak valid. Buka ulang aplikasi.'
  },
  'Telegram initData auth_date must be a valid unix timestamp.': {
    en: 'Telegram authorization data is invalid. Please reopen the app.',
    ru: 'Данные авторизации Telegram некорректны. Откройте приложение заново.',
    id: 'Data otorisasi Telegram tidak valid. Buka ulang aplikasi.'
  },
  'Telegram initData has expired.': {
    en: 'Telegram authorization has expired. Please reopen the app.',
    ru: 'Авторизация Telegram истекла. Откройте приложение заново.',
    id: 'Otorisasi Telegram sudah kedaluwarsa. Buka ulang aplikasi.'
  },
  'Telegram initData hash is invalid.': {
    en: 'Telegram authorization data is invalid. Please reopen the app.',
    ru: 'Данные авторизации Telegram некорректны. Откройте приложение заново.',
    id: 'Data otorisasi Telegram tidak valid. Buka ulang aplikasi.'
  },
  'Telegram initData is incomplete.': {
    en: 'Telegram authorization data is incomplete. Please reopen the app.',
    ru: 'Данные авторизации Telegram неполные. Откройте приложение заново.',
    id: 'Data otorisasi Telegram tidak lengkap. Buka ulang aplikasi.'
  },
  'Telegram initData signature is invalid.': {
    en: 'Telegram authorization data is invalid. Please reopen the app.',
    ru: 'Данные авторизации Telegram некорректны. Откройте приложение заново.',
    id: 'Data otorisasi Telegram tidak valid. Buka ulang aplikasi.'
  },
  'Telegram initData user payload is invalid.': {
    en: 'Telegram authorization data is invalid. Please reopen the app.',
    ru: 'Данные авторизации Telegram некорректны. Откройте приложение заново.',
    id: 'Data otorisasi Telegram tidak valid. Buka ulang aplikasi.'
  },
  'Telegram initData user payload must contain an id.': {
    en: 'Telegram authorization data is invalid. Please reopen the app.',
    ru: 'Данные авторизации Telegram некорректны. Откройте приложение заново.',
    id: 'Data otorisasi Telegram tidak valid. Buka ulang aplikasi.'
  },
  'User with this telegramId already exists.': {
    en: 'A user with this Telegram ID already exists.',
    ru: 'Пользователь с таким Telegram ID уже существует.',
    id: 'Pengguna dengan Telegram ID ini sudah ada.'
  },
  'Validation failed (uuid v4 is expected)': {
    en: 'The requested item has an invalid identifier.',
    ru: 'У запрошенного элемента некорректный идентификатор.',
    id: 'Item yang diminta memiliki identifier yang tidak valid.'
  }
}

const formatDaysLimit = (locale: AppLocale, days: string) => {
  switch (locale) {
    case 'ru':
      return `Диапазон календаря не может быть больше ${days} дней.`
    case 'id':
      return `Rentang kalender tidak boleh lebih dari ${days} hari.`
    default:
      return `The calendar range cannot exceed ${days} days.`
  }
}

const getFieldLabel = (fieldName: string, locale: AppLocale) => {
  const labels: Record<string, Record<AppLocale, string>> = {
    date: {
      en: 'date',
      ru: 'дата',
      id: 'tanggal'
    },
    endDate: {
      en: 'end date',
      ru: 'дата окончания',
      id: 'tanggal selesai'
    },
    from: {
      en: 'start of the period',
      ru: 'начало периода',
      id: 'awal rentang'
    },
    startDate: {
      en: 'start date',
      ru: 'дата начала',
      id: 'tanggal mulai'
    },
    to: {
      en: 'end of the period',
      ru: 'конец периода',
      id: 'akhir rentang'
    }
  }

  return labels[fieldName]?.[locale]
}

const formatDateFieldError = (
  fieldName: string,
  locale: AppLocale,
  mode: 'format' | 'valid-date' | 'calendar-date'
) => {
  const fieldLabel = getFieldLabel(fieldName, locale)

  if (!fieldLabel) {
    return null
  }

  switch (locale) {
    case 'ru':
      if (mode === 'format') {
        return `${fieldLabel} должна быть в формате ГГГГ-ММ-ДД.`
      }

      return `${fieldLabel} должна быть корректной датой в формате ГГГГ-ММ-ДД.`
    case 'id':
      if (mode === 'format') {
        return `${fieldLabel} harus berformat YYYY-MM-DD.`
      }

      return `${fieldLabel} harus berupa tanggal yang valid dalam format YYYY-MM-DD.`
    default:
      if (mode === 'format') {
        return `${fieldLabel} must be in YYYY-MM-DD format.`
      }

      return `${fieldLabel} must be a valid date in YYYY-MM-DD format.`
  }
}

const API_ERROR_PATTERNS = [
  {
    pattern: /^Asset [\w-]+ was not found\.$/,
    resolve: (locale: AppLocale) =>
      ({
        en: 'The bike was not found.',
        ru: 'Байк не найден.',
        id: 'Motor tidak ditemukan.'
      })[locale]
  },
  {
    pattern: /^Booking [\w-]+ was not found\.$/,
    resolve: (locale: AppLocale) =>
      ({
        en: 'The rental was not found.',
        ru: 'Аренда не найдена.',
        id: 'Sewa tidak ditemukan.'
      })[locale]
  },
  {
    pattern: /^User [\w-]+ was not found\.$/,
    resolve: (locale: AppLocale) =>
      ({
        en: 'The user was not found.',
        ru: 'Пользователь не найден.',
        id: 'Pengguna tidak ditemukan.'
      })[locale]
  },
  {
    pattern: /^Occupancy range cannot exceed (\d+) days\.$/,
    resolve: (locale: AppLocale, match: RegExpMatchArray) =>
      formatDaysLimit(locale, match[1] ?? '0')
  },
  {
    pattern: /^(\w+) must be in YYYY-MM-DD format\.$/,
    resolve: (locale: AppLocale, match: RegExpMatchArray) =>
      formatDateFieldError(match[1] ?? '', locale, 'format')
  },
  {
    pattern: /^(\w+) must be a valid date in YYYY-MM-DD format\.$/,
    resolve: (locale: AppLocale, match: RegExpMatchArray) =>
      formatDateFieldError(match[1] ?? '', locale, 'valid-date')
  },
  {
    pattern: /^(\w+) must be a valid calendar date in YYYY-MM-DD format\.$/,
    resolve: (locale: AppLocale, match: RegExpMatchArray) =>
      formatDateFieldError(match[1] ?? '', locale, 'calendar-date')
  }
]

const resolveLocale = (): AppLocale => {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE
  }

  try {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)

    return APP_LOCALES.includes(storedLocale as AppLocale)
      ? (storedLocale as AppLocale)
      : DEFAULT_LOCALE
  } catch {
    return DEFAULT_LOCALE
  }
}

const translateApiErrorText = (message: string) => {
  const normalizedMessage = message.trim()

  if (!normalizedMessage) {
    return message
  }

  const locale = resolveLocale()
  const directTranslation = API_ERROR_TRANSLATIONS[normalizedMessage]?.[locale]

  if (directTranslation) {
    return directTranslation
  }

  for (const localizer of API_ERROR_PATTERNS) {
    const match = normalizedMessage.match(localizer.pattern)

    if (!match) {
      continue
    }

    const localizedMessage = localizer.resolve(locale, match)

    if (localizedMessage) {
      return localizedMessage
    }
  }

  return message
}

export const getApiErrorMessage = (
  error: unknown,
  fallbackMessage = 'Request failed. Please try again.'
) => {
  const axiosError = error as AxiosError<{ message?: string | string[] }>
  const responseMessage = axiosError.response?.data?.message

  if (Array.isArray(responseMessage) && responseMessage.length > 0) {
    return responseMessage
      .map((message) => translateApiErrorText(message))
      .join(', ')
  }

  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return translateApiErrorText(responseMessage)
  }

  if (axiosError.response && error instanceof Error) {
    const translatedMessage = translateApiErrorText(error.message)

    return translatedMessage !== error.message ||
      !error.message.startsWith('Request failed with status code')
      ? translatedMessage
      : fallbackMessage
  }

  if (error instanceof Error && error.message.trim()) {
    const translatedMessage = translateApiErrorText(error.message)

    return axiosError.isAxiosError && translatedMessage === error.message
      ? fallbackMessage
      : translatedMessage
  }

  return fallbackMessage
}
