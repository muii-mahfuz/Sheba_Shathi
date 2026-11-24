"use client";

import { useCurrentUser } from "@/store/session";
import { DoctorDashboard } from "./doctor-dashboard";
import { PatientDashboard } from "./patient-dashboard";

export default function DashboardPage() {
  const user = useCurrentUser();
  if (!user) return null;
  return user.role === "doctor" ? <DoctorDashboard user={user} /> : <PatientDashboard user={user} />;
}
