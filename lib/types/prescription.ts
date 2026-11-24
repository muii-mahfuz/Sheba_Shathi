import type { ID, ISODateString } from "./common";

export type MedicineForm =
  | "tablet"
  | "capsule"
  | "syrup"
  | "injection"
  | "drops"
  | "inhaler"
  | "ointment";

export interface Medicine {
  name: string;
  strength: string;
  form: MedicineForm;
  /** Dictionary code, e.g. "twice-daily" — printed in the reader's language. */
  frequency: string;
  durationDays: number;
  /** Free-text note from the doctor, e.g. "after food". */
  instruction?: string;
}

/** A medicine the AI proposed, with the reason it proposed it. Never dispensed as-is. */
export interface SuggestedMedicine extends Medicine {
  rationale: string;
}

/**
 * A prescription is a record, not a view: it snapshots the patient and doctor
 * details as they stood when it was signed, so a later profile edit can never
 * rewrite what a doctor put their licence number to.
 */
export interface Prescription {
  id: ID;
  serial: string;
  consultationId: ID;
  patientId: ID;
  doctorId: ID;

  patientName: string;
  patientAge: number;
  patientGender: string;

  doctorName: string;
  doctorQualifications: string[];
  doctorLicense: string;
  doctorSpecialties: string[];

  diagnosis: string;
  medicines: Medicine[];
  /** Free-text advice lines written by the doctor. */
  advice: string[];
  tests: string[];
  followUpDays?: number;
  issuedAt: ISODateString;
}

export interface CreatePrescriptionInput {
  diagnosis: string;
  medicines: Medicine[];
  advice: string[];
  tests: string[];
  followUpDays?: number;
}
