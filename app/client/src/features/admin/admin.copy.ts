import type { AppLocale } from '@/shared/model'

interface AdminCopy {
  actions: {
    clearSubscription: string
    grantMonth: string
    grantTrial: string
    makeAdmin: string
    ownerLocked: string
    removeAdmin: string
  }
  chartTitle: string
  emptyDescription: string
  emptyTitle: string
  errors: {
    admin: string
    load: string
    subscription: string
  }
  filterAll: string
  filterLabel: string
  filterActive: string
  filterExpired: string
  filterNone: string
  filterTrial: string
  metrics: {
    active: string
    admins: string
    totalUsers: string
    trial: string
  }
  meta: {
    accessUntil: string
    created: string
    noSubscription: string
    noUsername: string
    telegramId: string
  }
  pending: {
    clearSubscription: string
    grantMonth: string
    grantTrial: string
    makeAdmin: string
    removeAdmin: string
  }
  roles: {
    admin: string
    owner: string
    user: string
  }
  searchLabel: string
  searchPlaceholder: string
  settingsAction: string
  settingsDescription: string
  settingsEyebrow: string
  settingsTitle: string
  statuses: {
    active: string
    expired: string
    none: string
    trial: string
  }
  subtitle: string
  title: string
  toasts: {
    adminGranted: string
    adminRemoved: string
    subscriptionCleared: string
    monthGranted: string
    trialGranted: string
  }
  usersDescription: (count: number) => string
  usersTitle: string
}

const copy: Record<AppLocale, AdminCopy> = {
  en: {
    actions: {
      clearSubscription: 'Remove access',
      grantMonth: '+30 days',
      grantTrial: 'Give trial',
      makeAdmin: 'Make admin',
      ownerLocked: 'Root admin',
      removeAdmin: 'Remove admin'
    },
    chartTitle: 'Access mix',
    emptyDescription: 'Try another search query or filter.',
    emptyTitle: 'No users found',
    errors: {
      admin: 'Failed to update admin access.',
      load: 'Failed to load users.',
      subscription: 'Failed to update subscription.'
    },
    filterAll: 'All users',
    filterLabel: 'Filter',
    filterActive: 'Active',
    filterExpired: 'Expired',
    filterNone: 'No access',
    filterTrial: 'Trial',
    metrics: {
      active: 'Active',
      admins: 'Admins',
      totalUsers: 'Users',
      trial: 'Trial'
    },
    meta: {
      accessUntil: 'Access until',
      created: 'Created',
      noSubscription: 'No subscription',
      noUsername: 'No username',
      telegramId: 'Telegram ID'
    },
    pending: {
      clearSubscription: 'Removing access...',
      grantMonth: 'Adding 30 days...',
      grantTrial: 'Starting trial...',
      makeAdmin: 'Granting admin...',
      removeAdmin: 'Removing admin...'
    },
    roles: {
      admin: 'Admin',
      owner: 'Owner',
      user: 'User'
    },
    searchLabel: 'Search',
    searchPlaceholder: '@username, Telegram ID, or UUID',
    settingsAction: 'Open admin panel',
    settingsDescription:
      'Review users, manage subscription access, and grant admin rights.',
    settingsEyebrow: 'Admin',
    settingsTitle: 'Access control',
    statuses: {
      active: 'Active',
      expired: 'Expired',
      none: 'No access',
      trial: 'Trial'
    },
    subtitle: 'Users, access levels, and manual subscription control.',
    title: 'Admin panel',
    toasts: {
      adminGranted: 'Admin access granted.',
      adminRemoved: 'Admin access removed.',
      subscriptionCleared: 'Subscription access removed.',
      monthGranted: 'Added 30 days of access.',
      trialGranted: 'Trial access granted.'
    },
    usersDescription: (count) => `${count} users match the current filters.`,
    usersTitle: 'Users'
  },
  id: {
    actions: {
      clearSubscription: 'Cabut akses',
      grantMonth: '+30 hari',
      grantTrial: 'Beri trial',
      makeAdmin: 'Jadikan admin',
      ownerLocked: 'Admin utama',
      removeAdmin: 'Hapus admin'
    },
    chartTitle: 'Komposisi akses',
    emptyDescription: 'Coba ubah pencarian atau filternya.',
    emptyTitle: 'User tidak ditemukan',
    errors: {
      admin: 'Gagal mengubah akses admin.',
      load: 'Gagal memuat user.',
      subscription: 'Gagal mengubah langganan.'
    },
    filterAll: 'Semua user',
    filterLabel: 'Filter',
    filterActive: 'Aktif',
    filterExpired: 'Kedaluwarsa',
    filterNone: 'Tanpa akses',
    filterTrial: 'Trial',
    metrics: {
      active: 'Aktif',
      admins: 'Admin',
      totalUsers: 'User',
      trial: 'Trial'
    },
    meta: {
      accessUntil: 'Akses sampai',
      created: 'Dibuat',
      noSubscription: 'Belum ada langganan',
      noUsername: 'Tanpa username',
      telegramId: 'Telegram ID'
    },
    pending: {
      clearSubscription: 'Mencabut akses...',
      grantMonth: 'Menambah 30 hari...',
      grantTrial: 'Memberi trial...',
      makeAdmin: 'Menjadikan admin...',
      removeAdmin: 'Menghapus admin...'
    },
    roles: {
      admin: 'Admin',
      owner: 'Owner',
      user: 'User'
    },
    searchLabel: 'Cari',
    searchPlaceholder: '@username, Telegram ID, atau UUID',
    settingsAction: 'Buka panel admin',
    settingsDescription:
      'Lihat user, atur akses langganan, dan tambahkan admin.',
    settingsEyebrow: 'Admin',
    settingsTitle: 'Kontrol akses',
    statuses: {
      active: 'Aktif',
      expired: 'Kedaluwarsa',
      none: 'Tanpa akses',
      trial: 'Trial'
    },
    subtitle: 'User, level akses, dan kontrol langganan manual.',
    title: 'Panel admin',
    toasts: {
      adminGranted: 'Akses admin diberikan.',
      adminRemoved: 'Akses admin dicabut.',
      subscriptionCleared: 'Akses langganan dicabut.',
      monthGranted: 'Akses ditambah 30 hari.',
      trialGranted: 'Akses trial diberikan.'
    },
    usersDescription: (count) => `${count} user sesuai filter saat ini.`,
    usersTitle: 'User'
  },
  ru: {
    actions: {
      clearSubscription: 'Убрать доступ',
      grantMonth: '+30 дней',
      grantTrial: 'Дать триал',
      makeAdmin: 'Сделать админом',
      ownerLocked: 'Главный админ',
      removeAdmin: 'Убрать админа'
    },
    chartTitle: 'Срез по доступу',
    emptyDescription: 'Попробуй изменить поиск или фильтр.',
    emptyTitle: 'Пользователи не найдены',
    errors: {
      admin: 'Не удалось обновить права администратора.',
      load: 'Не удалось загрузить пользователей.',
      subscription: 'Не удалось обновить подписку.'
    },
    filterAll: 'Все пользователи',
    filterLabel: 'Фильтр',
    filterActive: 'Активные',
    filterExpired: 'Просроченные',
    filterNone: 'Без доступа',
    filterTrial: 'Триал',
    metrics: {
      active: 'Активные',
      admins: 'Админы',
      totalUsers: 'Пользователи',
      trial: 'Триал'
    },
    meta: {
      accessUntil: 'Доступ до',
      created: 'Создан',
      noSubscription: 'Нет подписки',
      noUsername: 'Без username',
      telegramId: 'Telegram ID'
    },
    pending: {
      clearSubscription: 'Снимаем доступ...',
      grantMonth: 'Продлеваем на 30 дней...',
      grantTrial: 'Выдаём триал...',
      makeAdmin: 'Назначаем админом...',
      removeAdmin: 'Снимаем роль...'
    },
    roles: {
      admin: 'Админ',
      owner: 'Owner',
      user: 'Пользователь'
    },
    searchLabel: 'Поиск',
    searchPlaceholder: '@username, Telegram ID или UUID',
    settingsAction: 'Открыть админ-панель',
    settingsDescription:
      'Смотри список пользователей, выдавай подписку и назначай админов.',
    settingsEyebrow: 'Админка',
    settingsTitle: 'Управление доступом',
    statuses: {
      active: 'Активна',
      expired: 'Доступ истёк',
      none: 'Без доступа',
      trial: 'Триал'
    },
    subtitle: 'Пользователи, права доступа и ручное управление подпиской.',
    title: 'Админ-панель',
    toasts: {
      adminGranted: 'Права админа выданы.',
      adminRemoved: 'Права админа убраны.',
      subscriptionCleared: 'Доступ по подписке снят.',
      monthGranted: 'Доступ продлён на 30 дней.',
      trialGranted: 'Триал выдан.'
    },
    usersDescription: (count) => `По текущим фильтрам найдено: ${count}.`,
    usersTitle: 'Пользователи'
  }
}

export const getAdminCopy = (locale: AppLocale) => copy[locale] ?? copy.en
