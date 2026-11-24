import type { AiSource, ID, ISODateString } from "./common";
import type { Specialty } from "./doctor";

/** The ordinal spine of the product. Order matters — the UI renders it as a ladder. */
export type Severity = "mild" | "moderate" | "severe" | "critical";

export const SEVERITY_ORDER: readonly Severity[] = ["mild", "moderate", "severe", "critical"] as const;

/** What the patient should do about it, which is not quite the same as how bad it is. */
export type Urgency = "self-care" | "routine" | "urgent" | "emergency";

export type IntakeMode = "text" | "voice" | "image";

export interface SymptomIntake {
  /** The patient's own words. Kept verbatim — the doctor reads this too. */
  description: string;
  /** Structured symptom tags, either picked by the patient or extracted by the model. */
  symptoms: string[];
  durationDays: number;
  temperatureC?: number;
  mode: IntakeMode;
  attachmentUrls?: string[];
}

/**
 * Home-care guidance, only ever attached to a mild assessment.
 * `watchFor` is the escalation contract: if any of these appear, come back.
 */
export interface HomeCareGuidance {
  /** Dictionary codes, not prose — so the same rule speaks either language. */
  steps: string[];
  watchFor: string[];
  reviewAfterHours: number;
}

export interface TriageAssessment {
  id: ID;
  patientId: ID;
  intake: SymptomIntake;
  severity: Severity;
  urgency: Urgency;
  /** 0–1. Shown to the patient as a coarse band, never as a bare percentage. */
  confidence: number;
  /**
   * Plain-language restatement of what was understood, in the reader's
   * language. Model-generated prose is produced per-locale at call time, which
   * is why this is a string while `redFlags` below are codes.
   */
  summary: string;
  /** Dictionary codes for the rules that fired. */
  redFlags: string[];
  recommendedSpecialties: Specialty[];
  suggestedTests: string[];
  homeCare?: HomeCareGuidance;
  model: string;
  source: AiSource;
  createdAt: ISODateString;
}

export interface CreateTriageInput {
  description: string;
  symptoms: string[];
  durationDays: number;
  temperatureC?: number;
  mode: IntakeMode;
  attachmentUrls?: string[];
}
