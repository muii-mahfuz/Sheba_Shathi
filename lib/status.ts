import type { ConsultationStatus, Severity, StatusTone, Urgency } from "@/lib/types";

/**
 * Maps every domain status onto the presentation tones defined in globals.css.
 * Keeping this in one module is what stops a severity being amber on one screen
 * and orange on the next.
 */

/** Severity is already a tone — the scale was designed that way. */
export function severityTone(severity: Severity): StatusTone {
  return severity;
}

export function urgencyTone(urgency: Urgency): StatusTone {
  switch (urgency) {
    case "self-care":
      return "mild";
    case "routine":
      return "moderate";
    case "urgent":
      return "severe";
    case "emergency":
      return "critical";
  }
}

export function consultationTone(status: ConsultationStatus): StatusTone {
  switch (status) {
    case "requested":
      return "pending";
    case "accepted":
      return "pending";
    case "active":
      return "live";
    case "completed":
      return "done";
    case "declined":
    case "cancelled":
      return "off";
  }
}

/** Tailwind classes per tone. Soft background + solid text, always paired. */
export const TONE_CLASSES: Record<StatusTone, string> = {
  mild: "bg-mild-soft text-mild",
  moderate: "bg-moderate-soft text-moderate",
  severe: "bg-severe-soft text-severe",
  critical: "bg-critical-soft text-critical",
  live: "bg-live-soft text-live",
  pending: "bg-pending-soft text-pending",
  done: "bg-done-soft text-done",
  off: "bg-off-soft text-off",
};

/** Solid fills, for the triage spine's active rung and other emphatic marks. */
export const TONE_SOLID: Record<StatusTone, string> = {
  mild: "bg-mild text-white",
  moderate: "bg-moderate text-white",
  severe: "bg-severe text-white",
  critical: "bg-critical text-white",
  live: "bg-live text-white",
  pending: "bg-pending text-white",
  done: "bg-done text-white",
  off: "bg-off text-white",
};

/** A coarse confidence band. A bare "0.73" implies a precision nobody has. */
export function confidenceBand(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.55) return "medium";
  return "low";
}
