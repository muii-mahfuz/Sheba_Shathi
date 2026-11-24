import type { ID, ISODateString } from "./common";

export type Gender = "male" | "female" | "other";

export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

/**
 * The patient's standing medical record. Collected at signup and edited from
 * the profile screen; the triage engine and every consultation read from it, so
 * allergies and chronic conditions are first-class fields rather than free text.
 */
export interface PatientProfile {
  id: ID;
  userId: ID;
  name: string;
  phone: string;
  avatarUrl?: string;
  dateOfBirth: ISODateString;
  gender: Gender;
  bloodGroup?: BloodGroup;
  heightCm?: number;
  weightKg?: number;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  emergencyContact?: EmergencyContact;
  district: string;
  upazila?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/**
 * What a doctor sees in the session side panel — the record condensed to what
 * changes a clinical decision, plus the history that makes them a returning
 * patient rather than a stranger.
 */
export interface PatientSummary {
  id: ID;
  name: string;
  age: number;
  gender: Gender;
  bloodGroup?: BloodGroup;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  district: string;
  consultationCount: number;
  lastVisitAt?: ISODateString;
}

export interface UpdatePatientProfileInput {
  name?: string;
  dateOfBirth?: ISODateString;
  gender?: Gender;
  bloodGroup?: BloodGroup;
  heightCm?: number;
  weightKg?: number;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  emergencyContact?: EmergencyContact;
  district?: string;
  upazila?: string;
}
