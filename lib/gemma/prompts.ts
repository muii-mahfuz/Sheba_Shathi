import { LOCALE_TAGS, type Locale } from "@/lib/i18n";
import { SPECIALTIES, type CreateTriageInput, type ReportKind } from "@/lib/types";
import type { TriagePatientContext } from "./triage";

/**
 * Prompt templates for the Gemma calls.
 *
 * Two things every prompt here does deliberately:
 *
 * 1. It asks for JSON against a named schema, because the response is parsed
 *    and validated (lib/gemma/index.ts) rather than shown raw. A model that
 *    answers in prose is treated as a failure and falls through to the rules.
 * 2. It states the reader's language, so model-written prose — the one part of
 *    the output that isn't a dictionary code — comes back already in Bangla or
 *    English rather than being translated afterwards.
 */

const SAFETY_PREAMBLE = `You are a triage assistant for a telemedicine service in Bangladesh.
You are not a doctor and you never present your output as a diagnosis. A licensed
doctor reviews everything you produce before it reaches a patient. When the
information is thin, say so through a lower confidence rather than inventing detail.
Err towards a higher severity when the presentation is ambiguous.`;

function languageLine(locale: Locale): string {
  return `Write every free-text field in ${locale === "bn" ? "Bengali (Bangla)" : "English"} (${LOCALE_TAGS[locale]}). Field names and enum values stay in English.`;
}

export function triagePrompt(
  input: CreateTriageInput,
  patient: TriagePatientContext | undefined,
  locale: Locale,
): string {
  const history = [
    patient?.dateOfBirth ? `Date of birth: ${patient.dateOfBirth}` : null,
    patient?.chronicConditions?.length
      ? `Existing conditions: ${patient.chronicConditions.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `${SAFETY_PREAMBLE}

${languageLine(locale)}

Patient's own description:
"""
${input.description}
"""

Symptoms they selected: ${input.symptoms.join(", ") || "none"}
Duration: ${input.durationDays} days
${input.temperatureC !== undefined ? `Measured temperature: ${input.temperatureC}°C` : "Temperature not measured"}
${history || "No medical history on file."}

Return ONLY a JSON object:
{
  "severity": "mild" | "moderate" | "severe" | "critical",
  "urgency": "self-care" | "routine" | "urgent" | "emergency",
  "confidence": number between 0 and 1,
  "summary": "two sentences restating what you understood, addressed to the patient",
  "redFlags": string[],   // short phrases naming what is concerning; empty if nothing is
  "recommendedSpecialties": string[],  // from: ${SPECIALTIES.join(", ")}
  "suggestedTests": string[],
  "homeCare": null | {
    "steps": string[],          // what to do at home
    "watchFor": string[],       // what should send them back to a doctor
    "reviewAfterHours": number
  }
}

"homeCare" must be null unless severity is "mild".`;
}

export function insightPrompt(
  chiefComplaint: string,
  transcript: string,
  reportImpressions: string[],
  locale: Locale,
): string {
  return `${SAFETY_PREAMBLE}

You are assisting the doctor during a live consultation, not the patient. Your
output is advisory and the doctor edits it before anything is prescribed.

${languageLine(locale)}

Chief complaint: ${chiefComplaint}

Conversation so far:
"""
${transcript}
"""

${reportImpressions.length ? `Report findings already available:\n${reportImpressions.map((i) => `- ${i}`).join("\n")}` : "No reports uploaded."}

Return ONLY a JSON object:
{
  "differentials": [{ "condition": string, "likelihood": number between 0 and 1 }],
  "suggestedTests": string[],
  "suggestedMedicines": [{
    "name": string,            // generic name only, never a brand
    "strength": string,
    "form": "tablet" | "capsule" | "syrup" | "injection" | "drops" | "inhaler" | "ointment",
    "frequency": "once-daily" | "twice-daily" | "thrice-daily" | "four-times-daily" | "every-6h" | "every-8h" | "as-needed" | "at-bedtime",
    "durationDays": number,
    "instruction": string,
    "rationale": string        // one sentence on why, for the doctor to judge
  }],
  "notes": "what you would ask next, in one or two sentences"
}

Prefer symptomatic treatment. Leave antibiotic and steroid decisions to the doctor
unless a report finding already supports one.`;
}

export function reportPrompt(kind: ReportKind, locale: Locale): string {
  return `${SAFETY_PREAMBLE}

Read the attached ${kind} image or report for the doctor reviewing it.

${languageLine(locale)}

Return ONLY a JSON object:
{
  "region": "anatomical region or panel name",
  "findings": [{
    "label": string,
    "confidence": number between 0 and 1,
    "box": null | { "x": number, "y": number, "w": number, "h": number }
  }],
  "impression": "one or two sentences",
  "severity": "mild" | "moderate" | "severe" | "critical",
  "followUp": string[],
  "suggestedMedicines": [{ "name": string, "strength": string, "form": string, "frequency": string, "durationDays": number, "rationale": string }]
}

"box" is a normalized rectangle over the image (0–1 from the top-left) marking
where the finding is. Give a box for every finding you can localise, and null for
findings that are global or come from a text report.`;
}
