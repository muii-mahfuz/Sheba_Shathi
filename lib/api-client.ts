import { LOCALE_COOKIE, resolveLocale, type Locale } from "@/lib/i18n";
import { getAuthUserId } from "@/store/session";

/**
 * The single choke point for all data fetching. Today it talks to the MSW mock
 * (same-origin /api). To point at the real backend later, set
 * NEXT_PUBLIC_API_BASE and NEXT_PUBLIC_API_MOCKING=disabled — nothing else in
 * the app changes.
 */
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

/** Mocking is opt-out: on unless explicitly disabled. */
export const API_MOCKING = process.env.NEXT_PUBLIC_API_MOCKING !== "disabled";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** The reader's language, sent so model-written prose comes back translated at source. */
function activeLocale(): Locale {
  if (typeof document === "undefined") return resolveLocale(undefined);
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return resolveLocale(match ? decodeURIComponent(match[1]) : undefined);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const userId = getAuthUserId();

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "accept-language": activeLocale(),
      // Stand-in for auth during the mock phase; swap for a bearer token later.
      ...(userId ? { "x-sheba-user": userId } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let code = "error";
    let message = res.statusText;
    try {
      const body = await res.json();
      code = body.error ?? code;
      message = body.message ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

/** Build a querystring from a params object, skipping empty values. */
export function qs(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
