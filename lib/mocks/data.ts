import { runTriageRules } from "@/lib/gemma/triage";
import { analyzeReportRules } from "@/lib/gemma/vision";
import { buildInsight } from "@/lib/gemma/insight";
import type { Locale } from "@/lib/i18n";
import type {
  AppNotification,
  Consultation,
  DoctorProfile,
  MedicalReport,
  Message,
  PatientProfile,
  Prescription,
  TriageAssessment,
  User,
} from "@/lib/types";

/**
 * Seed data.
 *
 * The set is built around one narrative that a demo can walk end to end:
 * Rahim, who is allergic to penicillin, is seen for a cough and fever; his chest
 * film reads as pneumonia; the AI suggests amoxicillin; and the doctor
 * prescribes azithromycin instead. That last step is the point of the whole
 * product — the model proposes, the allergy on file contradicts it, and the
 * doctor decides. Everything else here exists to give that story a queue to sit
 * in and a history to sit on.
 *
 * Timestamps are relative to now, so the data never looks stale.
 */

const now = Date.now();
const minutesAgo = (n: number) => new Date(now - n * 60_000).toISOString();
const hoursAgo = (n: number) => new Date(now - n * 3_600_000).toISOString();
const daysAgo = (n: number) => new Date(now - n * 86_400_000).toISOString();

export interface MockDb {
  users: User[];
  patients: PatientProfile[];
  doctors: DoctorProfile[];
  triages: TriageAssessment[];
  consultations: Consultation[];
  messages: Message[];
  reports: MedicalReport[];
  prescriptions: Prescription[];
  notifications: AppNotification[];
}

/** The two accounts the sign-in screen offers as one-click demo logins. */
export const DEMO_PATIENT_ID = "u-rahim";
export const DEMO_DOCTOR_ID = "u-farhana";

function users(): User[] {
  return [
    {
      id: DEMO_PATIENT_ID,
      name: "Rahim Uddin",
      email: "rahim@example.com",
      phone: "01712345678",
      role: "patient",
      createdAt: daysAgo(210),
    },
    {
      id: "u-shahana",
      name: "Shahana Begum",
      email: "shahana@example.com",
      phone: "01812345679",
      role: "patient",
      createdAt: daysAgo(120),
    },
    {
      id: "u-tanjila",
      name: "Tanjila Akter",
      email: "tanjila@example.com",
      phone: "01912345680",
      role: "patient",
      createdAt: daysAgo(45),
    },
    {
      id: "u-arif",
      name: "Arif Chowdhury",
      email: "arif@example.com",
      phone: "01612345681",
      role: "patient",
      createdAt: daysAgo(88),
    },
    {
      id: DEMO_DOCTOR_ID,
      name: "Farhana Rahman",
      email: "farhana@example.com",
      phone: "01812345678",
      role: "doctor",
      createdAt: daysAgo(400),
    },
    {
      id: "u-imran",
      name: "Imran Hossain",
      email: "imran@example.com",
      phone: "01711111111",
      role: "doctor",
      createdAt: daysAgo(500),
    },
  ];
}

function patients(): PatientProfile[] {
  return [
    {
      id: "p-rahim",
      userId: DEMO_PATIENT_ID,
      name: "Rahim Uddin",
      phone: "01712345678",
      dateOfBirth: "1992-03-14",
      gender: "male",
      bloodGroup: "O+",
      heightCm: 170,
      weightKg: 68,
      // The allergy that the demo turns on.
      allergies: ["Penicillin"],
      chronicConditions: ["Asthma"],
      currentMedications: ["Salbutamol inhaler, as needed"],
      emergencyContact: { name: "Nasrin Akter", phone: "01712345699", relation: "Wife" },
      district: "Cumilla",
      upazila: "Debidwar",
      createdAt: daysAgo(210),
      updatedAt: daysAgo(30),
    },
    {
      id: "p-shahana",
      userId: "u-shahana",
      name: "Shahana Begum",
      phone: "01812345679",
      dateOfBirth: "1968-11-02",
      gender: "female",
      bloodGroup: "B+",
      heightCm: 156,
      weightKg: 74,
      allergies: [],
      chronicConditions: ["Type 2 diabetes", "Hypertension"],
      currentMedications: ["Metformin 500 mg, twice daily", "Amlodipine 5 mg, once daily"],
      emergencyContact: { name: "Kamal Hossain", phone: "01812345688", relation: "Son" },
      district: "Dhaka",
      upazila: "Mirpur",
      createdAt: daysAgo(120),
      updatedAt: daysAgo(12),
    },
    {
      id: "p-tanjila",
      userId: "u-tanjila",
      name: "Tanjila Akter",
      phone: "01912345680",
      dateOfBirth: "1999-06-21",
      gender: "female",
      bloodGroup: "A+",
      heightCm: 160,
      weightKg: 54,
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      district: "Sylhet",
      createdAt: daysAgo(45),
      updatedAt: daysAgo(45),
    },
    {
      id: "p-arif",
      userId: "u-arif",
      name: "Arif Chowdhury",
      phone: "01612345681",
      dateOfBirth: "1981-01-09",
      gender: "male",
      bloodGroup: "AB+",
      heightCm: 174,
      weightKg: 81,
      allergies: ["Sulfa drugs"],
      chronicConditions: [],
      currentMedications: [],
      district: "Chattogram",
      createdAt: daysAgo(88),
      updatedAt: daysAgo(20),
    },
  ];
}

function doctors(): DoctorProfile[] {
  return [
    {
      id: "d-farhana",
      userId: DEMO_DOCTOR_ID,
      name: "Farhana Rahman",
      licenseNumber: "BMDC-A-48211",
      specialties: ["general-medicine", "pulmonology"],
      qualifications: ["MBBS", "FCPS (Medicine)"],
      bio: "Fifteen years in general medicine, with a particular interest in respiratory illness and in getting people the right antibiotic rather than the strongest one.",
      hospital: "Dhaka Medical College Hospital",
      district: "Dhaka",
      languages: ["bn", "en"],
      consultationFee: { amount: 600, currency: "BDT" },
      experienceYears: 15,
      isAvailable: true,
      rating: 4.8,
      ratingCount: 412,
      consultationCount: 1840,
      respondsInMinutes: 6,
      createdAt: daysAgo(400),
    },
    {
      id: "d-imran",
      userId: "u-imran",
      name: "Imran Hossain",
      licenseNumber: "BMDC-A-31907",
      specialties: ["cardiology"],
      qualifications: ["MBBS", "MD (Cardiology)"],
      bio: "Interventional cardiologist. Chest pain, blood pressure that will not settle, and the long conversations both of those need.",
      hospital: "Ibrahim Cardiac Hospital",
      district: "Dhaka",
      languages: ["bn", "en"],
      consultationFee: { amount: 1200, currency: "BDT" },
      experienceYears: 18,
      isAvailable: true,
      rating: 4.9,
      ratingCount: 688,
      consultationCount: 2410,
      respondsInMinutes: 11,
      createdAt: daysAgo(500),
    },
    {
      id: "d-nusrat",
      userId: "u-nusrat",
      name: "Nusrat Jahan",
      licenseNumber: "BMDC-A-52044",
      specialties: ["pediatrics"],
      qualifications: ["MBBS", "DCH"],
      bio: "Children from newborn to fifteen. Happy to be called about a fever at two in the morning.",
      hospital: "Cumilla Medical College Hospital",
      district: "Cumilla",
      languages: ["bn"],
      consultationFee: { amount: 500, currency: "BDT" },
      experienceYears: 9,
      isAvailable: true,
      rating: 4.7,
      ratingCount: 301,
      consultationCount: 1120,
      respondsInMinutes: 8,
      createdAt: daysAgo(300),
    },
    {
      id: "d-abdul",
      userId: "u-abdul",
      name: "Abdul Karim",
      licenseNumber: "BMDC-A-19883",
      specialties: ["gastroenterology", "general-medicine"],
      qualifications: ["MBBS", "MD (Gastroenterology)"],
      bio: "Liver and gut. Twenty-two years of asking people exactly what they ate and when.",
      hospital: "Chattogram Medical College Hospital",
      district: "Chattogram",
      languages: ["bn", "en"],
      consultationFee: { amount: 800, currency: "BDT" },
      experienceYears: 22,
      isAvailable: false,
      rating: 4.6,
      ratingCount: 522,
      consultationCount: 2980,
      respondsInMinutes: 19,
      createdAt: daysAgo(620),
    },
    {
      id: "d-shirin",
      userId: "u-shirin",
      name: "Shirin Akter",
      licenseNumber: "BMDC-A-40566",
      specialties: ["gynecology"],
      qualifications: ["MBBS", "FCPS (Gynaecology & Obstetrics)"],
      bio: "Pregnancy, periods, and everything women are told not to mention.",
      hospital: "Sylhet MAG Osmani Medical College",
      district: "Sylhet",
      languages: ["bn", "en"],
      consultationFee: { amount: 700, currency: "BDT" },
      experienceYears: 14,
      isAvailable: true,
      rating: 4.8,
      ratingCount: 455,
      consultationCount: 1610,
      respondsInMinutes: 9,
      createdAt: daysAgo(380),
    },
    {
      id: "d-tanvir",
      userId: "u-tanvir",
      name: "Tanvir Ahmed",
      licenseNumber: "BMDC-A-45120",
      specialties: ["pulmonology"],
      qualifications: ["MBBS", "MD (Chest Diseases)"],
      bio: "Asthma, COPD, and the cough that has outstayed its welcome.",
      hospital: "National Institute of Diseases of the Chest and Hospital",
      district: "Dhaka",
      languages: ["bn", "en"],
      consultationFee: { amount: 900, currency: "BDT" },
      experienceYears: 11,
      isAvailable: true,
      rating: 4.7,
      ratingCount: 288,
      consultationCount: 990,
      respondsInMinutes: 13,
      createdAt: daysAgo(340),
    },
    {
      id: "d-sabrina",
      userId: "u-sabrina",
      name: "Sabrina Chowdhury",
      licenseNumber: "BMDC-A-56331",
      specialties: ["dermatology"],
      qualifications: ["MBBS", "DDV"],
      bio: "Skin, hair and nails. Send a clear photograph in daylight and we can usually get somewhere.",
      hospital: "Bangabandhu Sheikh Mujib Medical University",
      district: "Dhaka",
      languages: ["bn", "en"],
      consultationFee: { amount: 600, currency: "BDT" },
      experienceYears: 8,
      isAvailable: true,
      rating: 4.5,
      ratingCount: 199,
      consultationCount: 720,
      respondsInMinutes: 15,
      createdAt: daysAgo(260),
    },
    {
      id: "d-mahmudul",
      userId: "u-mahmudul",
      name: "Mahmudul Hasan",
      licenseNumber: "BMDC-A-28744",
      specialties: ["orthopedics"],
      qualifications: ["MBBS", "MS (Orthopaedics)"],
      bio: "Backs, knees and fractures that did not heal the way they should have.",
      hospital: "Rajshahi Medical College Hospital",
      district: "Rajshahi",
      languages: ["bn"],
      consultationFee: { amount: 800, currency: "BDT" },
      experienceYears: 16,
      isAvailable: false,
      rating: 4.6,
      ratingCount: 377,
      consultationCount: 1450,
      respondsInMinutes: 22,
      createdAt: daysAgo(450),
    },
    {
      id: "d-rezaul",
      userId: "u-rezaul",
      name: "Rezaul Karim",
      licenseNumber: "BMDC-A-21095",
      specialties: ["neurology"],
      qualifications: ["MBBS", "MD (Neurology)"],
      bio: "Stroke, epilepsy and headaches that have stopped responding to painkillers.",
      hospital: "National Institute of Neurosciences",
      district: "Dhaka",
      languages: ["bn", "en"],
      consultationFee: { amount: 1500, currency: "BDT" },
      experienceYears: 20,
      isAvailable: true,
      rating: 4.9,
      ratingCount: 512,
      consultationCount: 1780,
      respondsInMinutes: 17,
      createdAt: daysAgo(540),
    },
    {
      id: "d-ayesha",
      userId: "u-ayesha",
      name: "Ayesha Siddika",
      licenseNumber: "BMDC-A-49802",
      specialties: ["psychiatry"],
      qualifications: ["MBBS", "MCPS (Psychiatry)"],
      bio: "Anxiety, low mood and sleep. There is no waiting room here, which some people find easier.",
      hospital: "National Institute of Mental Health",
      district: "Dhaka",
      languages: ["bn", "en"],
      consultationFee: { amount: 1000, currency: "BDT" },
      experienceYears: 10,
      isAvailable: true,
      rating: 4.8,
      ratingCount: 264,
      consultationCount: 830,
      respondsInMinutes: 12,
      createdAt: daysAgo(320),
    },
    {
      id: "d-kamrul",
      userId: "u-kamrul",
      name: "Kamrul Islam",
      licenseNumber: "BMDC-A-38119",
      specialties: ["ent"],
      qualifications: ["MBBS", "DLO"],
      bio: "Ear, nose and throat. Sinus trouble in winter, tonsils all year.",
      hospital: "Khulna Medical College Hospital",
      district: "Khulna",
      languages: ["bn"],
      consultationFee: { amount: 550, currency: "BDT" },
      experienceYears: 13,
      isAvailable: true,
      rating: 4.4,
      ratingCount: 176,
      consultationCount: 940,
      respondsInMinutes: 14,
      createdAt: daysAgo(370),
    },
    {
      id: "d-farida",
      userId: "u-farida",
      name: "Farida Yasmin",
      licenseNumber: "BMDC-A-43277",
      specialties: ["ophthalmology"],
      qualifications: ["MBBS", "DO"],
      bio: "Cataract, glaucoma, and the blurred vision that turns out to be diabetes.",
      hospital: "Cumilla Eye Hospital",
      district: "Cumilla",
      languages: ["bn", "en"],
      consultationFee: { amount: 600, currency: "BDT" },
      experienceYears: 12,
      isAvailable: true,
      rating: 4.6,
      ratingCount: 233,
      consultationCount: 1080,
      respondsInMinutes: 16,
      createdAt: daysAgo(410),
    },
  ];
}

interface TriageSeed {
  id: string;
  patientId: string;
  description: string;
  symptoms: string[];
  durationDays: number;
  temperatureC?: number;
  createdAt: string;
  context: { dateOfBirth: string; chronicConditions: string[] };
}

const TRIAGE_SEEDS: TriageSeed[] = [
  {
    id: "t-rahim-1",
    patientId: "p-rahim",
    description:
      "I've had a cough and fever for three days. My throat hurts when I swallow and I feel weak.",
    symptoms: ["fever", "cough", "sore-throat"],
    durationDays: 3,
    temperatureC: 38.6,
    createdAt: daysAgo(2),
    context: { dateOfBirth: "1992-03-14", chronicConditions: ["Asthma"] },
  },
  {
    id: "t-shahana-1",
    patientId: "p-shahana",
    description:
      "Since this morning there is a heavy pain in my chest and I cannot catch my breath properly.",
    symptoms: ["chest-pain", "breathlessness"],
    durationDays: 1,
    createdAt: minutesAgo(28),
    context: { dateOfBirth: "1968-11-02", chronicConditions: ["Type 2 diabetes", "Hypertension"] },
  },
  {
    id: "t-tanjila-1",
    patientId: "p-tanjila",
    description: "পেটে ব্যথা আর বমি হচ্ছে চার দিন ধরে। কিছু খেলেই খারাপ লাগে।",
    symptoms: ["abdominal-pain", "vomiting"],
    durationDays: 4,
    createdAt: hoursAgo(2),
    context: { dateOfBirth: "1999-06-21", chronicConditions: [] },
  },
  {
    id: "t-arif-1",
    patientId: "p-arif",
    description:
      "Fever for five days with terrible pain in my joints, especially the knees and wrists. Headache behind the eyes.",
    symptoms: ["fever", "joint-pain", "headache"],
    durationDays: 5,
    temperatureC: 39.2,
    createdAt: hoursAgo(4),
    context: { dateOfBirth: "1981-01-09", chronicConditions: [] },
  },
];

function triages(locale: Locale): TriageAssessment[] {
  return TRIAGE_SEEDS.map((seed) => {
    const input = {
      description: seed.description,
      symptoms: seed.symptoms,
      durationDays: seed.durationDays,
      temperatureC: seed.temperatureC,
      mode: "text" as const,
    };
    const computed = runTriageRules(input, seed.context, locale);
    return {
      id: seed.id,
      patientId: seed.patientId,
      intake: input,
      severity: computed.severity,
      urgency: computed.urgency,
      confidence: computed.confidence,
      summary: computed.summary,
      redFlags: computed.redFlags,
      recommendedSpecialties: computed.recommendedSpecialties,
      suggestedTests: computed.suggestedTests,
      homeCare: computed.homeCare,
      model: "rule-based",
      source: "fallback" as const,
      createdAt: seed.createdAt,
    };
  });
}

function reports(): MedicalReport[] {
  return [
    {
      id: "r-rahim-xray",
      consultationId: "c-rahim-farhana",
      patientId: "p-rahim",
      kind: "xray",
      fileName: "chest-xray-rahim.svg",
      fileUrl: "/samples/chest-xray.svg",
      sizeBytes: 214_000,
      uploadedBy: DEMO_PATIENT_ID,
      uploadedByRole: "patient",
      uploadedAt: daysAgo(2),
      analysis: analyzeReportRules("xray", "chest-xray-rahim.svg"),
    },
  ];
}

function consultationSeeds(triageList: TriageAssessment[]): Consultation[] {
  const severityOf = (id: string) => triageList.find((t) => t.id === id)?.severity ?? "moderate";

  return [
    {
      id: "c-rahim-farhana",
      patientId: "p-rahim",
      doctorId: "d-farhana",
      triageId: "t-rahim-1",
      status: "completed",
      patientTag: "returning",
      severity: severityOf("t-rahim-1"),
      chiefComplaint: "Cough and fever for three days, sore throat",
      requestedAt: daysAgo(2),
      acceptedAt: daysAgo(2),
      startedAt: daysAgo(2),
      endedAt: daysAgo(2),
      prescriptionId: "rx-rahim-1",
      unreadForPatient: 0,
      unreadForDoctor: 0,
    },
    {
      id: "c-arif-farhana",
      patientId: "p-arif",
      doctorId: "d-farhana",
      triageId: "t-arif-1",
      status: "active",
      patientTag: "new",
      severity: severityOf("t-arif-1"),
      chiefComplaint: "Fever and severe joint pain for five days",
      requestedAt: hoursAgo(4),
      acceptedAt: minutesAgo(22),
      startedAt: minutesAgo(21),
      unreadForPatient: 0,
      unreadForDoctor: 1,
    },
    {
      id: "c-shahana-farhana",
      patientId: "p-shahana",
      doctorId: "d-farhana",
      triageId: "t-shahana-1",
      status: "requested",
      patientTag: "new",
      severity: severityOf("t-shahana-1"),
      chiefComplaint: "Chest pain and breathlessness since this morning",
      requestedAt: minutesAgo(26),
      unreadForPatient: 0,
      unreadForDoctor: 0,
    },
    {
      id: "c-tanjila-farhana",
      patientId: "p-tanjila",
      doctorId: "d-farhana",
      triageId: "t-tanjila-1",
      status: "requested",
      patientTag: "new",
      severity: severityOf("t-tanjila-1"),
      chiefComplaint: "পেটে ব্যথা আর বমি, চার দিন ধরে",
      requestedAt: hoursAgo(2),
      unreadForPatient: 0,
      unreadForDoctor: 0,
    },
    {
      id: "c-rahim-imran",
      patientId: "p-rahim",
      doctorId: "d-imran",
      status: "completed",
      patientTag: "new",
      severity: "moderate",
      chiefComplaint: "Palpitations after climbing stairs",
      requestedAt: daysAgo(41),
      acceptedAt: daysAgo(41),
      startedAt: daysAgo(41),
      endedAt: daysAgo(41),
      prescriptionId: "rx-rahim-2",
      unreadForPatient: 0,
      unreadForDoctor: 0,
    },
  ];
}

function messages(): Message[] {
  const c1 = "c-rahim-farhana";
  const c4 = "c-arif-farhana";

  const m = (
    id: string,
    consultationId: string,
    authorRole: Message["authorRole"],
    authorId: string,
    authorName: string,
    body: string,
    createdAt: string,
    extra: Partial<Message> = {},
  ): Message => ({
    id,
    consultationId,
    authorRole,
    authorId,
    authorName,
    body,
    attachments: [],
    createdAt,
    ...extra,
  });

  return [
    // The completed consultation, start to finish.
    m("m-1", c1, "system", "system", "System", "", daysAgo(2), {
      systemCode: "doctor-joined",
      systemParams: { name: "Dr. Farhana Rahman" },
    }),
    m(
      "m-2",
      c1,
      "doctor",
      "d-farhana",
      "Dr. Farhana Rahman",
      "Assalamu alaikum Rahim. I've read your symptom check — cough and fever for three days. Is the cough dry, or is anything coming up?",
      daysAgo(2),
    ),
    m(
      "m-3",
      c1,
      "patient",
      "p-rahim",
      "Rahim Uddin",
      "Walaikum assalam. Something comes up, yellowish. And since yesterday my chest feels tight when I breathe deeply.",
      daysAgo(2),
    ),
    m(
      "m-4",
      c1,
      "doctor",
      "d-farhana",
      "Dr. Farhana Rahman",
      "With your asthma I want to see a chest X-ray before deciding anything. Can you get a PA film done and upload it here?",
      daysAgo(2),
    ),
    m("m-5", c1, "patient", "p-rahim", "Rahim Uddin", "Done, uploading it now.", daysAgo(2), {
      attachments: [
        {
          id: "a-1",
          kind: "report",
          url: "/samples/chest-xray.svg",
          name: "chest-xray-rahim.svg",
          sizeBytes: 214_000,
          reportId: "r-rahim-xray",
        },
      ],
    }),
    m("m-6", c1, "system", "system", "System", "", daysAgo(2), {
      systemCode: "report-uploaded",
      systemParams: { name: "Rahim Uddin", file: "chest-xray-rahim.svg" },
    }),
    m(
      "m-7",
      c1,
      "doctor",
      "d-farhana",
      "Dr. Farhana Rahman",
      "There is patchy shadowing in your right lower zone — that's a pneumonia. It needs an antibiotic. You're allergic to penicillin, so amoxicillin is out; I'll put you on azithromycin instead.",
      daysAgo(2),
    ),
    m(
      "m-8",
      c1,
      "patient",
      "p-rahim",
      "Rahim Uddin",
      "Thank you doctor. Should I keep using my inhaler?",
      daysAgo(2),
    ),
    m(
      "m-9",
      c1,
      "doctor",
      "d-farhana",
      "Dr. Farhana Rahman",
      "Yes, carry on with it as you normally do. If you become more breathless or the fever crosses 39°C, go to hospital the same day rather than messaging me.",
      daysAgo(2),
    ),
    m("m-10", c1, "system", "system", "System", "", daysAgo(2), {
      systemCode: "prescription-issued",
      systemParams: { name: "Dr. Farhana Rahman" },
    }),

    // The live one, mid-conversation.
    m("m-20", c4, "system", "system", "System", "", minutesAgo(21), {
      systemCode: "doctor-joined",
      systemParams: { name: "Dr. Farhana Rahman" },
    }),
    m(
      "m-21",
      c4,
      "doctor",
      "d-farhana",
      "Dr. Farhana Rahman",
      "Five days of fever with joint pain and pain behind the eyes. Has anyone in your household had dengue this month?",
      minutesAgo(19),
    ),
    m(
      "m-22",
      c4,
      "patient",
      "p-arif",
      "Arif Chowdhury",
      "My neighbour's son was admitted last week with dengue. I have not been tested.",
      minutesAgo(16),
    ),
    m(
      "m-23",
      c4,
      "doctor",
      "d-farhana",
      "Dr. Farhana Rahman",
      "Then we test today. Get a CBC with platelet count and a dengue NS1 antigen. Do not take any painkiller other than paracetamol until we have the platelet number.",
      minutesAgo(14),
    ),
    m(
      "m-24",
      c4,
      "patient",
      "p-arif",
      "Arif Chowdhury",
      "I did a blood test yesterday at a local lab. Shall I send that?",
      minutesAgo(3),
    ),
  ];
}

function prescriptions(): Prescription[] {
  return [
    {
      id: "rx-rahim-1",
      serial: "SS-2607-0148",
      consultationId: "c-rahim-farhana",
      patientId: "p-rahim",
      doctorId: "d-farhana",
      patientName: "Rahim Uddin",
      patientAge: 34,
      patientGender: "male",
      doctorName: "Farhana Rahman",
      doctorQualifications: ["MBBS", "FCPS (Medicine)"],
      doctorLicense: "BMDC-A-48211",
      doctorSpecialties: ["General medicine", "Pulmonology"],
      diagnosis: "Community-acquired pneumonia, right lower lobe",
      medicines: [
        {
          name: "Azithromycin",
          strength: "500 mg",
          form: "tablet",
          frequency: "once-daily",
          durationDays: 5,
          // The whole point of the demo, written into the record.
          instruction: "After food. Chosen over amoxicillin — patient is allergic to penicillin.",
        },
        {
          name: "Paracetamol",
          strength: "500 mg",
          form: "tablet",
          frequency: "thrice-daily",
          durationDays: 5,
          instruction: "After food, for fever",
        },
      ],
      advice: [
        "Continue your salbutamol inhaler as usual.",
        "Rest at home for five days and drink plenty of fluids.",
        "Go to hospital the same day if breathlessness worsens or fever crosses 39°C.",
      ],
      tests: ["Repeat chest X-ray after 2 weeks"],
      followUpDays: 7,
      issuedAt: daysAgo(2),
    },
    {
      id: "rx-rahim-2",
      serial: "SS-2506-0092",
      consultationId: "c-rahim-imran",
      patientId: "p-rahim",
      doctorId: "d-imran",
      patientName: "Rahim Uddin",
      patientAge: 34,
      patientGender: "male",
      doctorName: "Imran Hossain",
      doctorQualifications: ["MBBS", "MD (Cardiology)"],
      doctorLicense: "BMDC-A-31907",
      doctorSpecialties: ["Cardiology"],
      diagnosis: "Sinus tachycardia on exertion; no structural heart disease found",
      medicines: [],
      advice: [
        "Your ECG and echo were normal. This is deconditioning, not heart disease.",
        "Walk 30 minutes a day and reduce caffeine to one cup.",
        "Come back if you get chest pain or faint.",
      ],
      tests: ["ECG", "Echocardiogram"],
      issuedAt: daysAgo(41),
    },
  ];
}

function notifications(): AppNotification[] {
  return [
    {
      id: "n-1",
      userId: DEMO_DOCTOR_ID,
      kind: "consultation_requested",
      params: { patient: "Shahana Begum" },
      consultationId: "c-shahana-farhana",
      read: false,
      createdAt: minutesAgo(26),
    },
    {
      id: "n-2",
      userId: DEMO_DOCTOR_ID,
      kind: "message_received",
      params: { name: "Arif Chowdhury" },
      consultationId: "c-arif-farhana",
      read: false,
      createdAt: minutesAgo(3),
    },
    {
      id: "n-3",
      userId: DEMO_DOCTOR_ID,
      kind: "consultation_requested",
      params: { patient: "Tanjila Akter" },
      consultationId: "c-tanjila-farhana",
      read: true,
      createdAt: hoursAgo(2),
    },
    {
      id: "n-4",
      userId: DEMO_PATIENT_ID,
      kind: "prescription_ready",
      params: { doctor: "Dr. Farhana Rahman" },
      consultationId: "c-rahim-farhana",
      prescriptionId: "rx-rahim-1",
      read: false,
      createdAt: daysAgo(2),
    },
    {
      id: "n-5",
      userId: DEMO_PATIENT_ID,
      kind: "report_analyzed",
      params: { file: "chest-xray-rahim.svg" },
      consultationId: "c-rahim-farhana",
      read: true,
      createdAt: daysAgo(2),
    },
  ];
}

export function seedDb(locale: Locale): MockDb {
  const triageList = triages(locale);
  const consultationList = consultationSeeds(triageList);
  const messageList = messages();
  const reportList = reports();

  // Give the live consultation an insight so the doctor's panel has something
  // in it the moment the demo opens the session.
  const live = consultationList.find((c) => c.id === "c-arif-farhana");
  if (live) {
    live.aiInsight = buildInsight({
      chiefComplaint: live.chiefComplaint,
      triageConceptIds: ["fever", "joint-pain", "headache"],
      messages: messageList.filter((m) => m.consultationId === live.id),
      reports: [],
    });
  }

  const completed = consultationList.find((c) => c.id === "c-rahim-farhana");
  if (completed) {
    completed.aiInsight = buildInsight({
      chiefComplaint: completed.chiefComplaint,
      triageConceptIds: ["fever", "cough", "sore-throat"],
      messages: messageList.filter((m) => m.consultationId === completed.id),
      reports: reportList.filter((r) => r.consultationId === completed.id),
    });
  }

  return {
    users: users(),
    patients: patients(),
    doctors: doctors(),
    triages: triageList,
    consultations: consultationList,
    messages: messageList,
    reports: reportList,
    prescriptions: prescriptions(),
    notifications: notifications(),
  };
}
