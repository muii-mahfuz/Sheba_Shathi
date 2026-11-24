"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { Locale } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/i18n/provider";
import { MswProvider } from "./msw-provider";

export function Providers({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            refetchOnWindowFocus: false,
            // Auth failures are answers, not flakes — retrying them just delays
            // the redirect to sign-in.
            retry: (count, error) =>
              count < 1 && !(error instanceof Error && error.message.includes("Sign in")),
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <LocaleProvider initialLocale={locale}>
        <MswProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider delay={200}>
              {children}
              <Toaster richColors closeButton position="top-right" />
            </TooltipProvider>
          </QueryClientProvider>
        </MswProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
