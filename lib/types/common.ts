/**
 * Shared primitives used across the Sheba Shathi domain model.
 * Both the mock layer and the real API conform to these shapes.
 */

export type ID = string;

/** ISO-8601 timestamp, e.g. "2026-07-26T10:00:00Z". Kept as string for JSON parity. */
export type ISODateString = string;

export type CurrencyCode = "BDT";

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Presentation-level grouping for record states. The first four are the
 * severity scale — the ordinal spine the whole product branches on — and the
 * rest are lifecycle states. Drives StatusBadge colors; see lib/status.ts.
 */
export type StatusTone =
  | "mild"
  | "moderate"
  | "severe"
  | "critical"
  | "live"
  | "pending"
  | "done"
  | "off";

/**
 * Where a piece of AI output came from. Every model call in this app has a
 * deterministic fallback, and the UI always says which one the reader is
 * looking at — an AI-assisted clinical suggestion that silently degrades to a
 * rule of thumb would be worse than one that admits it.
 */
export type AiSource = "model" | "fallback";
