"use client";

import { Check } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LanguageToggle } from "@/components/shell/language-toggle";
import { useT } from "@/lib/i18n/provider";

/**
 * The unauthenticated frame.
 *
 * The left panel is the thesis: the whole product stated as one sentence, on
 * the ECG-paper texture that recurs throughout the app. It collapses on small
 * screens, where the form is the only thing worth the space.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useT();

  const points = [t.auth.heroPoint1, t.auth.heroPoint2, t.auth.heroPoint3];

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <section className="ecg-paper ecg-paper-light relative hidden bg-sidebar px-12 py-14 text-sidebar-foreground lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
        <div className="inline-flex items-center gap-2.5">
          <BrandMark className="bg-sidebar-primary text-sidebar-primary-foreground" />
          <span className="font-heading text-xl font-semibold tracking-tight text-sidebar-accent-foreground">
            {t.brand.name}
          </span>
        </div>

        <div className="max-w-md space-y-6">
          <h1 className="font-heading text-4xl leading-[1.12] font-semibold tracking-tight text-sidebar-accent-foreground">
            {t.auth.heroHeading}
          </h1>
          <p className="text-[0.95rem] leading-relaxed text-sidebar-foreground/85">
            {t.auth.heroBody}
          </p>
          <ul className="space-y-2.5 pt-1">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-sidebar-primary" />
                <span className="text-sidebar-foreground/90">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/55">{t.demo.banner}</p>
      </section>

      <section className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:justify-end">
          <span className="inline-flex items-center gap-2 lg:hidden">
            <BrandMark className="size-8" />
            <span className="font-heading text-base font-semibold">{t.brand.name}</span>
          </span>
          <LanguageToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </section>
    </div>
  );
}
