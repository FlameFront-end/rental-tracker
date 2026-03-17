import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

interface ValidateTelegramInitDataOptions {
  botToken: string;
  initData: string;
  maxAgeSeconds: number;
}

interface TelegramUserPayload {
  id?: number | string;
}

export interface ValidatedTelegramInitData {
  authDate: number;
  telegramId: string;
}

function buildDataCheckString(params: URLSearchParams) {
  return [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function parseTelegramUser(user: string) {
  try {
    return JSON.parse(user) as TelegramUserPayload;
  } catch {
    throw new UnauthorizedException(
      'Telegram initData user payload is invalid.',
    );
  }
}

function assertHash(actualHash: string, expectedHash: string) {
  if (!/^[a-f0-9]{64}$/i.test(actualHash)) {
    throw new UnauthorizedException('Telegram initData hash is invalid.');
  }

  const actualHashBuffer = Buffer.from(actualHash, 'hex');
  const expectedHashBuffer = Buffer.from(expectedHash, 'hex');

  if (
    actualHashBuffer.length !== expectedHashBuffer.length ||
    !timingSafeEqual(actualHashBuffer, expectedHashBuffer)
  ) {
    throw new UnauthorizedException('Telegram initData signature is invalid.');
  }
}

export function validateTelegramInitData({
  botToken,
  initData,
  maxAgeSeconds,
}: ValidateTelegramInitDataOptions): ValidatedTelegramInitData {
  if (!botToken) {
    throw new ServiceUnavailableException(
      'Telegram auth is unavailable because TELEGRAM_BOT_TOKEN is not configured.',
    );
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  const authDateRaw = params.get('auth_date');
  const userRaw = params.get('user');

  if (!hash || !authDateRaw || !userRaw) {
    throw new UnauthorizedException('Telegram initData is incomplete.');
  }

  const authDate = Number(authDateRaw);

  if (!Number.isInteger(authDate)) {
    throw new UnauthorizedException(
      'Telegram initData auth_date must be a valid unix timestamp.',
    );
  }

  const now = Math.floor(Date.now() / 1000);

  if (maxAgeSeconds > 0 && now - authDate > maxAgeSeconds) {
    throw new UnauthorizedException('Telegram initData has expired.');
  }

  if (authDate - now > 60) {
    throw new UnauthorizedException(
      'Telegram initData auth_date is in the future.',
    );
  }

  const dataCheckString = buildDataCheckString(params);
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex');

  assertHash(hash, expectedHash);

  const telegramUser = parseTelegramUser(userRaw);

  if (telegramUser.id === undefined || telegramUser.id === null) {
    throw new UnauthorizedException(
      'Telegram initData user payload must contain an id.',
    );
  }

  return {
    authDate,
    telegramId: String(telegramUser.id),
  };
}
