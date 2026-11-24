import { LOCALE_COOKIE, resolveLocale, type Locale } from "@/lib/i18n";
import { seedDb, type MockDb } from "./data";

/**
 * The mock store.
 *
 * Backed by localStorage so a refresh mid-consultation doesn't wipe the
 * conversation — during a live demo that difference matters more than it looks.
 * Bump `SCHEMA_VERSION` whenever the seed shape changes; a stale blob in
 * someone's browser is otherwise indistinguishable from a bug.
 */

const STORAGE_KEY = "sheba-mock-db";
const SCHEMA_VERSION = 1;

interface StoredDb {
  version: number;
  locale: Locale;
  db: MockDb;
}

let cache: MockDb | null = null;

/** The locale to seed model-written prose in, read from the same cookie the UI uses. */
function currentLocale(): Locale {
  if (typeof document === "undefined") return resolveLocale(undefined);
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return resolveLocale(match ? decodeURIComponent(match[1]) : undefined);
}

function load(): MockDb {
  const locale = currentLocale();

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as StoredDb;
        // Reseed when the language changed, so seeded summaries match the UI.
        if (stored.version === SCHEMA_VERSION && stored.locale === locale) return stored.db;
      }
    } catch {
      /* corrupt or unavailable storage — fall through and reseed */
    }
  }

  const fresh = seedDb(locale);
  save(fresh, locale);
  return fresh;
}

function save(db: MockDb, locale: Locale = currentLocale()): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDb = { version: SCHEMA_VERSION, locale, db };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota or private mode — the in-memory copy still works for this session */
  }
}

export function getDb(): MockDb {
  cache ??= load();
  return cache;
}

/** Call after any mutation so the change survives a refresh. */
export function commit(): void {
  if (cache) save(cache);
}

/** Wipe and reseed — used by the demo's reset control. */
export function resetDb(): MockDb {
  cache = seedDb(currentLocale());
  save(cache);
  return cache;
}

let counter = 0;

/** Readable ids, so a URL in a screenshot still says what it points at. */
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}
