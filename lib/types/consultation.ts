import type { AiSource, ID, ISODateString } from "./common";
import type { SuggestedMedicine } from "./prescription";
import type { Severity, TriageAssessment } from "./triage";

export type ConsultationStatus =
  | "requested"
  | "accepted"
  | "active"
  | "completed"
  | "declined"
  | "cancelled";

/**
 * Whether this doctor has seen this patient before. Surfaced on the request
 * queue because it changes how a doctor reads the request: a returning
 * patient's history is already on file, a new one's is not.
 */
export type PatientTag = "new" | "returning";

/**
 * The running clinical picture, recomputed as the conversation and the uploaded
 * reports accumulate. Advisory only — nothing here reaches the patient until a
 * doctor has put it in a prescription.
 */
export interface AiInsight {
  differentials: { condition: string; likelihood: number }[];
  suggestedTests: string[];
  suggestedMedicines: SuggestedMedicine[];
  notes: string;
  source: AiSource;
  updatedAt: ISODateString;
}

export interface Consultation {
  id: ID;
  patientId: ID;
  doctorId: ID;
  triageId?: ID;
  status: ConsultationStatus;
  patientTag: PatientTag;
  /** Denormalized from the triage so the doctor's queue can sort by it. */
  severity: Severity;
  chiefComplaint: string;
  requestedAt: ISODateString;
  acceptedAt?: ISODateString;
  startedAt?: ISODateString;
  endedAt?: ISODateString;
  declineReason?: string;
  prescriptionId?: ID;
  aiInsight?: AiInsight;
  unreadForPatient: number;
  unreadForDoctor: number;
}

/**
 * A consultation with the two people in it expanded. Every list and detail
 * endpoint returns this rather than bare ids — a queue row that has to fetch a
 * name per item is a queue row that renders empty for a beat.
 */
export interface ConsultationView extends Consultation {
  patient: {
    id: ID;
    name: string;
    age: number;
    gender: string;
    district: string;
  };
  doctor: {
    id: ID;
    name: string;
    specialties: string[];
    hospital: string;
  };
  triage?: TriageAssessment;
}

export type MessageAuthorRole = "patient" | "doctor" | "system";

export interface Attachment {
  id: ID;
  kind: "image" | "pdf" | "report";
  url: string;
  name: string;
  sizeBytes: number;
  /** Set when the attachment is a medical report, linking to its analysis. */
  reportId?: ID;
}

export interface Message {
  id: ID;
  consultationId: ID;
  authorRole: MessageAuthorRole;
  authorId: ID;
  authorName: string;
  body: string;
  attachments: Attachment[];
  createdAt: ISODateString;
  /**
   * System messages carry a dictionary code plus params instead of prose, so
   * "Dr Rahman joined" renders in whichever language the reader is using.
   */
  systemCode?: string;
  systemParams?: Record<string, string>;
}

export interface CreateConsultationInput {
  doctorId: ID;
  triageId?: ID;
  chiefComplaint: string;
}

export interface SendMessageInput {
  body: string;
  attachments?: Omit<Attachment, "id">[];
}

export interface ConsultationFilters {
  status?: ConsultationStatus;
  page?: number;
  pageSize?: number;
}
