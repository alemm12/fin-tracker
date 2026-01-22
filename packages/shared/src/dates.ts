import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export function getCurrentMonth(): string {
  return dayjs().format('YYYY-MM');
}

export function getMonthFromDate(date: string): string {
  return dayjs(date).format('YYYY-MM');
}

export function getStartOfMonth(month: string): string {
  return dayjs(month).startOf('month').toISOString();
}

export function getEndOfMonth(month: string): string {
  return dayjs(month).endOf('month').toISOString();
}

export function isValidDate(date: string): boolean {
  return dayjs(date).isValid();
}

export function formatDate(date: string, format: string = 'YYYY-MM-DD'): string {
  return dayjs(date).format(format);
}
