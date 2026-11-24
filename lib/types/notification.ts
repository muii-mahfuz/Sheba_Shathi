import type { ID, ISODateString } from "./common";

export type NotificationKind =
  | "consultation_requested"
  | "consultation_accepted"
  | "consultation_declined"
  | "message_received"
  | "report_analyzed"
  | "prescription_ready"
  | "triage_critical";

/**
 * Notifications store a kind plus parameters rather than a rendered sentence,
 * so a notification written while the reader was on English still reads
 * correctly after they switch to Bangla.
 */
export interface AppNotification {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  params: Record<string, string>;
  consultationId?: ID;
  prescriptionId?: ID;
  read: boolean;
  createdAt: ISODateString;
}
