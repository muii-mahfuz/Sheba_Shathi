"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RolePicker } from "@/components/auth/role-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignup } from "@/hooks/queries";
import { useT } from "@/lib/i18n/provider";
import type { Role } from "@/lib/types";

export default function SignupPage() {
  const t = useT();
  const router = useRouter();
  const signup = useSignup();

  const [role, setRole] = useState<Role>("patient");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t.auth.signupTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.signupSubtitle}</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          signup.mutate(
            { ...form, role },
            { onSuccess: () => router.replace(role === "patient" ? "/profile" : "/dashboard") },
          );
        }}
      >
        <div className="space-y-1.5">
          <Label>{t.auth.iAmA}</Label>
          <RolePicker value={role} onChange={setRole} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">{t.auth.name}</Label>
          <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">{t.auth.phone}</Label>
          <Input
            id="phone"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t.auth.identifierPlaceholder}
            value={form.phone}
            onChange={set("phone")}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={set("password")}
            required
          />
          <p className="text-xs text-muted-foreground">{t.errors.passwordShort}</p>
        </div>

        {signup.isError && (
          <p role="alert" className="text-sm text-destructive">
            {signup.error instanceof Error ? signup.error.message : t.errors.generic}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={signup.isPending}>
          {signup.isPending ? t.auth.creatingAccount : t.auth.createAccount}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          {t.auth.signInLink}
        </Link>
      </p>
    </div>
  );
}
