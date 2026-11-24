/**
 * The Gemma transport.
 *
 * Everything about this module is built around one assumption: the call will
 * sometimes fail, and when it does the product must keep working. So it has a
 * hard timeout, it never throws at the caller, and it returns `null` for every
 * failure mode — no key, network error, non-200, unparseable body. The decision
 * about what to do instead belongs to the caller, which falls back to the rule
 * engine in lib/gemma/index.ts.
 */

/** Set `GEMMA_API_KEY` to route through the live model; leave it unset to run on rules. */
const API_KEY = process.env.NEXT_PUBLIC_GEMMA_API_KEY ?? "";

export const GEMMA_MODEL = process.env.NEXT_PUBLIC_GEMMA_MODEL ?? "gemma-3-27b-it";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** A slow answer during a consultation is a failed answer. */
const TIMEOUT_MS = 8_000;

export function isModelConfigured(): boolean {
  return API_KEY.length > 0;
}

export interface GemmaImage {
  /** Base64 payload without the data-URL prefix. */
  data: string;
  mimeType: string;
}

/**
 * Call Gemma and return the raw text of the first candidate, or `null` on any
 * failure. Callers parse and validate; nothing here trusts the response.
 */
export async function callGemma(prompt: string, image?: GemmaImage): Promise<string | null> {
  if (!isModelConfigured()) return null;

  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (image) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${ENDPOINT}/${GEMMA_MODEL}:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          // Clinical output should be reproducible: the same description twice
          // should not produce two different severities.
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const body = await res.json();
    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" ? text : null;
  } catch {
    // Aborted, offline, DNS failure, malformed JSON — all the same to the caller.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Parse a model response that was asked for JSON, tolerating ```json fences. */
export function parseJsonResponse(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}
