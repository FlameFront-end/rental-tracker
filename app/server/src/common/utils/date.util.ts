import { BadRequestException } from '@nestjs/common';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_IN_DAY = 1000 * 60 * 60 * 24;

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

export function getCurrentDateOnly(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getDateOnlyDiffDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return Math.round((end.getTime() - start.getTime()) / MS_IN_DAY);
}

export function buildDateOnlyRange(startDate: string, endDate: string) {
  assertDateRange(startDate, endDate);

  const diffDays = getDateOnlyDiffDays(startDate, endDate);

  return Array.from({ length: diffDays + 1 }, (_, index) =>
    addDaysToDateOnly(startDate, index),
  );
}
