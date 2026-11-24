import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import { LOCALE_COOKIE, LOCALE_TAGS, getDictionary, resolveLocale } from "@/lib/i18n";
import "./globals.css";

/** The active language, from the cookie the language toggle writes. */
async function activeLocale() {
  return resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const t = getDictionary(await activeLocale());
  return {
    title: { default: t.meta.title, template: t.meta.titleTemplate },
    description: t.meta.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read on the server so the first paint is already in the right language.
  // Text can't be patched in before hydration the way a theme class can.
  const locale = await activeLocale();

  return (
    <html
      lang={LOCALE_TAGS[locale]}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
