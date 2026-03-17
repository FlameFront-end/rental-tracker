import { BadRequestException } from '@nestjs/common';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeDateOnly(value: string, fieldName: string) {
  if (!DATE_ONLY_PATTERN.test(value)) {
    throw new BadRequestException(
      `${fieldName} must be a valid date in YYYY-MM-DD format.`,
    );
  }

  const normalized = new Date(`${value}T00:00:00.000Z`)
    .toISOString()
    .slice(0, 10);

  if (normalized !== value) {
    throw new BadRequestException(
      `${fieldName} must be a valid calendar date in YYYY-MM-DD format.`,
    );
  }

  return value;
}

export function assertDateRange(startDate: string, endDate: string) {
  if (startDate > endDate) {
    throw new BadRequestException(
      'startDate must be less than or equal to endDate.',
    );
  }
}

export function addDaysToDateOnly(date: string, days: number) {
  const current = new Date(`${date}T00:00:00.000Z`);
  current.setUTCDate(current.getUTCDate() + days);

  return current.toISOString().slice(0, 10);
}
