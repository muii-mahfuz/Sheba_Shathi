import type { Money } from "@/lib/types";
import { LOCALE_TAGS, type Locale } from "./config";

/**
 * Locale-aware formatting.
 *
 * Bangla gets Bengali numerals for everything a reader just *reads* — dates,
 * counts, money. Clinical numbers are the deliberate exception: a dose, a
 * temperature, or a blood pressure is transcribed onto a pharmacy counter or
 * read back to a nurse, so those stay in Latin digits in both languages. See
 * `clinical()` below.
 */

/**
 * Fill `{name}`-style placeholders in a dictionary string. Templates carry the
 * placeholders so each language can order the parts its own way — Bangla puts
 * the verb last, and a concatenated string could never do that.
 */
export function fill(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  );
}

export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

/** "2 hours ago" / "২ ঘণ্টা আগে". Falls back to `justNow` under a minute. */
export function formatRelative(iso: string, locale: Locale, justNow: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60_000) return justNow;

  const rtf = new Intl.RelativeTimeFormat(LOCALE_TAGS[locale], { numeric: "auto" });
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  }
  return justNow;
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale]).format(value);
}

export function formatMoney(money: Money, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAGS[locale], {
    style: "currency",
    currency: money.currency,
    maximumFractionDigits: 0,
  }).format(money.amount);
}

/**
 * A number that will be transcribed rather than read — a dose, a temperature, a
 * count of days on a prescription. Always Latin digits, in both languages.
 */
export function clinical(value: number | string): string {
  return String(value);
}

/** Whole years, from a date of birth. */
export function ageFrom(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

/** "1.4 MB" — file sizes are utility text, so Latin digits in both languages. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Minutes elapsed, rendered as "12:04" for a live consultation timer. */
export function formatElapsed(fromIso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(fromIso).getTime()) / 1000));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
