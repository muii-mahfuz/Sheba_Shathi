import { z } from "zod";
import type { Locale } from "@/lib/i18n";
import {
  SPECIALTIES,
  type AiInsight,
  type AiSource,
  type CreateTriageInput,
  type ReportAnalysis,
  type ReportKind,
  type Specialty,
} from "@/lib/types";
import { callGemma, GEMMA_MODEL, isModelConfigured, parseJsonResponse } from "./client";
import { buildInsight, type InsightInput } from "./insight";
import { insightPrompt, reportPrompt, triagePrompt } from "./prompts";
import { runTriageRules, type TriageComputation, type TriagePatientContext } from "./triage";
import { analyzeReportRules } from "./vision";

export { GEMMA_MODEL, isModelConfigured } from "./client";
export { COMMON_SYMPTOM_IDS, SYMPTOM_CONCEPTS, conceptById, matchConcepts } from "./concepts";
export type { TriageComputation } from "./triage";

/**
 * The public AI surface. Every function here follows the same shape: try the
 * model, validate what comes back, and fall through to the deterministic engine
 * on any doubt. `source` on the result says which path ran, and the UI shows it
 * — a clinical suggestion that quietly degraded would be worse than one that
 * admits what produced it.
 *
 * Validation is strict on purpose. A model that returns a severity outside the
 * scale, or prose where JSON was asked for, is not a partial success to be
 * patched up; it is a failed call, and the rules are better than a guess.
 */

const severitySchema = z.enum(["mild", "moderate", "severe", "critical"]);
const urgencySchema = z.enum(["self-care", "routine", "urgent", "emergency"]);

const medicineSchema = z.object({
  name: z.string().min(1),
  strength: z.string().min(1),
  form: z.enum(["tablet", "capsule", "syrup", "injection", "drops", "inhaler", "ointment"]),
  frequency: z.string().min(1),
  durationDays: z.number().int().min(1).max(90),
  instruction: z.string().optional(),
  rationale: z.string().min(1),
});

const triageSchema = z.object({
  severity: severitySchema,
  urgency: urgencySchema,
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  redFlags: z.array(z.string()),
  recommendedSpecialties: z.array(z.string()),
  suggestedTests: z.array(z.string()),
  homeCare: z
    .object({
      steps: z.array(z.string()),
      watchFor: z.array(z.string()),
      reviewAfterHours: z.number().min(1),
    })
    .nullable()
    .optional(),
});

const insightSchema = z.object({
  differentials: z.array(z.object({ condition: z.string().min(1), likelihood: z.number().min(0).max(1) })),
  suggestedTests: z.array(z.string()),
  suggestedMedicines: z.array(medicineSchema),
  notes: z.string(),
});

const analysisSchema = z.object({
  region: z.string().min(1),
  findings: z.array(
    z.object({
      label: z.string().min(1),
      confidence: z.number().min(0).max(1),
      box: z
        .object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
        .nullable()
        .optional(),
    }),
  ),
  impression: z.string().min(1),
  severity: severitySchema,
  followUp: z.array(z.string()),
  suggestedMedicines: z.array(medicineSchema).optional(),
});

/** Run a prompt and validate the JSON, returning null unless everything holds. */
async function askModel<T>(prompt: string, schema: z.ZodType<T>): Promise<T | null> {
  if (!isModelConfigured()) return null;
  const text = await callGemma(prompt);
  if (!text) return null;
  const parsed = parseJsonResponse(text);
  if (parsed === null) return null;
  const result = schema.safeParse(parsed);
  return result.success ? result.data : null;
}

/**
 * Map the model's free-text specialty names onto our closed vocabulary. Anything
 * it invents is dropped rather than passed through, since the value feeds doctor
 * matching; if nothing survives, the rules' answer stands.
 */
function toSpecialties(raw: string[], fallback: Specialty[]): Specialty[] {
  const normalized = raw.map((r) => r.toLowerCase().trim().replace(/\s+/g, "-"));
  const matched = SPECIALTIES.filter((s) =>
    normalized.some((n) => n === s || n.includes(s) || s.includes(n)),
  );
  return matched.length > 0 ? matched.slice(0, 3) : fallback;
}

export interface TriageOutcome extends TriageComputation {
  model: string;
  source: AiSource;
}

export async function assessTriage(
  input: CreateTriageInput,
  patient: TriagePatientContext | undefined,
  locale: Locale,
): Promise<TriageOutcome> {
  const rules = runTriageRules(input, patient, locale);

  const fromModel = await askModel(triagePrompt(input, patient, locale), triageSchema);
  if (fromModel) {
    return {
      severity: fromModel.severity,
      urgency: fromModel.urgency,
      confidence: fromModel.confidence,
      summary: fromModel.summary,
      redFlags: fromModel.redFlags,
      recommendedSpecialties: toSpecialties(
        fromModel.recommendedSpecialties,
        rules.recommendedSpecialties,
      ),
      suggestedTests: fromModel.suggestedTests,
      homeCare:
        fromModel.severity === "mild" ? (fromModel.homeCare ?? rules.homeCare) : undefined,
      matchedConceptIds: rules.matchedConceptIds,
      model: GEMMA_MODEL,
      source: "model",
    };
  }

  return { ...rules, model: "rule-based", source: "fallback" };
}

export async function computeInsight(input: InsightInput, locale: Locale): Promise<AiInsight> {
  const transcript = input.messages
    .filter((m) => m.authorRole !== "system")
    .map((m) => `${m.authorRole}: ${m.body}`)
    .join("\n");

  const impressions = input.reports
    .map((r) => r.analysis?.impression)
    .filter((i): i is string => Boolean(i));

  const fromModel = await askModel(
    insightPrompt(input.chiefComplaint, transcript, impressions, locale),
    insightSchema,
  );

  if (fromModel) {
    return {
      differentials: fromModel.differentials,
      suggestedTests: fromModel.suggestedTests,
      suggestedMedicines: fromModel.suggestedMedicines,
      notes: fromModel.notes,
      source: "model",
      updatedAt: new Date().toISOString(),
    };
  }

  return buildInsight(input);
}

export async function analyzeReport(
  kind: ReportKind,
  fileName: string,
  locale: Locale,
): Promise<ReportAnalysis> {
  const fromModel = await askModel(reportPrompt(kind, locale), analysisSchema);

  if (fromModel) {
    return {
      region: fromModel.region,
      findings: fromModel.findings.map((f) => ({
        label: f.label,
        confidence: f.confidence,
        box: f.box ?? undefined,
      })),
      impression: fromModel.impression,
      severity: fromModel.severity,
      suggestedMedicines: fromModel.suggestedMedicines ?? [],
      followUp: fromModel.followUp,
      model: GEMMA_MODEL,
      source: "model",
      analyzedAt: new Date().toISOString(),
    };
  }

  return analyzeReportRules(kind, fileName);
}
