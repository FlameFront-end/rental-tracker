import { UserEntity } from '../entities/user.entity';

export const TELEGRAM_BOOTSTRAP_ADMIN_USERNAME = 'Artem_Kaliganov';

export const normalizeTelegramUsername = (
  username?: string | null,
): string | null => {
  const normalizedUsername = username?.trim().replace(/^@+/, '') ?? '';

  return normalizedUsername ? normalizedUsername : null;
};

export const isBootstrapAdminUsername = (username?: string | null) => {
  const normalizedUsername = normalizeTelegramUsername(username);

  if (!normalizedUsername) {
    return false;
  }

  return (
    normalizedUsername.toLowerCase() ===
    TELEGRAM_BOOTSTRAP_ADMIN_USERNAME.toLowerCase()
  );
};

export const hasAdminAccess = (
  user?: Pick<UserEntity, 'isAdmin' | 'telegramUsername'> | null,
) => Boolean(user?.isAdmin) || isBootstrapAdminUsername(user?.telegramUsername);
