import type { ID, ISODateString, Money } from "./common";

/**
 * A closed vocabulary rather than free text: triage maps symptoms onto these,
 * and doctor matching is an intersection of two lists of them. Adding a
 * specialty means adding it here, to the dictionaries, and to the triage rules.
 */
export type Specialty =
  | "general-medicine"
  | "cardiology"
  | "pulmonology"
  | "gastroenterology"
  | "neurology"
  | "dermatology"
  | "pediatrics"
  | "gynecology"
  | "orthopedics"
  | "ent"
  | "ophthalmology"
  | "psychiatry";

export const SPECIALTIES: readonly Specialty[] = [
  "general-medicine",
  "cardiology",
  "pulmonology",
  "gastroenterology",
  "neurology",
  "dermatology",
  "pediatrics",
  "gynecology",
  "orthopedics",
  "ent",
  "ophthalmology",
  "psychiatry",
] as const;

export interface DoctorProfile {
  id: ID;
  userId: ID;
  name: string;
  avatarUrl?: string;
  licenseNumber: string;
  specialties: Specialty[];
  qualifications: string[];
  bio: string;
  hospital: string;
  district: string;
  /** Which languages this doctor consults in — a real constraint here, not a nicety. */
  languages: ("en" | "bn")[];
  consultationFee: Money;
  experienceYears: number;
  isAvailable: boolean;
  rating: number;
  ratingCount: number;
  consultationCount: number;
  /** Median minutes to accept a request. Drives the "usually replies in ~Nm" line. */
  respondsInMinutes: number;
  createdAt: ISODateString;
}

export interface DoctorFilters {
  specialty?: Specialty;
  district?: string;
  availableOnly?: boolean;
  language?: "en" | "bn";
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface UpdateDoctorProfileInput {
  bio?: string;
  isAvailable?: boolean;
  consultationFee?: Money;
  specialties?: Specialty[];
  languages?: ("en" | "bn")[];
}
