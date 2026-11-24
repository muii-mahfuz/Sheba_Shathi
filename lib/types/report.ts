import type { AiSource, ID, ISODateString } from "./common";
import type { Role } from "./auth";
import type { SuggestedMedicine } from "./prescription";
import type { Severity } from "./triage";

export type ReportKind = "xray" | "ct" | "mri" | "ultrasound" | "blood" | "ecg" | "other";

export interface Finding {
  label: string;
  /** 0–1. */
  confidence: number;
  /**
   * Normalized 0–1 box over the image, so the viewer can outline the region the
   * model flagged instead of asking the reader to take "left lower lobe" on
   * trust. Absent for non-image reports like bloodwork.
   */
  box?: { x: number; y: number; w: number; h: number };
}

export interface ReportAnalysis {
  /** Anatomical region or panel name, e.g. "Chest — PA view". */
  region: string;
  findings: Finding[];
  impression: string;
  severity: Severity;
  suggestedMedicines: SuggestedMedicine[];
  /** Dictionary codes for follow-up actions. */
  followUp: string[];
  model: string;
  source: AiSource;
  analyzedAt: ISODateString;
}

export interface MedicalReport {
  id: ID;
  consultationId: ID;
  patientId: ID;
  kind: ReportKind;
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  uploadedBy: ID;
  uploadedByRole: Role;
  uploadedAt: ISODateString;
  analysis?: ReportAnalysis;
}

export interface UploadReportInput {
  kind: ReportKind;
  fileName: string;
  /** Data URL in the mock phase; a storage key once a real bucket is behind it. */
  fileUrl: string;
  sizeBytes: number;
}
