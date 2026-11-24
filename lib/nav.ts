import {
  ClipboardPlus,
  FileText,
  Home,
  Inbox,
  MessagesSquare,
  Stethoscope,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match child routes too, e.g. /consultations/abc under /consultations. */
  prefix?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export function navFor(role: Role, t: Dictionary): NavSection[] {
  if (role === "doctor") {
    return [
      {
        label: t.nav.sectionPractice,
        items: [
          { href: "/dashboard", label: t.nav.doctor.dashboard, icon: Home },
          { href: "/requests", label: t.nav.doctor.requests, icon: Inbox, prefix: true },
          {
            href: "/consultations",
            label: t.nav.doctor.consultations,
            icon: MessagesSquare,
            prefix: true,
          },
        ],
      },
      {
        label: t.nav.sectionRecords,
        items: [
          { href: "/patients", label: t.nav.doctor.patients, icon: UsersRound, prefix: true },
          { href: "/profile", label: t.nav.doctor.profile, icon: UserRound },
        ],
      },
    ];
  }

  return [
    {
      label: t.nav.sectionCare,
      items: [
        { href: "/dashboard", label: t.nav.patient.dashboard, icon: Home },
        { href: "/triage", label: t.nav.patient.triage, icon: ClipboardPlus, prefix: true },
        { href: "/doctors", label: t.nav.patient.doctors, icon: Stethoscope, prefix: true },
        {
          href: "/consultations",
          label: t.nav.patient.consultations,
          icon: MessagesSquare,
          prefix: true,
        },
      ],
    },
    {
      label: t.nav.sectionRecords,
      items: [
        { href: "/prescriptions", label: t.nav.patient.prescriptions, icon: FileText, prefix: true },
        { href: "/profile", label: t.nav.patient.profile, icon: UserRound },
      ],
    },
  ];
}

export function isActive(pathname: string, item: NavItem): boolean {
  return item.prefix ? pathname === item.href || pathname.startsWith(`${item.href}/`) : pathname === item.href;
}
