import type { ISODateString } from "../types/common";
import type { LocalDateString } from "../features/day/types";

export function nowISO(): ISODateString {
  return new Date().toISOString();
}

export function todayLocalDate(): LocalDateString {
  return toLocalDateString(new Date());
}

export function addLocalDays(date: LocalDateString, days: number): LocalDateString {
  const cursor = fromLocalDateString(date);
  cursor.setDate(cursor.getDate() + days);
  return toLocalDateString(cursor);
}

export function isLocalDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && toLocalDateString(parsed) === value;
}

export function toLocalDateString(date: Date | string): LocalDateString {
  const value = typeof date === "string" ? new Date(date) : date;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function fromLocalDateString(date: LocalDateString): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toISODateString(date: Date | string): ISODateString {
  return typeof date === "string" ? new Date(date).toISOString() : date.toISOString();
}

export function toDateTimeLocalValue(value: Date | string = new Date()): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

export function toDateTimeLocalValueForDate(
  date: LocalDateString,
  timeSource: Date = new Date(),
): string {
  return toDateTimeLocalValue(createDateWithLocalTime(date, timeSource));
}

export function fromDateTimeLocalValue(value: string): ISODateString {
  return new Date(value).toISOString();
}

export function toISOWithLocalDateTime(
  date: LocalDateString,
  timeSource: Date = new Date(),
): ISODateString {
  return createDateWithLocalTime(date, timeSource).toISOString();
}

export function sortByNewest<T extends { happenedAt?: string; createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.happenedAt ?? a.createdAt;
    const right = b.happenedAt ?? b.createdAt;
    return right.localeCompare(left);
  });
}

function createDateWithLocalTime(date: LocalDateString, timeSource: Date): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(
    year,
    month - 1,
    day,
    timeSource.getHours(),
    timeSource.getMinutes(),
    timeSource.getSeconds(),
    timeSource.getMilliseconds(),
  );
}
