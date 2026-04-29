import type { ISODateString } from "../types/common";

export function nowISO(): ISODateString {
  return new Date().toISOString();
}

export function toISODateString(date: Date | string): ISODateString {
  return typeof date === "string" ? new Date(date).toISOString() : date.toISOString();
}

export function sortByNewest<T extends { happenedAt?: string; createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const left = a.happenedAt ?? a.createdAt;
    const right = b.happenedAt ?? b.createdAt;
    return right.localeCompare(left);
  });
}
