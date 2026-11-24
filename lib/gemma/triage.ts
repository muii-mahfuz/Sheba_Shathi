import { ageFrom, fill, formatNumber, getDictionary, type Locale } from "@/lib/i18n";
import type {
  CreateTriageInput,
  HomeCareGuidance,
  Severity,
  Specialty,
  Urgency,
} from "@/lib/types";
import { matchConcepts, type SymptomConcept } from "./concepts";

/**
 * The deterministic triage engine.
 *
 * This is the *fallback* in the sense that a live Gemma call takes precedence
 * when one is configured — but it is not a stub. It is a real ordinal scoring
 * model over a bilingual symptom vocabulary, and it runs the entire product on
 * its own. That matters twice over: a judging demo never depends on someone
 * else's uptime, and a patient in a village with a bad connection still gets an
 * answer rather than a spinner.
 *
 * Scoring takes the *maximum* concept weight rather than the sum: three mild
 * complaints are still three mild complaints, and summing them would manufacture
 * urgency out of a talkative description.
 */

export interface TriageComputation {
  severity: Severity;
  urgency: Urgency;
  confidence: number;
  summary: string;
  redFlags: string[];
  recommendedSpecialties: Specialty[];
  suggestedTests: string[];
  homeCare?: HomeCareGuidance;
  /** Concept ids that fired, kept so the consultation insight can reuse them. */
  matchedConceptIds: string[];
}

export interface TriagePatientContext {
  dateOfBirth?: string;
  chronicConditions?: string[];
}

const URGENCY_BY_SEVERITY: Record<Severity, Urgency> = {
  mild: "self-care",
  moderate: "routine",
  severe: "urgent",
  critical: "emergency",
};

function severityFromScore(score: number): Severity {
  if (score <= 1) return "mild";
  if (score === 2) return "moderate";
  if (score === 3) return "severe";
  return "critical";
}

function rankedSpecialties(concepts: SymptomConcept[]): Specialty[] {
  const ordered = [...concepts].sort((a, b) => b.weight - a.weight);
  const out: Specialty[] = [];
  for (const concept of ordered) {
    for (const specialty of concept.specialties) {
      if (!out.includes(specialty)) out.push(specialty);
    }
  }
  if (out.length === 0) out.push("general-medicine");
  return out.slice(0, 3);
}

function homeCareFor(conceptIds: string[]): HomeCareGuidance {
  const steps = new Set<string>(["rest", "hydrate", "light-diet"]);
  const watchFor = new Set<string>(["breathing-difficulty", "symptoms-worsen-48h"]);

  if (conceptIds.includes("fever")) {
    steps.add("paracetamol-as-needed");
    steps.add("monitor-temperature");
    steps.add("isolate-from-others");
    watchFor.add("fever-above-39");
  }
  if (conceptIds.includes("cough") || conceptIds.includes("sore-throat")) {
    steps.add("warm-saline-gargle");
    steps.add("steam-inhalation");
    watchFor.add("chest-pain");
  }
  if (conceptIds.includes("diarrhoea") || conceptIds.includes("vomiting")) {
    steps.add("oral-rehydration");
    watchFor.add("persistent-vomiting");
    watchFor.add("severe-weakness");
  }
  if (conceptIds.includes("rash")) {
    watchFor.add("rash-appears");
  }
  if (conceptIds.includes("cough")) {
    steps.add("elevate-head");
  }

  return { steps: [...steps], watchFor: [...watchFor], reviewAfterHours: 48 };
}

function buildSummary(
  severity: Severity,
  concepts: SymptomConcept[],
  durationDays: number,
  locale: Locale,
): string {
  const t = getDictionary(locale);
  const labels = concepts
    .slice(0, 3)
    .map((c) => t.symptom[c.id as keyof typeof t.symptom])
    .filter(Boolean);

  const symptoms = labels.length > 0 ? labels.join(", ") : t.triageSummary.fallbackSymptoms;
  const days =
    durationDays === 1
      ? t.triageSummary.dayOne
      : fill(t.triageSummary.dayMany, { n: formatNumber(durationDays, locale) });

  return fill(t.triageSummary[severity], { symptoms, days });
}

export function runTriageRules(
  input: CreateTriageInput,
  patient: TriagePatientContext | undefined,
  locale: Locale,
): TriageComputation {
  const concepts = matchConcepts(input.description, input.symptoms);
  const conceptIds = concepts.map((c) => c.id);
  const redFlags = new Set<string>();

  // Base: the single most concerning thing described, not the pile of them.
  let score = concepts.reduce((max, c) => Math.max(max, c.weight), 0);
  if (score === 0) score = 1;

  for (const concept of concepts) {
    if (concept.redFlag) redFlags.add(concept.redFlag);
  }

  // A measured fever raises the score from 38.5, but only becomes a red flag at
  // 39 — the threshold for "worth a look" is lower than for "say this out loud".
  if (input.temperatureC !== undefined && input.temperatureC >= 38.5) {
    score += 1;
    if (input.temperatureC >= 39) redFlags.add("high-fever-persistent");
  }

  if (input.durationDays > 14) {
    score += 1;
    redFlags.add("prolonged-duration");
  } else if (input.durationDays > 7) {
    redFlags.add("prolonged-duration");
  }

  // Fluid loss from both ends dehydrates fast, especially in a hot climate.
  if (conceptIds.includes("vomiting") && conceptIds.includes("diarrhoea")) {
    score += 1;
    redFlags.add("severe-dehydration");
  }

  const age = patient?.dateOfBirth ? ageFrom(patient.dateOfBirth) : undefined;
  if (age !== undefined && age < 5 && conceptIds.includes("fever")) {
    score += 1;
    redFlags.add("infant-high-fever");
  }
  if (age !== undefined && age >= 65 && score >= 2) {
    score += 1;
  }

  const chronic = patient?.chronicConditions ?? [];
  if (chronic.length > 0 && score >= 2) {
    score += 1;
    redFlags.add("chronic-condition-risk");
  }

  const severity = severityFromScore(score);

  const tests = new Set<string>();
  for (const concept of concepts) {
    for (const test of concept.tests ?? []) tests.add(test);
  }

  // More matched concepts and a fuller description mean the engine is reading
  // signal rather than guessing; it never claims better than 0.9.
  const confidence = Math.min(
    0.9,
    0.45 + concepts.length * 0.08 + (input.description.trim().length > 80 ? 0.1 : 0),
  );

  return {
    severity,
    urgency: URGENCY_BY_SEVERITY[severity],
    confidence: Number(confidence.toFixed(2)),
    summary: buildSummary(severity, concepts, input.durationDays, locale),
    redFlags: [...redFlags],
    recommendedSpecialties: rankedSpecialties(concepts),
    suggestedTests: [...tests].slice(0, 4),
    homeCare: severity === "mild" ? homeCareFor(conceptIds) : undefined,
    matchedConceptIds: conceptIds,
  };
}
