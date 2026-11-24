import type { AiInsight, MedicalReport } from "@/lib/types";
import { isNsaid, suggestionsForConcepts } from "@/lib/medicines";
import { matchConcepts } from "./concepts";

/**
 * The running clinical picture shown to the doctor during a consultation.
 *
 * Differentials come from a rule table rather than a single generic list,
 * because the useful part of a differential is that it is specific: "viral
 * fever, dengue, typhoid" is worth reading in Dhaka in a way that "infection"
 * never is. Rules are ordered most-specific first and the first match wins.
 */

interface DifferentialRule {
  /** Every concept id here must be present for the rule to fire. */
  requires: string[];
  differentials: { condition: string; likelihood: number }[];
  tests: string[];
  notes: string;
}

const DIFFERENTIAL_RULES: DifferentialRule[] = [
  {
    requires: ["chest-pain", "breathlessness"],
    differentials: [
      { condition: "Acute coronary syndrome", likelihood: 0.45 },
      { condition: "Pulmonary embolism", likelihood: 0.2 },
      { condition: "Anxiety with hyperventilation", likelihood: 0.2 },
      { condition: "Musculoskeletal chest pain", likelihood: 0.15 },
    ],
    tests: ["ECG", "Troponin I", "Chest X-ray"],
    notes:
      "Chest pain with breathlessness is cardiac until proven otherwise. An ECG within 10 minutes changes what happens next.",
  },
  {
    requires: ["chest-pain"],
    differentials: [
      { condition: "Gastro-oesophageal reflux", likelihood: 0.35 },
      { condition: "Stable angina", likelihood: 0.3 },
      { condition: "Musculoskeletal chest pain", likelihood: 0.35 },
    ],
    tests: ["ECG", "Troponin I"],
    notes: "Ask what brings the pain on and what relieves it — exertion versus food separates these quickly.",
  },
  {
    requires: ["cough", "breathlessness"],
    differentials: [
      { condition: "Community-acquired pneumonia", likelihood: 0.4 },
      { condition: "Acute bronchitis", likelihood: 0.3 },
      { condition: "Asthma exacerbation", likelihood: 0.3 },
    ],
    tests: ["Chest X-ray", "Pulse oximetry", "CBC with ESR"],
    notes: "Ask about wheeze, night symptoms, and any inhaler already in use.",
  },
  {
    requires: ["fever", "cough", "sore-throat"],
    differentials: [
      { condition: "Upper respiratory tract infection", likelihood: 0.6 },
      { condition: "Influenza", likelihood: 0.22 },
      { condition: "Streptococcal pharyngitis", likelihood: 0.18 },
    ],
    tests: ["CBC with ESR", "Throat swab"],
    notes:
      "Mostly viral at this duration. Reserve antibiotics for tonsillar exudate with tender cervical nodes and no cough.",
  },
  {
    requires: ["fever", "joint-pain"],
    differentials: [
      { condition: "Dengue fever", likelihood: 0.4 },
      { condition: "Chikungunya", likelihood: 0.32 },
      { condition: "Viral fever", likelihood: 0.28 },
    ],
    tests: ["CBC with platelet count", "Dengue NS1 antigen"],
    notes:
      "Fever with joint pain in this region warrants a platelet count. Warn against NSAIDs until dengue is excluded.",
  },
  {
    requires: ["fever"],
    differentials: [
      { condition: "Viral fever", likelihood: 0.5 },
      { condition: "Dengue fever", likelihood: 0.27 },
      { condition: "Enteric fever (typhoid)", likelihood: 0.23 },
    ],
    tests: ["CBC with ESR", "Dengue NS1 antigen", "Widal test"],
    notes: "Ask about the fever pattern and any travel. Step-ladder fever with abdominal discomfort points to enteric fever.",
  },
  {
    requires: ["abdominal-pain", "vomiting"],
    differentials: [
      { condition: "Acute gastritis", likelihood: 0.45 },
      { condition: "Peptic ulcer disease", likelihood: 0.3 },
      { condition: "Food poisoning", likelihood: 0.25 },
    ],
    tests: ["Ultrasound of whole abdomen", "Serum electrolytes"],
    notes: "Check whether pain relates to meals, and exclude right-iliac-fossa tenderness before settling on gastritis.",
  },
  {
    requires: ["diarrhoea"],
    differentials: [
      { condition: "Acute gastroenteritis", likelihood: 0.6 },
      { condition: "Food poisoning", likelihood: 0.25 },
      { condition: "Bacterial dysentery", likelihood: 0.15 },
    ],
    tests: ["Stool R/E", "Serum electrolytes"],
    notes: "Hydration status is the decision that matters here, not the organism.",
  },
  {
    requires: ["urinary"],
    differentials: [
      { condition: "Urinary tract infection", likelihood: 0.7 },
      { condition: "Urethritis", likelihood: 0.18 },
      { condition: "Renal stone", likelihood: 0.12 },
    ],
    tests: ["Urine R/E", "Urine C/S"],
    notes: "Confirm on urine R/E before committing to an antibiotic course.",
  },
  {
    requires: ["rash"],
    differentials: [
      { condition: "Contact dermatitis", likelihood: 0.4 },
      { condition: "Fungal skin infection", likelihood: 0.35 },
      { condition: "Drug reaction", likelihood: 0.25 },
    ],
    tests: [],
    notes: "Ask what is new — soap, medicine, jewellery. A photograph of the edge of the lesion helps most.",
  },
  {
    requires: ["headache"],
    differentials: [
      { condition: "Tension-type headache", likelihood: 0.5 },
      { condition: "Migraine", likelihood: 0.33 },
      { condition: "Refractive error", likelihood: 0.17 },
    ],
    tests: ["Blood pressure"],
    notes: "Check blood pressure and ask about screen hours and sleep before imaging anything.",
  },
  {
    requires: ["joint-pain"],
    differentials: [
      { condition: "Osteoarthritis", likelihood: 0.45 },
      { condition: "Gout", likelihood: 0.3 },
      { condition: "Mechanical back strain", likelihood: 0.25 },
    ],
    tests: ["Serum uric acid"],
    notes: "Morning stiffness lasting over an hour would move this towards an inflammatory cause.",
  },
];

const GENERIC_RULE: DifferentialRule = {
  requires: [],
  differentials: [{ condition: "Undifferentiated presentation", likelihood: 1 }],
  tests: ["CBC with ESR"],
  notes: "Not enough detail yet to narrow this down. A few history questions will do more than any test.",
};

export interface InsightInput {
  chiefComplaint: string;
  /** Concept ids carried over from the triage, if the consultation came from one. */
  triageConceptIds?: string[];
  messages: { authorRole: string; body: string }[];
  reports: MedicalReport[];
}

export function buildInsight(input: InsightInput): AiInsight {
  // Everything the patient has said, plus the complaint that opened the case.
  const patientText = [
    input.chiefComplaint,
    ...input.messages.filter((m) => m.authorRole === "patient").map((m) => m.body),
  ].join(" ");

  const concepts = matchConcepts(patientText, input.triageConceptIds ?? []);
  const conceptIds = concepts.map((c) => c.id);

  const rule =
    DIFFERENTIAL_RULES.find((r) => r.requires.every((id) => conceptIds.includes(id))) ?? GENERIC_RULE;

  // An analysed report is harder evidence than anything said in chat, so its
  // impression is promoted to the top of the differential list.
  const analysed = input.reports.filter((r) => r.analysis);
  const differentials = [...rule.differentials];
  const notes = [rule.notes];

  for (const report of analysed) {
    const analysis = report.analysis!;
    notes.push(`${report.fileName}: ${analysis.impression}`);
    const top = analysis.findings[0];
    if (top && !differentials.some((d) => d.condition === top.label)) {
      differentials.unshift({ condition: top.label, likelihood: top.confidence });
    }
  }

  const tests = new Set(rule.tests);
  for (const concept of concepts) {
    for (const test of concept.tests ?? []) tests.add(test);
  }

  // Dengue arrives every monsoon here, and an NSAID given while platelets are
  // falling is the classic avoidable harm. So long as dengue is anywhere in the
  // differential the suggester must not offer one — otherwise the panel would
  // contradict the very note sitting beside it telling the doctor to avoid them.
  // Derived from the differential rather than flagged per rule, so any dengue
  // rule added later is covered without anyone remembering to opt in.
  const dengueSuspected = differentials.some((d) => /dengue/i.test(d.condition));
  const suggestedMedicines = [
    ...analysed.flatMap((r) => r.analysis?.suggestedMedicines ?? []),
    ...suggestionsForConcepts(conceptIds),
  ]
    .filter((medicine) => !dengueSuspected || !isNsaid(medicine))
    .slice(0, 4);

  return {
    differentials: differentials.slice(0, 4),
    suggestedTests: [...tests].slice(0, 5),
    suggestedMedicines,
    notes: notes.join(" "),
    source: "fallback",
    updatedAt: new Date().toISOString(),
  };
}
