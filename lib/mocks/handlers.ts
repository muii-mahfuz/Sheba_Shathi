import { HttpResponse, delay, http } from "msw";
import { analyzeReport, assessTriage, computeInsight } from "@/lib/gemma";
import { ageFrom, resolveLocale, type Locale } from "@/lib/i18n";
import type {
  AppNotification,
  Consultation,
  ConsultationView,
  CreateConsultationInput,
  CreatePrescriptionInput,
  CreateTriageInput,
  DoctorProfile,
  LoginInput,
  MedicalReport,
  Message,
  PatientProfile,
  PatientSummary,
  Prescription,
  SendMessageInput,
  SignupInput,
  TriageAssessment,
  UpdateDoctorProfileInput,
  UpdatePatientProfileInput,
  UploadReportInput,
  User,
} from "@/lib/types";
import { DEMO_DOCTOR_ID, DEMO_PATIENT_ID } from "./data";
import { commit, getDb, newId, resetDb } from "./db";

/**
 * The mock API.
 *
 * Paths and payload shapes here are the contract a real backend has to meet —
 * they're written the way a REST service would answer, not the way this screen
 * happens to want, so swapping `NEXT_PUBLIC_API_BASE` to a live server is the
 * only change the app needs.
 *
 * Two headers stand in for infrastructure that isn't built yet:
 *   x-sheba-user   — the authenticated user id, replacing a bearer token
 *   accept-language — the reader's locale, so model-written prose comes back
 *                     already in the right language
 */

const BASE = "/api";

/** Perceptible but not tedious. AI endpoints get longer, since they should feel like work. */
const FAST = 140;
const THINKING = 900;

function jsonError(status: number, error: string, message: string) {
  return HttpResponse.json({ error, message }, { status });
}

function localeOf(request: Request): Locale {
  return resolveLocale(request.headers.get("accept-language"));
}

function actorId(request: Request): string | null {
  return request.headers.get("x-sheba-user");
}

function currentUser(request: Request): User | null {
  const id = actorId(request);
  if (!id) return null;
  return getDb().users.find((u) => u.id === id) ?? null;
}

function patientOf(user: User): PatientProfile | undefined {
  return getDb().patients.find((p) => p.userId === user.id);
}

function doctorOf(user: User): DoctorProfile | undefined {
  return getDb().doctors.find((d) => d.userId === user.id);
}

function toView(consultation: Consultation): ConsultationView {
  const db = getDb();
  const patient = db.patients.find((p) => p.id === consultation.patientId);
  const doctor = db.doctors.find((d) => d.id === consultation.doctorId);
  const triage = db.triages.find((t) => t.id === consultation.triageId);

  return {
    ...consultation,
    patient: {
      id: patient?.id ?? consultation.patientId,
      name: patient?.name ?? "Unknown patient",
      age: patient ? ageFrom(patient.dateOfBirth) : 0,
      gender: patient?.gender ?? "other",
      district: patient?.district ?? "",
    },
    doctor: {
      id: doctor?.id ?? consultation.doctorId,
      name: doctor?.name ?? "Unknown doctor",
      specialties: doctor?.specialties ?? [],
      hospital: doctor?.hospital ?? "",
    },
    triage,
  };
}

function notify(
  userId: string,
  kind: AppNotification["kind"],
  params: Record<string, string>,
  extra: Partial<AppNotification> = {},
): void {
  getDb().notifications.unshift({
    id: newId("n"),
    userId,
    kind,
    params,
    read: false,
    createdAt: new Date().toISOString(),
    ...extra,
  });
}

/** The user account behind a patient or doctor record, for addressing notifications. */
function userIdForPatient(patientId: string): string | undefined {
  return getDb().patients.find((p) => p.id === patientId)?.userId;
}
function userIdForDoctor(doctorId: string): string | undefined {
  return getDb().doctors.find((d) => d.id === doctorId)?.userId;
}

function summarize(patient: PatientProfile): PatientSummary {
  const db = getDb();
  const theirs = db.consultations.filter((c) => c.patientId === patient.id);
  const past = theirs
    .filter((c) => c.status === "completed")
    .sort((a, b) => (b.endedAt ?? "").localeCompare(a.endedAt ?? ""));

  return {
    id: patient.id,
    name: patient.name,
    age: ageFrom(patient.dateOfBirth),
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    allergies: patient.allergies,
    chronicConditions: patient.chronicConditions,
    currentMedications: patient.currentMedications,
    district: patient.district,
    consultationCount: theirs.length,
    lastVisitAt: past[0]?.endedAt,
  };
}

function paginate<T>(items: T[], url: URL) {
  const page = Number(url.searchParams.get("page") ?? "1");
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20");
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize, total: items.length };
}

export const handlers = [
  // ---------------------------------------------------------------- auth

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    await delay(FAST);
    const body = (await request.json()) as LoginInput;
    const identifier = body.identifier?.trim().toLowerCase() ?? "";

    const user = getDb().users.find(
      (u) =>
        u.role === body.role &&
        (u.email.toLowerCase() === identifier || u.phone === identifier),
    );

    // The mock accepts any non-empty password for a known account. Real auth
    // replaces this endpoint wholesale.
    if (!user || !body.password) {
      return jsonError(401, "invalid_credentials", "No account matches those details.");
    }
    return HttpResponse.json({ token: `mock.${user.id}`, user });
  }),

  http.post(`${BASE}/auth/demo-login`, async ({ request }) => {
    await delay(FAST);
    const { role } = (await request.json()) as { role: "patient" | "doctor" };
    const id = role === "doctor" ? DEMO_DOCTOR_ID : DEMO_PATIENT_ID;
    const user = getDb().users.find((u) => u.id === id)!;
    return HttpResponse.json({ token: `mock.${user.id}`, user });
  }),

  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    await delay(FAST);
    const body = (await request.json()) as SignupInput;
    const db = getDb();

    if (db.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
      return jsonError(409, "email_taken", "An account already uses that email.");
    }

    const user: User = {
      id: newId("u"),
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);

    if (body.role === "patient") {
      db.patients.push({
        id: newId("p"),
        userId: user.id,
        name: body.name,
        phone: body.phone,
        dateOfBirth: "1995-01-01",
        gender: "other",
        allergies: [],
        chronicConditions: [],
        currentMedications: [],
        district: "Dhaka",
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      });
    } else {
      db.doctors.push({
        id: newId("d"),
        userId: user.id,
        name: body.name,
        licenseNumber: "BMDC-PENDING",
        specialties: ["general-medicine"],
        qualifications: ["MBBS"],
        bio: "",
        hospital: "",
        district: "Dhaka",
        languages: ["bn", "en"],
        consultationFee: { amount: 500, currency: "BDT" },
        experienceYears: 0,
        isAvailable: true,
        rating: 0,
        ratingCount: 0,
        consultationCount: 0,
        respondsInMinutes: 15,
        createdAt: user.createdAt,
      });
    }

    commit();
    return HttpResponse.json({ token: `mock.${user.id}`, user }, { status: 201 });
  }),

  http.get(`${BASE}/auth/me`, ({ request }) => {
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");
    return HttpResponse.json(user);
  }),

  // ------------------------------------------------------------- patients

  http.get(`${BASE}/patients/me`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");
    const profile = patientOf(user);
    if (!profile) return jsonError(404, "not_found", "No patient record for this account.");
    return HttpResponse.json(profile);
  }),

  http.patch(`${BASE}/patients/me`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");
    const profile = patientOf(user);
    if (!profile) return jsonError(404, "not_found", "No patient record for this account.");

    const body = (await request.json()) as UpdatePatientProfileInput;
    Object.assign(profile, body, { updatedAt: new Date().toISOString() });
    if (body.name) {
      const account = getDb().users.find((u) => u.id === user.id);
      if (account) account.name = body.name;
    }
    commit();
    return HttpResponse.json(profile);
  }),

  http.get(`${BASE}/patients/:id/summary`, async ({ params }) => {
    await delay(FAST);
    const patient = getDb().patients.find((p) => p.id === params.id);
    if (!patient) return jsonError(404, "not_found", "No such patient.");
    return HttpResponse.json(summarize(patient));
  }),

  /** The doctor's own patient list — everyone they have consulted. */
  http.get(`${BASE}/patients`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    const doctor = user ? doctorOf(user) : undefined;
    if (!doctor) return jsonError(403, "forbidden", "Only doctors can list patients.");

    const db = getDb();
    const ids = new Set(
      db.consultations.filter((c) => c.doctorId === doctor.id).map((c) => c.patientId),
    );
    const url = new URL(request.url);
    const search = (url.searchParams.get("search") ?? "").toLowerCase();

    const summaries = db.patients
      .filter((p) => ids.has(p.id))
      .filter((p) => !search || p.name.toLowerCase().includes(search))
      .map(summarize)
      .sort((a, b) => (b.lastVisitAt ?? "").localeCompare(a.lastVisitAt ?? ""));

    return HttpResponse.json(paginate(summaries, url));
  }),

  // -------------------------------------------------------------- doctors

  http.get(`${BASE}/doctors/me`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");
    const profile = doctorOf(user);
    if (!profile) return jsonError(404, "not_found", "No doctor record for this account.");
    return HttpResponse.json(profile);
  }),

  http.patch(`${BASE}/doctors/me`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");
    const profile = doctorOf(user);
    if (!profile) return jsonError(404, "not_found", "No doctor record for this account.");

    const body = (await request.json()) as UpdateDoctorProfileInput;
    Object.assign(profile, body);
    commit();
    return HttpResponse.json(profile);
  }),

  http.get(`${BASE}/doctors/:id`, async ({ params }) => {
    await delay(FAST);
    const doctor = getDb().doctors.find((d) => d.id === params.id);
    if (!doctor) return jsonError(404, "not_found", "No such doctor.");
    return HttpResponse.json(doctor);
  }),

  http.get(`${BASE}/doctors`, async ({ request }) => {
    await delay(FAST);
    const url = new URL(request.url);
    const specialty = url.searchParams.get("specialty");
    const district = url.searchParams.get("district");
    const language = url.searchParams.get("language");
    const availableOnly = url.searchParams.get("availableOnly") === "true";
    const search = (url.searchParams.get("search") ?? "").toLowerCase();

    const matched = getDb()
      .doctors.filter((d) => !specialty || d.specialties.includes(specialty as never))
      .filter((d) => !district || d.district === district)
      .filter((d) => !language || d.languages.includes(language as never))
      .filter((d) => !availableOnly || d.isAvailable)
      .filter(
        (d) =>
          !search ||
          d.name.toLowerCase().includes(search) ||
          d.hospital.toLowerCase().includes(search),
      )
      // Available first, then by rating: a brilliant doctor who isn't taking
      // requests is not the most useful result for someone who feels unwell now.
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        return b.rating - a.rating;
      });

    return HttpResponse.json(paginate(matched, url));
  }),

  // --------------------------------------------------------------- triage

  http.post(`${BASE}/triage`, async ({ request }) => {
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");
    const patient = patientOf(user);
    if (!patient) return jsonError(403, "forbidden", "Only patients can run a symptom check.");

    const input = (await request.json()) as CreateTriageInput;
    if (!input.description?.trim()) {
      return jsonError(422, "description_required", "Describe what's wrong before continuing.");
    }

    await delay(THINKING);

    const outcome = await assessTriage(
      input,
      { dateOfBirth: patient.dateOfBirth, chronicConditions: patient.chronicConditions },
      localeOf(request),
    );

    const assessment: TriageAssessment = {
      id: newId("t"),
      patientId: patient.id,
      intake: {
        description: input.description,
        symptoms: input.symptoms ?? [],
        durationDays: input.durationDays,
        temperatureC: input.temperatureC,
        mode: input.mode ?? "text",
        attachmentUrls: input.attachmentUrls,
      },
      severity: outcome.severity,
      urgency: outcome.urgency,
      confidence: outcome.confidence,
      summary: outcome.summary,
      redFlags: outcome.redFlags,
      recommendedSpecialties: outcome.recommendedSpecialties,
      suggestedTests: outcome.suggestedTests,
      homeCare: outcome.homeCare,
      model: outcome.model,
      source: outcome.source,
      createdAt: new Date().toISOString(),
    };

    getDb().triages.unshift(assessment);
    if (assessment.severity === "critical") {
      notify(user.id, "triage_critical", {});
    }
    commit();

    return HttpResponse.json(assessment, { status: 201 });
  }),

  http.get(`${BASE}/triage/:id`, async ({ params }) => {
    await delay(FAST);
    const assessment = getDb().triages.find((t) => t.id === params.id);
    if (!assessment) return jsonError(404, "not_found", "No such symptom check.");
    return HttpResponse.json(assessment);
  }),

  http.get(`${BASE}/triage`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    const patient = user ? patientOf(user) : undefined;
    if (!patient) return jsonError(403, "forbidden", "Only patients have symptom checks.");

    const mine = getDb()
      .triages.filter((t) => t.patientId === patient.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json(paginate(mine, new URL(request.url)));
  }),

  // -------------------------------------------------------- consultations

  http.post(`${BASE}/consultations`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    const patient = user ? patientOf(user) : undefined;
    if (!user || !patient) {
      return jsonError(403, "forbidden", "Only patients can request a consultation.");
    }

    const body = (await request.json()) as CreateConsultationInput;
    const db = getDb();
    const doctor = db.doctors.find((d) => d.id === body.doctorId);
    if (!doctor) return jsonError(404, "not_found", "No such doctor.");

    const triage = db.triages.find((t) => t.id === body.triageId);
    const seenBefore = db.consultations.some(
      (c) => c.patientId === patient.id && c.doctorId === doctor.id,
    );

    const consultation: Consultation = {
      id: newId("c"),
      patientId: patient.id,
      doctorId: doctor.id,
      triageId: body.triageId,
      status: "requested",
      patientTag: seenBefore ? "returning" : "new",
      severity: triage?.severity ?? "moderate",
      chiefComplaint: body.chiefComplaint,
      requestedAt: new Date().toISOString(),
      unreadForPatient: 0,
      unreadForDoctor: 0,
    };

    db.consultations.unshift(consultation);
    notify(doctor.userId, "consultation_requested", { patient: patient.name }, {
      consultationId: consultation.id,
    });
    commit();

    return HttpResponse.json(toView(consultation), { status: 201 });
  }),

  http.get(`${BASE}/consultations`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const db = getDb();
    const patient = patientOf(user);
    const doctor = doctorOf(user);

    const mine = db.consultations
      .filter((c) => (patient ? c.patientId === patient.id : c.doctorId === doctor?.id))
      .filter((c) => !status || c.status === status)
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

    const page = paginate(mine, url);
    return HttpResponse.json({ ...page, items: page.items.map(toView) });
  }),

  http.get(`${BASE}/consultations/:id`, async ({ params }) => {
    await delay(FAST);
    const consultation = getDb().consultations.find((c) => c.id === params.id);
    if (!consultation) return jsonError(404, "not_found", "No such consultation.");
    return HttpResponse.json(toView(consultation));
  }),

  http.patch(`${BASE}/consultations/:id`, async ({ params, request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");

    const db = getDb();
    const consultation = db.consultations.find((c) => c.id === params.id);
    if (!consultation) return jsonError(404, "not_found", "No such consultation.");

    const body = (await request.json()) as { status: Consultation["status"]; declineReason?: string };
    const stamp = new Date().toISOString();
    const doctor = db.doctors.find((d) => d.id === consultation.doctorId);
    const patientUserId = userIdForPatient(consultation.patientId);

    switch (body.status) {
      case "accepted":
      case "active": {
        consultation.status = "active";
        consultation.acceptedAt ??= stamp;
        consultation.startedAt ??= stamp;
        db.messages.push({
          id: newId("m"),
          consultationId: consultation.id,
          authorRole: "system",
          authorId: "system",
          authorName: "System",
          body: "",
          attachments: [],
          createdAt: stamp,
          systemCode: "doctor-joined",
          systemParams: { name: `Dr. ${doctor?.name ?? ""}` },
        });
        if (patientUserId) {
          notify(patientUserId, "consultation_accepted", { doctor: `Dr. ${doctor?.name ?? ""}` }, {
            consultationId: consultation.id,
          });
        }
        break;
      }
      case "declined": {
        consultation.status = "declined";
        consultation.declineReason = body.declineReason;
        if (patientUserId) {
          notify(patientUserId, "consultation_declined", { doctor: `Dr. ${doctor?.name ?? ""}` }, {
            consultationId: consultation.id,
          });
        }
        break;
      }
      case "completed": {
        consultation.status = "completed";
        consultation.endedAt = stamp;
        db.messages.push({
          id: newId("m"),
          consultationId: consultation.id,
          authorRole: "system",
          authorId: "system",
          authorName: "System",
          body: "",
          attachments: [],
          createdAt: stamp,
          systemCode: "consultation-ended",
        });
        break;
      }
      case "cancelled": {
        consultation.status = "cancelled";
        break;
      }
      default:
        return jsonError(422, "bad_status", "That status transition isn't allowed.");
    }

    commit();
    return HttpResponse.json(toView(consultation));
  }),

  // ------------------------------------------------------------- messages

  http.get(`${BASE}/consultations/:id/messages`, async ({ params, request }) => {
    await delay(FAST);
    const user = currentUser(request);
    const db = getDb();
    const consultation = db.consultations.find((c) => c.id === params.id);
    if (!consultation) return jsonError(404, "not_found", "No such consultation.");

    // Opening the thread is what marks it read, for whichever side is looking.
    if (user) {
      if (patientOf(user)) consultation.unreadForPatient = 0;
      if (doctorOf(user)) consultation.unreadForDoctor = 0;
      commit();
    }

    const thread = db.messages
      .filter((m) => m.consultationId === params.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return HttpResponse.json({ items: thread, page: 1, pageSize: thread.length, total: thread.length });
  }),

  http.post(`${BASE}/consultations/:id/messages`, async ({ params, request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");

    const db = getDb();
    const consultation = db.consultations.find((c) => c.id === params.id);
    if (!consultation) return jsonError(404, "not_found", "No such consultation.");
    if (consultation.status === "completed" || consultation.status === "declined") {
      return jsonError(409, "consultation_closed", "This consultation has ended.");
    }

    const body = (await request.json()) as SendMessageInput;
    if (!body.body?.trim() && !(body.attachments ?? []).length) {
      return jsonError(422, "empty_message", "Write something before sending.");
    }

    const isDoctor = Boolean(doctorOf(user));
    const message: Message = {
      id: newId("m"),
      consultationId: consultation.id,
      authorRole: isDoctor ? "doctor" : "patient",
      authorId: isDoctor ? consultation.doctorId : consultation.patientId,
      authorName: isDoctor ? `Dr. ${user.name}` : user.name,
      body: body.body ?? "",
      attachments: (body.attachments ?? []).map((a) => ({ ...a, id: newId("a") })),
      createdAt: new Date().toISOString(),
    };

    db.messages.push(message);
    if (isDoctor) consultation.unreadForPatient += 1;
    else consultation.unreadForDoctor += 1;

    const recipientId = isDoctor
      ? userIdForPatient(consultation.patientId)
      : userIdForDoctor(consultation.doctorId);
    if (recipientId) {
      notify(recipientId, "message_received", { name: message.authorName }, {
        consultationId: consultation.id,
      });
    }

    commit();
    return HttpResponse.json(message, { status: 201 });
  }),

  // -------------------------------------------------------------- reports

  http.get(`${BASE}/consultations/:id/reports`, async ({ params }) => {
    await delay(FAST);
    const list = getDb()
      .reports.filter((r) => r.consultationId === params.id)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    return HttpResponse.json({ items: list, page: 1, pageSize: list.length, total: list.length });
  }),

  http.post(`${BASE}/consultations/:id/reports`, async ({ params, request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");

    const db = getDb();
    const consultation = db.consultations.find((c) => c.id === params.id);
    if (!consultation) return jsonError(404, "not_found", "No such consultation.");

    const body = (await request.json()) as UploadReportInput;
    const report: MedicalReport = {
      id: newId("r"),
      consultationId: consultation.id,
      patientId: consultation.patientId,
      kind: body.kind,
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      sizeBytes: body.sizeBytes,
      uploadedBy: user.id,
      uploadedByRole: user.role,
      uploadedAt: new Date().toISOString(),
    };

    db.reports.push(report);
    db.messages.push({
      id: newId("m"),
      consultationId: consultation.id,
      authorRole: "system",
      authorId: "system",
      authorName: "System",
      body: "",
      attachments: [],
      createdAt: report.uploadedAt,
      systemCode: "report-uploaded",
      systemParams: { name: user.name, file: report.fileName },
    });
    commit();

    return HttpResponse.json(report, { status: 201 });
  }),

  http.post(`${BASE}/reports/:id/analyze`, async ({ params, request }) => {
    const db = getDb();
    const report = db.reports.find((r) => r.id === params.id);
    if (!report) return jsonError(404, "not_found", "No such report.");

    await delay(THINKING + 500);

    report.analysis = await analyzeReport(report.kind, report.fileName, localeOf(request));

    const consultation = db.consultations.find((c) => c.id === report.consultationId);
    if (consultation) {
      const recipientId = userIdForDoctor(consultation.doctorId);
      if (recipientId) {
        notify(recipientId, "report_analyzed", { file: report.fileName }, {
          consultationId: consultation.id,
        });
      }
    }
    commit();

    return HttpResponse.json(report);
  }),

  // -------------------------------------------------------------- insight

  http.post(`${BASE}/consultations/:id/insight`, async ({ params, request }) => {
    const db = getDb();
    const consultation = db.consultations.find((c) => c.id === params.id);
    if (!consultation) return jsonError(404, "not_found", "No such consultation.");

    await delay(THINKING);

    const triage = db.triages.find((t) => t.id === consultation.triageId);
    consultation.aiInsight = await computeInsight(
      {
        chiefComplaint: consultation.chiefComplaint,
        triageConceptIds: triage?.intake.symptoms,
        messages: db.messages.filter((m) => m.consultationId === consultation.id),
        reports: db.reports.filter((r) => r.consultationId === consultation.id),
      },
      localeOf(request),
    );
    commit();

    return HttpResponse.json(consultation.aiInsight);
  }),

  // -------------------------------------------------------- prescriptions

  http.post(`${BASE}/consultations/:id/prescription`, async ({ params, request }) => {
    await delay(FAST);
    const user = currentUser(request);
    const doctor = user ? doctorOf(user) : undefined;
    if (!user || !doctor) {
      return jsonError(403, "forbidden", "Only the treating doctor can issue a prescription.");
    }

    const db = getDb();
    const consultation = db.consultations.find((c) => c.id === params.id);
    if (!consultation) return jsonError(404, "not_found", "No such consultation.");

    const body = (await request.json()) as CreatePrescriptionInput;
    if (!body.diagnosis?.trim()) {
      return jsonError(422, "diagnosis_required", "Write a diagnosis before issuing.");
    }

    const patient = db.patients.find((p) => p.id === consultation.patientId)!;
    const stamp = new Date();

    const prescription: Prescription = {
      id: newId("rx"),
      // Serial is human-readable and sortable: SS-YYMM-NNNN.
      serial: `SS-${String(stamp.getFullYear()).slice(2)}${String(stamp.getMonth() + 1).padStart(2, "0")}-${String(
        db.prescriptions.length + 149,
      ).padStart(4, "0")}`,
      consultationId: consultation.id,
      patientId: patient.id,
      doctorId: doctor.id,
      patientName: patient.name,
      patientAge: ageFrom(patient.dateOfBirth),
      patientGender: patient.gender,
      doctorName: doctor.name,
      doctorQualifications: doctor.qualifications,
      doctorLicense: doctor.licenseNumber,
      doctorSpecialties: doctor.specialties,
      diagnosis: body.diagnosis,
      medicines: body.medicines ?? [],
      advice: (body.advice ?? []).filter((a) => a.trim()),
      tests: (body.tests ?? []).filter((t) => t.trim()),
      followUpDays: body.followUpDays,
      issuedAt: stamp.toISOString(),
    };

    db.prescriptions.unshift(prescription);
    consultation.prescriptionId = prescription.id;
    consultation.status = "completed";
    consultation.endedAt = prescription.issuedAt;

    db.messages.push({
      id: newId("m"),
      consultationId: consultation.id,
      authorRole: "system",
      authorId: "system",
      authorName: "System",
      body: "",
      attachments: [],
      createdAt: prescription.issuedAt,
      systemCode: "prescription-issued",
      systemParams: { name: `Dr. ${doctor.name}` },
    });

    const patientUserId = userIdForPatient(patient.id);
    if (patientUserId) {
      notify(patientUserId, "prescription_ready", { doctor: `Dr. ${doctor.name}` }, {
        consultationId: consultation.id,
        prescriptionId: prescription.id,
      });
    }
    commit();

    return HttpResponse.json(prescription, { status: 201 });
  }),

  http.get(`${BASE}/prescriptions/:id`, async ({ params }) => {
    await delay(FAST);
    const prescription = getDb().prescriptions.find((p) => p.id === params.id);
    if (!prescription) return jsonError(404, "not_found", "No such prescription.");
    return HttpResponse.json(prescription);
  }),

  http.get(`${BASE}/prescriptions`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");

    const patient = patientOf(user);
    const doctor = doctorOf(user);
    const mine = getDb()
      .prescriptions.filter((p) => (patient ? p.patientId === patient.id : p.doctorId === doctor?.id))
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

    return HttpResponse.json(paginate(mine, new URL(request.url)));
  }),

  // -------------------------------------------------------- notifications

  http.get(`${BASE}/notifications`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");

    const mine = getDb()
      .notifications.filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({ items: mine, page: 1, pageSize: mine.length, total: mine.length });
  }),

  http.patch(`${BASE}/notifications/read-all`, async ({ request }) => {
    await delay(FAST);
    const user = currentUser(request);
    if (!user) return jsonError(401, "unauthorized", "Sign in to continue.");
    for (const n of getDb().notifications) {
      if (n.userId === user.id) n.read = true;
    }
    commit();
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(`${BASE}/notifications/:id`, async ({ params }) => {
    await delay(FAST);
    const notification = getDb().notifications.find((n) => n.id === params.id);
    if (!notification) return jsonError(404, "not_found", "No such notification.");
    notification.read = true;
    commit();
    return HttpResponse.json(notification);
  }),

  // ----------------------------------------------------------------- demo

  http.post(`${BASE}/demo/reset`, async () => {
    await delay(FAST);
    resetDb();
    return new HttpResponse(null, { status: 204 });
  }),
];
