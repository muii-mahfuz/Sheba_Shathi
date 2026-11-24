# Sheba Shathi

Sheba Shathi is a bilingual, patient-first telehealth demo for Bangladesh. It turns a patient's own description into an AI-assisted urgency read, connects them to a doctor, and keeps the resulting consultation, report analysis, and prescription in one record.

Bangla (`bn`) is the default locale. English (`en`) is available from the shell language toggle.

## Run it

```bash
pnpm install
pnpm dev
```

That serves the app on `http://localhost:3000`.

For a one-command launch, use `run.bat` on Windows or `./run.sh` on macOS/Linux. The runner installs dependencies if needed and serves on `http://localhost:3100` instead, so it will not collide with a dev server you already have on 3000.

The sign-in screen includes one-click demo accounts:

- Patient: Rahim Uddin (`rahim@example.com`)
- Doctor: Farhana Rahman (`farhana@example.com`)

Any non-empty password works for a known demo account. Demo data is stored in browser localStorage and can be reset from the shell.

## Architecture

```text
app/                  App Router pages and route-group layouts
components/           Shell, domain components, and Base UI primitives
hooks/queries.ts      TanStack Query hooks — the screen data boundary
lib/types/            Frozen domain contract shared by UI and API
lib/mocks/             MSW handlers plus localStorage-backed seed database
lib/gemma/             Gemma client, prompts, Zod validation, and rule fallback
lib/i18n/              Typed English/Bangla dictionaries and formatting
lib/prescription-pdf.ts  Browser-side printable prescription export
store/session.ts      Persisted client session used by the mock auth header
```

The mock API uses REST-shaped endpoints under `/api`. MSW intercepts those requests in the browser, so the UI talks to the same `api` client that a real backend would use. Set `NEXT_PUBLIC_API_MOCKING=disabled` and `NEXT_PUBLIC_API_BASE` when connecting a backend with the same contract.

## Clinical flow

1. `/triage` collects free text, structured symptoms, duration, temperature, voice input, and images.
2. `/triage/[id]` branches on the four-step severity spine: home care, doctor soon, doctor today, or emergency care.
3. `/doctors` matches specialty and availability. A patient can request a consultation with the triage attached.
4. `/consultations/[id]` is the shared workspace: polling chat, patient history, report upload, deterministic vision fallback with bounding boxes, and doctor-only AI insight.
5. A doctor can compose a prescription from AI suggestions, with allergies visible beside the composer, then issue it.
6. `/prescriptions/[id]` renders the signed record and generates a printable PDF in the browser.

AI output is always marked as model-generated or fallback rules. Suggestions never become patient-facing treatment until a doctor writes them into a prescription.

Two clinical rules are enforced in the rule engine rather than left to the prompt: a symptom the patient explicitly denies ("জ্বর নেই") is not counted as present, and no NSAID is suggested while dengue is anywhere in the differential.

The PDF export uses the standard PDF fonts, which cover Latin only. A Bangla field is therefore marked as such in the PDF and stays readable in the app, rather than being silently dropped from the printed record.

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```

The app intentionally uses offline-safe system font fallbacks in the root stylesheet. This keeps production builds deterministic in environments that cannot reach Google Fonts; the named design fonts are still first in the stack when installed locally.
