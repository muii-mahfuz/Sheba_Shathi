"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, qs } from "@/lib/api-client";
import type {
  AiInsight,
  AppNotification,
  AuthResult,
  Consultation,
  ConsultationView,
  CreateConsultationInput,
  CreatePrescriptionInput,
  CreateTriageInput,
  DoctorFilters,
  DoctorProfile,
  LoginInput,
  MedicalReport,
  Message,
  Paginated,
  PatientProfile,
  PatientSummary,
  Prescription,
  Role,
  SendMessageInput,
  SignupInput,
  TriageAssessment,
  UpdateDoctorProfileInput,
  UpdatePatientProfileInput,
  UploadReportInput,
  User,
} from "@/lib/types";
import { useSessionStore } from "@/store/session";

/**
 * Every screen's data API. Query keys are shaped `[entity, ...scope]` so a
 * mutation can invalidate a whole entity without listing every filter
 * combination that might be cached under it.
 *
 * There is no websocket yet. Live consultations poll instead — see
 * `useMessages`, which is the one place that decides how "live" is achieved, so
 * moving to a socket later touches this file and nothing else.
 */

export const keys = {
  me: ["me"] as const,
  patientMe: ["patient", "me"] as const,
  doctorMe: ["doctor", "me"] as const,
  doctors: (filters: DoctorFilters) => ["doctors", filters] as const,
  doctor: (id: string) => ["doctor", id] as const,
  patients: (search: string) => ["patients", search] as const,
  patientSummary: (id: string) => ["patient-summary", id] as const,
  triages: ["triages"] as const,
  triage: (id: string) => ["triage", id] as const,
  consultations: (status?: string) => ["consultations", status ?? "all"] as const,
  consultation: (id: string) => ["consultation", id] as const,
  messages: (id: string) => ["messages", id] as const,
  reports: (id: string) => ["reports", id] as const,
  prescriptions: ["prescriptions"] as const,
  prescription: (id: string) => ["prescription", id] as const,
  notifications: ["notifications"] as const,
};

// ------------------------------------------------------------------- auth

export function useLogin() {
  const signIn = useSessionStore((s) => s.signIn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginInput) => api.post<AuthResult>("/auth/login", input),
    onSuccess: (result) => {
      signIn(result);
      qc.clear();
    },
  });
}

export function useDemoLogin() {
  const signIn = useSessionStore((s) => s.signIn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (role: Role) => api.post<AuthResult>("/auth/demo-login", { role }),
    onSuccess: (result) => {
      signIn(result);
      qc.clear();
    },
  });
}

export function useSignup() {
  const signIn = useSessionStore((s) => s.signIn);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SignupInput) => api.post<AuthResult>("/auth/signup", input),
    onSuccess: (result) => {
      signIn(result);
      qc.clear();
    },
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api.get<User>("/auth/me"),
    enabled,
  });
}

// --------------------------------------------------------------- patients

export function usePatientProfile(enabled = true) {
  return useQuery({
    queryKey: keys.patientMe,
    queryFn: () => api.get<PatientProfile>("/patients/me"),
    enabled,
  });
}

export function useUpdatePatientProfile() {
  const qc = useQueryClient();
  const setUser = useSessionStore((s) => s.setUser);
  const user = useSessionStore((s) => s.user);
  return useMutation({
    mutationFn: (input: UpdatePatientProfileInput) =>
      api.patch<PatientProfile>("/patients/me", input),
    onSuccess: (profile) => {
      qc.setQueryData(keys.patientMe, profile);
      if (user && profile.name !== user.name) setUser({ ...user, name: profile.name });
    },
  });
}

export function usePatientSummary(id: string | undefined) {
  return useQuery({
    queryKey: keys.patientSummary(id ?? ""),
    queryFn: () => api.get<PatientSummary>(`/patients/${id}/summary`),
    enabled: Boolean(id),
  });
}

export function useMyPatients(search = "") {
  return useQuery({
    queryKey: keys.patients(search),
    queryFn: () => api.get<Paginated<PatientSummary>>(`/patients${qs({ search })}`),
  });
}

// ---------------------------------------------------------------- doctors

export function useDoctorProfile(enabled = true) {
  return useQuery({
    queryKey: keys.doctorMe,
    queryFn: () => api.get<DoctorProfile>("/doctors/me"),
    enabled,
  });
}

export function useUpdateDoctorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateDoctorProfileInput) =>
      api.patch<DoctorProfile>("/doctors/me", input),
    onSuccess: (profile) => {
      qc.setQueryData(keys.doctorMe, profile);
      qc.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useDoctors(filters: DoctorFilters) {
  return useQuery({
    queryKey: keys.doctors(filters),
    queryFn: () =>
      api.get<Paginated<DoctorProfile>>(
        `/doctors${qs({
          specialty: filters.specialty,
          district: filters.district,
          language: filters.language,
          availableOnly: filters.availableOnly,
          search: filters.search,
          page: filters.page,
          pageSize: filters.pageSize,
        })}`,
      ),
  });
}

export function useDoctor(id: string | undefined) {
  return useQuery({
    queryKey: keys.doctor(id ?? ""),
    queryFn: () => api.get<DoctorProfile>(`/doctors/${id}`),
    enabled: Boolean(id),
  });
}

// ----------------------------------------------------------------- triage

export function useCreateTriage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTriageInput) => api.post<TriageAssessment>("/triage", input),
    onSuccess: (assessment) => {
      qc.setQueryData(keys.triage(assessment.id), assessment);
      qc.invalidateQueries({ queryKey: keys.triages });
      qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

export function useTriage(id: string | undefined) {
  return useQuery({
    queryKey: keys.triage(id ?? ""),
    queryFn: () => api.get<TriageAssessment>(`/triage/${id}`),
    enabled: Boolean(id),
  });
}

export function useTriages(enabled = true) {
  return useQuery({
    queryKey: keys.triages,
    queryFn: () => api.get<Paginated<TriageAssessment>>("/triage"),
    enabled,
  });
}

// ---------------------------------------------------------- consultations

export function useConsultations(status?: Consultation["status"]) {
  return useQuery({
    queryKey: keys.consultations(status),
    queryFn: () => api.get<Paginated<ConsultationView>>(`/consultations${qs({ status })}`),
    // The doctor's queue should notice a new request without a manual refresh.
    refetchInterval: 15_000,
  });
}

export function useConsultation(id: string | undefined) {
  return useQuery({
    queryKey: keys.consultation(id ?? ""),
    queryFn: () => api.get<ConsultationView>(`/consultations/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateConsultationInput) =>
      api.post<ConsultationView>("/consultations", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

export function useUpdateConsultationStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { status: Consultation["status"]; declineReason?: string }) =>
      api.patch<ConsultationView>(`/consultations/${id}`, input),
    onSuccess: (view) => {
      qc.setQueryData(keys.consultation(id), view);
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: keys.messages(id) });
      qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

// --------------------------------------------------------------- messages

/**
 * The consultation thread. While a consultation is live this polls, which is
 * the stand-in for the websocket the real service will use — the interval is
 * short enough to feel immediate and long enough not to hammer the API.
 */
export function useMessages(id: string | undefined, live: boolean) {
  return useQuery({
    queryKey: keys.messages(id ?? ""),
    queryFn: () => api.get<Paginated<Message>>(`/consultations/${id}/messages`),
    enabled: Boolean(id),
    refetchInterval: live ? 3_000 : false,
  });
}

export function useSendMessage(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SendMessageInput) =>
      api.post<Message>(`/consultations/${id}/messages`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.messages(id) });
      qc.invalidateQueries({ queryKey: keys.consultation(id) });
    },
  });
}

// ---------------------------------------------------------------- reports

export function useReports(id: string | undefined) {
  return useQuery({
    queryKey: keys.reports(id ?? ""),
    queryFn: () => api.get<Paginated<MedicalReport>>(`/consultations/${id}/reports`),
    enabled: Boolean(id),
  });
}

export function useUploadReport(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadReportInput) =>
      api.post<MedicalReport>(`/consultations/${id}/reports`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.reports(id) });
      qc.invalidateQueries({ queryKey: keys.messages(id) });
    },
  });
}

export function useAnalyzeReport(consultationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => api.post<MedicalReport>(`/reports/${reportId}/analyze`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.reports(consultationId) });
      qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

export function useRefreshInsight(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<AiInsight>(`/consultations/${id}/insight`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.consultation(id) });
    },
  });
}

// ---------------------------------------------------------- prescriptions

export function useCreatePrescription(consultationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePrescriptionInput) =>
      api.post<Prescription>(`/consultations/${consultationId}/prescription`, input),
    onSuccess: (prescription) => {
      qc.setQueryData(keys.prescription(prescription.id), prescription);
      qc.invalidateQueries({ queryKey: keys.prescriptions });
      qc.invalidateQueries({ queryKey: ["consultations"] });
      qc.invalidateQueries({ queryKey: keys.consultation(consultationId) });
      qc.invalidateQueries({ queryKey: keys.messages(consultationId) });
      qc.invalidateQueries({ queryKey: keys.notifications });
    },
  });
}

export function usePrescriptions() {
  return useQuery({
    queryKey: keys.prescriptions,
    queryFn: () => api.get<Paginated<Prescription>>("/prescriptions"),
  });
}

export function usePrescription(id: string | undefined) {
  return useQuery({
    queryKey: keys.prescription(id ?? ""),
    queryFn: () => api.get<Prescription>(`/prescriptions/${id}`),
    enabled: Boolean(id),
  });
}

// ---------------------------------------------------------- notifications

export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications,
    queryFn: () => api.get<Paginated<AppNotification>>("/notifications"),
    refetchInterval: 20_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<AppNotification>(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch<void>("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications }),
  });
}

export function useResetDemo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>("/demo/reset"),
    onSuccess: () => qc.clear(),
  });
}
