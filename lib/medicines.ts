import type { Medicine, MedicineForm, SuggestedMedicine } from "@/lib/types";

/**
 * A small formulary of generics commonly dispensed in Bangladesh, used to
 * populate the prescription composer's picker and to back the AI suggestions.
 *
 * Generic names only — a prescription that names a brand ties the patient to
 * one manufacturer's price at the pharmacy counter.
 */
export interface FormularyEntry {
  name: string;
  form: MedicineForm;
  strengths: string[];
}

export const FORMULARY: FormularyEntry[] = [
  { name: "Paracetamol", form: "tablet", strengths: ["500 mg", "665 mg"] },
  { name: "Paracetamol", form: "syrup", strengths: ["120 mg/5 ml"] },
  { name: "Ibuprofen", form: "tablet", strengths: ["200 mg", "400 mg"] },
  { name: "Amoxicillin", form: "capsule", strengths: ["250 mg", "500 mg"] },
  { name: "Azithromycin", form: "tablet", strengths: ["250 mg", "500 mg"] },
  { name: "Cefixime", form: "capsule", strengths: ["200 mg", "400 mg"] },
  { name: "Ciprofloxacin", form: "tablet", strengths: ["250 mg", "500 mg"] },
  { name: "Metronidazole", form: "tablet", strengths: ["400 mg"] },
  { name: "Cetirizine", form: "tablet", strengths: ["10 mg"] },
  { name: "Fexofenadine", form: "tablet", strengths: ["120 mg", "180 mg"] },
  { name: "Levocetirizine", form: "tablet", strengths: ["5 mg"] },
  { name: "Omeprazole", form: "capsule", strengths: ["20 mg", "40 mg"] },
  { name: "Esomeprazole", form: "tablet", strengths: ["20 mg", "40 mg"] },
  { name: "Domperidone", form: "tablet", strengths: ["10 mg"] },
  { name: "Oral rehydration salts", form: "syrup", strengths: ["1 sachet in 500 ml"] },
  { name: "Salbutamol", form: "inhaler", strengths: ["100 mcg/puff"] },
  { name: "Montelukast", form: "tablet", strengths: ["10 mg"] },
  { name: "Prednisolone", form: "tablet", strengths: ["5 mg", "10 mg"] },
  { name: "Diclofenac", form: "tablet", strengths: ["50 mg"] },
  { name: "Amlodipine", form: "tablet", strengths: ["5 mg", "10 mg"] },
  { name: "Metformin", form: "tablet", strengths: ["500 mg", "850 mg"] },
  { name: "Ranitidine", form: "tablet", strengths: ["150 mg"] },
  { name: "Hydrocortisone", form: "ointment", strengths: ["1%"] },
  { name: "Chloramphenicol", form: "drops", strengths: ["0.5%"] },
];

export const FREQUENCY_CODES = [
  "once-daily",
  "twice-daily",
  "thrice-daily",
  "four-times-daily",
  "every-6h",
  "every-8h",
  "as-needed",
  "at-bedtime",
] as const;

export const MEDICINE_FORMS: MedicineForm[] = [
  "tablet",
  "capsule",
  "syrup",
  "injection",
  "drops",
  "inhaler",
  "ointment",
];

function med(
  name: string,
  strength: string,
  form: MedicineForm,
  frequency: string,
  durationDays: number,
  rationale: string,
  instruction?: string,
): SuggestedMedicine {
  return { name, strength, form, frequency, durationDays, instruction, rationale };
}

/**
 * Concept → conservative suggestion. Deliberately limited to symptomatic relief
 * and rehydration: anything that needs a judgement call about antibiotics or
 * steroids is left to the doctor, who is the one signing the prescription.
 */
const SUGGESTIONS_BY_CONCEPT: Record<string, SuggestedMedicine[]> = {
  fever: [
    med(
      "Paracetamol",
      "500 mg",
      "tablet",
      "thrice-daily",
      3,
      "Reduces fever and body ache; first line and safe with most other medicines.",
      "After food",
    ),
  ],
  "sore-throat": [
    med(
      "Paracetamol",
      "500 mg",
      "tablet",
      "thrice-daily",
      5,
      "Relieves throat pain and any accompanying fever.",
      "After food",
    ),
  ],
  cough: [
    med(
      "Levocetirizine",
      "5 mg",
      "tablet",
      "at-bedtime",
      5,
      "Eases a dry, allergy-driven cough and helps the patient sleep.",
    ),
  ],
  rash: [
    med(
      "Fexofenadine",
      "120 mg",
      "tablet",
      "once-daily",
      7,
      "Non-sedating antihistamine for itching.",
    ),
  ],
  vomiting: [
    med(
      "Domperidone",
      "10 mg",
      "tablet",
      "thrice-daily",
      3,
      "Controls nausea so oral fluids stay down.",
      "30 minutes before food",
    ),
  ],
  diarrhoea: [
    med(
      "Oral rehydration salts",
      "1 sachet in 500 ml",
      "syrup",
      "as-needed",
      3,
      "Replaces fluid and electrolytes — the intervention that actually changes outcomes here.",
      "After each loose motion",
    ),
  ],
  "abdominal-pain": [
    med(
      "Omeprazole",
      "20 mg",
      "capsule",
      "once-daily",
      7,
      "Covers acid-related pain, the most common cause in this presentation.",
      "Empty stomach, before breakfast",
    ),
  ],
  headache: [
    med(
      "Paracetamol",
      "500 mg",
      "tablet",
      "as-needed",
      3,
      "First-line analgesic; avoids the gastric risk of NSAIDs.",
      "After food",
    ),
  ],
  "joint-pain": [
    med(
      "Ibuprofen",
      "400 mg",
      "tablet",
      "twice-daily",
      5,
      "Anti-inflammatory for joint pain. Check for gastric history first.",
      "After food",
    ),
  ],
  breathlessness: [
    med(
      "Salbutamol",
      "100 mcg/puff",
      "inhaler",
      "as-needed",
      7,
      "Rescue bronchodilator if the cause is bronchospasm — confirm before prescribing.",
      "Two puffs when breathless",
    ),
  ],
  urinary: [
    med(
      "Ciprofloxacin",
      "500 mg",
      "tablet",
      "twice-daily",
      5,
      "Covers common urinary pathogens. Confirm with urine R/E before starting.",
      "After food",
    ),
  ],
};

/**
 * NSAIDs in the formulary, by generic name.
 *
 * Held as a class rather than a single drug because the contraindication that
 * matters here is class-wide: in dengue any NSAID raises the bleeding risk as
 * platelets fall, not just whichever one the suggester happened to reach for.
 */
const NSAID_NAMES = new Set(["ibuprofen", "diclofenac", "aspirin", "naproxen"]);

export function isNsaid(medicine: { name: string }): boolean {
  return NSAID_NAMES.has(medicine.name.trim().toLowerCase());
}

export function suggestionsForConcepts(conceptIds: string[]): SuggestedMedicine[] {
  const out: SuggestedMedicine[] = [];
  const seen = new Set<string>();
  for (const id of conceptIds) {
    for (const suggestion of SUGGESTIONS_BY_CONCEPT[id] ?? []) {
      const key = `${suggestion.name}|${suggestion.strength}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(suggestion);
    }
  }
  return out.slice(0, 4);
}

/**
 * Medicines a patient's recorded allergies rule out. Substring match on the
 * generic name, which catches "Penicillin" → "Amoxicillin" only if the record
 * names the drug class, so this assists the doctor rather than replacing them.
 */
export function conflictsWithAllergies(medicine: Medicine, allergies: string[]): boolean {
  const name = medicine.name.toLowerCase();
  return allergies.some((allergy) => {
    const a = allergy.toLowerCase().trim();
    if (!a) return false;
    return name.includes(a) || a.includes(name);
  });
}

export function emptyMedicine(): Medicine {
  return {
    name: "",
    strength: "",
    form: "tablet",
    frequency: "twice-daily",
    durationDays: 5,
    instruction: "",
  };
}
