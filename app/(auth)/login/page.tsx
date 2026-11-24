"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RolePicker } from "@/components/auth/role-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoLogin, useLogin } from "@/hooks/queries";
import { useT } from "@/lib/i18n/provider";
import type { Role } from "@/lib/types";

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const login = useLogin();
  const demoLogin = useDemoLogin();

  const [role, setRole] = useState<Role>("patient");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const goHome = () => router.replace("/dashboard");

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{t.auth.loginTitle}</h1>
        <p className="text-sm text-muted-foreground">{t.auth.loginSubtitle}</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          login.mutate({ identifier, password, role }, { onSuccess: goHome });
        }}
      >
        <div className="space-y-1.5">
          <Label>{t.auth.iAmA}</Label>
          <RolePicker value={role} onChange={setRole} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="identifier">{t.auth.identifier}</Label>
          <Input
            id="identifier"
            autoComplete="username"
            placeholder={t.auth.identifierPlaceholder}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t.auth.password}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>

        {login.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t.auth.invalidCredentials}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          {login.isPending ? t.auth.signingIn : t.auth.signIn}
        </Button>
      </form>

      <div className="space-y-3 rounded-lg border border-dashed border-border bg-card/60 p-4">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{t.auth.demoTitle}</p>
          <p className="text-xs text-muted-foreground">{t.auth.demoHint}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            size="sm"
            disabled={demoLogin.isPending}
            onClick={() => demoLogin.mutate("patient", { onSuccess: goHome })}
          >
            {t.auth.demoPatient}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={demoLogin.isPending}
            onClick={() => demoLogin.mutate("doctor", { onSuccess: goHome })}
          >
            {t.auth.demoDoctor}
          </Button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t.auth.noAccount}{" "}
        <Link href="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
          {t.auth.signUpLink}
        </Link>
      </p>
    </div>
  );
}
