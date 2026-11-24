import type { Specialty } from "@/lib/types";

/**
 * The symptom vocabulary the rule engine reasons over.
 *
 * Keywords are bilingual on purpose: a patient in Cumilla types "তিন দিন ধরে
 * শ্বাসকষ্ট", and the engine has to reach the same conclusion it would from
 * "shortness of breath for three days". Matching on both alphabets in one table
 * keeps that behaviour in a single place rather than behind a translation step.
 */
export interface SymptomConcept {
  id: string;
  /** Lowercased substrings, English and Bangla. Matched against the raw description. */
  keywords: string[];
  specialties: Specialty[];
  /**
   * How much this concept alone argues for urgency, 0–4. The engine takes the
   * maximum across matched concepts, then applies modifiers — a patient with
   * three mild complaints is not thereby severe.
   */
  weight: number;
  /** Dictionary code, set when the concept is a red flag in its own right. */
  redFlag?: string;
  tests?: string[];
}

export const SYMPTOM_CONCEPTS: SymptomConcept[] = [
  {
    id: "fever",
    keywords: ["fever", "temperature", "জ্বর", "তাপমাত্রা"],
    specialties: ["general-medicine"],
    weight: 1,
    tests: ["CBC with ESR"],
  },
  {
    id: "cough",
    keywords: ["cough", "কাশি"],
    specialties: ["pulmonology", "general-medicine"],
    weight: 1,
    tests: ["Chest X-ray"],
  },
  {
    id: "sore-throat",
    keywords: ["sore throat", "throat pain", "swallow", "গলা ব্যথা", "গলাব্যথা", "ঢোঁক"],
    specialties: ["ent", "general-medicine"],
    weight: 1,
    tests: ["Throat swab"],
  },
  {
    id: "chest-pain",
    keywords: ["chest pain", "chest tightness", "বুকে ব্যথা", "বুক ব্যথা", "বুকে চাপ"],
    specialties: ["cardiology"],
    weight: 3,
    redFlag: "chest-pain-radiating",
    tests: ["ECG", "Troponin I"],
  },
  {
    id: "breathlessness",
    keywords: [
      "shortness of breath",
      "breathless",
      "difficulty breathing",
      "can't breathe",
      "শ্বাসকষ্ট",
      "শ্বাস নিতে কষ্ট",
      "দম বন্ধ",
    ],
    specialties: ["pulmonology", "cardiology"],
    weight: 3,
    redFlag: "breathing-difficulty",
    tests: ["Chest X-ray", "Pulse oximetry"],
  },
  {
    id: "blood-in-cough",
    keywords: ["blood in cough", "coughing blood", "haemoptysis", "hemoptysis", "কাশিতে রক্ত", "রক্ত কাশি"],
    specialties: ["pulmonology"],
    weight: 3,
    redFlag: "blood-in-sputum",
    tests: ["Chest X-ray", "Sputum for AFB"],
  },
  {
    id: "weakness-one-side",
    keywords: [
      "one side",
      "weakness on one side",
      "face droop",
      "slurred speech",
      "এক পাশে দুর্বল",
      "এক পাশ অবশ",
      "কথা জড়িয়ে",
    ],
    specialties: ["neurology"],
    weight: 4,
    redFlag: "sudden-weakness-one-side",
    tests: ["CT brain"],
  },
  {
    id: "altered-consciousness",
    keywords: ["unconscious", "confusion", "confused", "not responding", "অজ্ঞান", "বিভ্রান্ত", "সাড়া দিচ্ছে না"],
    specialties: ["neurology", "general-medicine"],
    weight: 4,
    redFlag: "altered-consciousness",
    tests: ["Random blood sugar", "CT brain"],
  },
  {
    id: "uncontrolled-bleeding",
    keywords: ["bleeding", "blood loss", "রক্তপাত", "রক্ত পড়ছে"],
    specialties: ["general-medicine"],
    weight: 3,
    redFlag: "uncontrolled-bleeding",
    tests: ["CBC", "Coagulation profile"],
  },
  {
    id: "abdominal-pain",
    keywords: ["stomach pain", "abdominal pain", "belly pain", "পেট ব্যথা", "পেটে ব্যথা"],
    specialties: ["gastroenterology", "general-medicine"],
    weight: 2,
    tests: ["Ultrasound of whole abdomen"],
  },
  {
    id: "vomiting",
    keywords: ["vomit", "vomiting", "nausea", "বমি", "গা গোলানো"],
    specialties: ["gastroenterology", "general-medicine"],
    weight: 1,
    tests: ["Serum electrolytes"],
  },
  {
    id: "diarrhoea",
    keywords: ["diarrhea", "diarrhoea", "loose motion", "loose stool", "ডায়রিয়া", "পাতলা পায়খানা"],
    specialties: ["gastroenterology", "general-medicine"],
    weight: 1,
    tests: ["Stool R/E"],
  },
  {
    id: "headache",
    keywords: ["headache", "মাথা ব্যথা", "মাথাব্যথা"],
    specialties: ["general-medicine", "neurology"],
    weight: 1,
  },
  {
    id: "dizziness",
    keywords: ["dizzy", "dizziness", "fainting", "মাথা ঘোরা", "মূর্ছা"],
    specialties: ["neurology", "general-medicine"],
    weight: 2,
    tests: ["Blood pressure", "Random blood sugar"],
  },
  {
    id: "rash",
    keywords: ["rash", "itching", "skin", "র‍্যাশ", "ফুসকুড়ি", "চুলকানি", "চামড়া"],
    specialties: ["dermatology"],
    weight: 1,
  },
  {
    id: "joint-pain",
    keywords: ["joint pain", "back pain", "knee pain", "গিঁটে ব্যথা", "কোমর ব্যথা", "হাঁটু ব্যথা"],
    specialties: ["orthopedics"],
    weight: 1,
    tests: ["Serum uric acid"],
  },
  {
    id: "eye-problem",
    keywords: ["eye pain", "blurred vision", "red eye", "চোখে ব্যথা", "চোখ লাল", "ঝাপসা"],
    specialties: ["ophthalmology"],
    weight: 1,
  },
  {
    id: "urinary",
    keywords: ["burning urine", "urine", "urination", "প্রস্রাবে জ্বালা", "প্রস্রাব"],
    specialties: ["general-medicine"],
    weight: 1,
    tests: ["Urine R/E"],
  },
  {
    id: "mental-health",
    keywords: ["anxiety", "depressed", "depression", "can't sleep", "উদ্বেগ", "দুশ্চিন্তা", "বিষণ্ণ", "ঘুম হয় না"],
    specialties: ["psychiatry"],
    weight: 1,
  },
  {
    id: "child-illness",
    keywords: ["my child", "my son", "my daughter", "baby", "আমার বাচ্চা", "শিশু", "ছেলেটা", "মেয়েটা"],
    specialties: ["pediatrics"],
    weight: 1,
  },
  {
    id: "pregnancy",
    keywords: ["pregnant", "pregnancy", "period", "গর্ভবতী", "মাসিক", "পিরিয়ড"],
    specialties: ["gynecology"],
    weight: 1,
  },
];

/** The symptom chips offered on the intake form, in display order. */
export const COMMON_SYMPTOM_IDS = [
  "fever",
  "cough",
  "sore-throat",
  "headache",
  "abdominal-pain",
  "vomiting",
  "diarrhoea",
  "breathlessness",
  "chest-pain",
  "rash",
  "joint-pain",
  "dizziness",
] as const;

export function conceptById(id: string): SymptomConcept | undefined {
  return SYMPTOM_CONCEPTS.find((c) => c.id === id);
}

/** Where one clause stops and the next begins, so a negation cannot leak across. */
const CLAUSE_BREAK = /[,;।\n]|\band\b|\bbut\b|আর |এবং |কিন্তু /;

/** Bangla negates after the symptom ("জ্বর নেই"); English negates before it ("no fever"). */
const NEGATED_AFTER = /নেই|নাই|হয়নি|হয় নি|নয়/;
const NEGATED_BEFORE = /\b(?:no|not|without|denies|denied|never)\b(?:\s+\S+){0,2}\s*$/;

/**
 * Whether this mention of a symptom is the patient ruling it out.
 *
 * "দুই দিন ধরে হালকা গলা ব্যথা, জ্বর নেই" says plainly that there is no fever,
 * yet a bare substring search finds "জ্বর" and reports it — which inflates the
 * symptom list and can push the severity score a step higher. Each window stops
 * at the nearest clause break so that "জ্বর, কাশি নেই" negates only the cough.
 */
function isNegated(haystack: string, at: number, length: number): boolean {
  const after = haystack.slice(at + length, at + length + 20).split(CLAUSE_BREAK)[0];
  if (NEGATED_AFTER.test(after)) return true;

  const beforeParts = haystack.slice(Math.max(0, at - 28), at).split(CLAUSE_BREAK);
  return NEGATED_BEFORE.test(beforeParts[beforeParts.length - 1]);
}

/** True when the text mentions the keyword at least once without negating it. */
function mentioned(haystack: string, keyword: string): boolean {
  for (let from = 0; ; ) {
    const at = haystack.indexOf(keyword, from);
    if (at === -1) return false;
    if (!isNegated(haystack, at, keyword.length)) return true;
    from = at + keyword.length;
  }
}

/**
 * Match a free-text description plus any explicitly picked symptom tags.
 * Explicit tags always win — the patient ticking "chest pain" counts even if
 * their prose never used the phrase, and a tick outranks a negation in prose.
 */
export function matchConcepts(description: string, symptomIds: string[] = []): SymptomConcept[] {
  const haystack = description.toLowerCase();
  const matched = new Map<string, SymptomConcept>();

  for (const id of symptomIds) {
    const concept = conceptById(id);
    if (concept) matched.set(concept.id, concept);
  }
  for (const concept of SYMPTOM_CONCEPTS) {
    if (matched.has(concept.id)) continue;
    if (concept.keywords.some((k) => mentioned(haystack, k))) matched.set(concept.id, concept);
  }
  return [...matched.values()];
}
