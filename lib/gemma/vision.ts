import type { ReportAnalysis, ReportKind, SuggestedMedicine } from "@/lib/types";

/**
 * Report reading — the vision half of the AI layer.
 *
 * Scenarios are picked by hashing the file name, so the same upload always
 * reads the same way (a demo that changes its mind on re-upload looks broken)
 * while different uploads produce genuinely different findings.
 *
 * Image findings carry a normalized bounding box. Telling a doctor "right lower
 * zone" and telling them *where on this image* are different acts, and the
 * second is the one that lets them disagree with the model.
 */

interface Scenario {
  region: string;
  findings: { label: string; confidence: number; box?: { x: number; y: number; w: number; h: number } }[];
  impression: string;
  severity: ReportAnalysis["severity"];
  followUp: string[];
  medicines: SuggestedMedicine[];
}

function med(
  name: string,
  strength: string,
  form: SuggestedMedicine["form"],
  frequency: string,
  durationDays: number,
  rationale: string,
  instruction?: string,
): SuggestedMedicine {
  return { name, strength, form, frequency, durationDays, rationale, instruction };
}

const SCENARIOS: Record<ReportKind, Scenario[]> = {
  xray: [
    {
      region: "Chest — PA view",
      findings: [
        {
          label: "Patchy consolidation, right lower zone",
          confidence: 0.81,
          // A PA film is read as if facing the patient, so their right lung sits
          // on the viewer's left. The box has to follow the convention, not the word.
          box: { x: 0.2, y: 0.54, w: 0.24, h: 0.22 },
        },
        { label: "Costophrenic angles clear", confidence: 0.88 },
        { label: "Cardiac silhouette within normal limits", confidence: 0.85 },
      ],
      impression: "Appearances favour right lower lobe community-acquired pneumonia.",
      severity: "severe",
      followUp: ["start-treatment", "repeat-imaging-2w"],
      medicines: [
        med(
          "Amoxicillin",
          "500 mg",
          "capsule",
          "thrice-daily",
          7,
          "First-line cover for community-acquired pneumonia in an outpatient.",
          "After food",
        ),
        med("Paracetamol", "500 mg", "tablet", "thrice-daily", 5, "For fever and pleuritic discomfort.", "After food"),
      ],
    },
    {
      region: "Chest — PA view",
      findings: [
        { label: "Bilateral lung fields clear", confidence: 0.9 },
        { label: "No focal consolidation", confidence: 0.87 },
        { label: "Mild bronchovascular prominence", confidence: 0.52, box: { x: 0.34, y: 0.4, w: 0.3, h: 0.2 } },
      ],
      impression: "No acute cardiopulmonary abnormality. Findings are non-specific.",
      severity: "mild",
      followUp: ["clinical-correlation", "no-action"],
      medicines: [],
    },
    {
      region: "Chest — PA view",
      findings: [
        {
          label: "Hyperinflated lung fields with flattened diaphragm",
          confidence: 0.74,
          box: { x: 0.18, y: 0.58, w: 0.64, h: 0.22 },
        },
        { label: "No consolidation or effusion", confidence: 0.83 },
      ],
      impression: "Hyperinflation, in keeping with an obstructive airway pattern.",
      severity: "moderate",
      followUp: ["specialist-referral", "clinical-correlation"],
      medicines: [
        med(
          "Salbutamol",
          "100 mcg/puff",
          "inhaler",
          "as-needed",
          30,
          "Rescue bronchodilator pending formal spirometry.",
          "Two puffs when breathless",
        ),
      ],
    },
  ],
  ct: [
    {
      region: "CT brain — plain",
      findings: [
        { label: "No acute intracranial haemorrhage", confidence: 0.91 },
        { label: "Age-related cerebral atrophy", confidence: 0.63, box: { x: 0.3, y: 0.24, w: 0.4, h: 0.34 } },
      ],
      impression: "No acute intracranial event. Atrophy is age-appropriate.",
      severity: "mild",
      followUp: ["clinical-correlation"],
      medicines: [],
    },
  ],
  mri: [
    {
      region: "MRI lumbar spine",
      findings: [
        {
          label: "L4–L5 disc bulge with thecal sac indentation",
          confidence: 0.77,
          box: { x: 0.44, y: 0.56, w: 0.22, h: 0.16 },
        },
        { label: "No cord signal abnormality", confidence: 0.86 },
      ],
      impression: "L4–L5 disc bulge; correlate with the distribution of leg pain.",
      severity: "moderate",
      followUp: ["specialist-referral", "clinical-correlation"],
      medicines: [
        med("Diclofenac", "50 mg", "tablet", "twice-daily", 7, "Short anti-inflammatory course for radicular pain.", "After food"),
      ],
    },
  ],
  ultrasound: [
    {
      region: "Ultrasound — whole abdomen",
      findings: [
        {
          label: "Multiple echogenic foci in gallbladder lumen",
          confidence: 0.79,
          box: { x: 0.36, y: 0.34, w: 0.22, h: 0.2 },
        },
        { label: "Normal liver echotexture", confidence: 0.85 },
        { label: "No free fluid", confidence: 0.88 },
      ],
      impression: "Cholelithiasis without evidence of acute cholecystitis.",
      severity: "moderate",
      followUp: ["specialist-referral", "clinical-correlation"],
      medicines: [
        med("Omeprazole", "20 mg", "capsule", "once-daily", 14, "Symptomatic relief while surgical review is arranged.", "Before breakfast"),
      ],
    },
  ],
  blood: [
    {
      region: "Complete blood count with ESR",
      findings: [
        { label: "Platelet count 118 × 10⁹/L — below reference range", confidence: 0.94 },
        { label: "Haematocrit 46% — upper limit", confidence: 0.81 },
        { label: "Leukocyte count within range", confidence: 0.9 },
      ],
      impression:
        "Thrombocytopenia with borderline haemoconcentration. In a febrile patient this pattern is compatible with dengue.",
      severity: "severe",
      followUp: ["further-bloodwork", "clinical-correlation"],
      medicines: [
        med(
          "Paracetamol",
          "500 mg",
          "tablet",
          "thrice-daily",
          3,
          "Antipyretic of choice — NSAIDs are contraindicated while dengue is suspected.",
          "After food",
        ),
      ],
    },
    {
      region: "Complete blood count with ESR",
      findings: [
        { label: "Neutrophilic leukocytosis, 13.8 × 10⁹/L", confidence: 0.89 },
        { label: "ESR 48 mm in 1st hour — raised", confidence: 0.85 },
      ],
      impression: "Findings suggest an acute bacterial infection.",
      severity: "moderate",
      followUp: ["start-treatment", "clinical-correlation"],
      medicines: [
        med("Cefixime", "400 mg", "capsule", "twice-daily", 7, "Empirical cover pending a culture result.", "After food"),
      ],
    },
  ],
  ecg: [
    {
      region: "12-lead ECG",
      findings: [
        { label: "Sinus rhythm, rate 78/min", confidence: 0.93 },
        { label: "No ST-segment deviation", confidence: 0.86 },
        { label: "Normal axis and intervals", confidence: 0.88 },
      ],
      impression: "Normal ECG. A normal tracing does not exclude ischaemia — serial tracings if pain persists.",
      severity: "mild",
      followUp: ["clinical-correlation"],
      medicines: [],
    },
  ],
  other: [
    {
      region: "Uploaded report",
      findings: [{ label: "Document received; no structured values extracted", confidence: 0.4 }],
      impression: "This format could not be read reliably. Read the report alongside the patient's history.",
      severity: "mild",
      followUp: ["clinical-correlation"],
      medicines: [],
    },
  ],
};

/** Stable non-cryptographic hash, so a given file always reads the same way. */
function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function analyzeReportRules(kind: ReportKind, fileName: string): ReportAnalysis {
  const scenarios = SCENARIOS[kind] ?? SCENARIOS.other;
  const scenario = scenarios[hash(fileName) % scenarios.length];

  return {
    region: scenario.region,
    findings: scenario.findings,
    impression: scenario.impression,
    severity: scenario.severity,
    suggestedMedicines: scenario.medicines,
    followUp: scenario.followUp,
    model: "rule-based",
    source: "fallback",
    analyzedAt: new Date().toISOString(),
  };
}
