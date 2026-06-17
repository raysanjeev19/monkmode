import {
  format,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  startOfWeek as sow,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isSameDay,
} from "date-fns";

/** Canonical date key used across the store: "yyyy-MM-dd" */
export const toISO = (d: Date): string => format(d, "yyyy-MM-dd");

export const todayISO = (): string => toISO(new Date());

export const fromISO = (iso: string): Date => parseISO(iso);

export const formatLong = (iso: string): string =>
  format(fromISO(iso), "EEEE, d MMMM");

export const formatShort = (iso: string): string =>
  format(fromISO(iso), "EEE d");

export const greeting = (): string => {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Good night";
};

/** 7 ISO date keys for the week containing `iso` (Mon start). */
export const weekDays = (iso: string): string[] => {
  const start = startOfWeek(fromISO(iso), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => toISO(addDays(start, i)));
};

/** Calendar grid (6 rows × 7) of ISO keys for the month containing `iso`. */
export const monthGrid = (iso: string): string[] => {
  const d = fromISO(iso);
  const gridStart = sow(startOfMonth(d), { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(d), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map(toISO);
};

export const monthLabel = (iso: string): string =>
  format(fromISO(iso), "MMMM yyyy");

export const isToday = (iso: string): boolean =>
  isSameDay(fromISO(iso), new Date());

export const shiftISO = (iso: string, days: number): string =>
  toISO(addDays(fromISO(iso), days));

export const lastNDays = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => toISO(addDays(new Date(), -(n - 1 - i))));
