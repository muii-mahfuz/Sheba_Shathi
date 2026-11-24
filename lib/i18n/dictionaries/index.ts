import type { Locale } from "../config";
import { en } from "./en";
import { bn } from "./bn";

/**
 * The English dictionary defines the contract. `en` is deliberately *not*
 * `as const` — widening its values to `string` is what lets `bn` be typed as a
 * `Dictionary` and checked key-for-key against it.
 */
export type Dictionary = typeof en;

const DICTIONARIES: Record<Locale, Dictionary> = { en, bn };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}
