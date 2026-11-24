"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Mic, Square, Thermometer, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTriage } from "@/hooks/queries";
import { useSpeechInput } from "@/hooks/use-speech-input";
import { COMMON_SYMPTOM_IDS } from "@/lib/gemma";
import { useLocale, useT } from "@/lib/i18n/provider";
import type { IntakeMode } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TriagePage() {
  const t = useT();
  const { locale } = useLocale();
  const router = useRouter();
  const createTriage = useCreateTriage();

  const [description, setDescription] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [durationDays, setDurationDays] = useState(3);
  const [temperature, setTemperature] = useState("");
  const [images, setImages] = useState<{ name: string; url: string }[]>([]);
  const [mode, setMode] = useState<IntakeMode>("text");
  const [touched, setTouched] = useState(false);

  const speech = useSpeechInput(locale, (text) => {
    setMode("voice");
    setDescription((prev) => (prev ? `${prev} ${text}` : text));
  });

  const toggleSymptom = (id: string) =>
    setSymptoms((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const addImages = (files: FileList | null) => {
    if (!files) return;
    setMode("image");
    for (const file of Array.from(files).slice(0, 3)) {
      const reader = new FileReader();
      reader.onload = () =>
        setImages((prev) => [...prev, { name: file.name, url: String(reader.result) }]);
      reader.readAsDataURL(file);
    }
  };

  const empty = description.trim().length === 0;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (empty) return;

    createTriage.mutate(
      {
        description: description.trim(),
        symptoms,
        durationDays,
        temperatureC: temperature ? Number(temperature) : undefined,
        mode,
        attachmentUrls: images.map((image) => image.url),
      },
      { onSuccess: (assessment) => router.push(`/triage/${assessment.id}`) },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.triage.title} description={t.triage.subtitle} />

      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-2 rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <Label htmlFor="description" className="text-base">
                {t.triage.describeLabel}
              </Label>

              {speech.supported && (
                <Button
                  type="button"
                  variant={speech.listening ? "default" : "outline"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                >
                  {speech.listening ? (
                    <>
                      <Square className="size-3.5" />
                      {t.triage.voiceStop}
                    </>
                  ) : (
                    <>
                      <Mic className="size-3.5" />
                      {t.triage.voiceLabel}
                    </>
                  )}
                </Button>
              )}
            </div>

            <Textarea
              id="description"
              rows={5}
              placeholder={t.triage.describePlaceholder}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              aria-invalid={touched && empty}
            />

            <p className="text-xs text-muted-foreground">
              {speech.listening ? t.triage.voiceRecording : t.triage.describeHint}
            </p>
            {!speech.supported && (
              <p className="text-xs text-muted-foreground">{t.triage.voiceUnsupported}</p>
            )}
            {touched && empty && (
              <p role="alert" className="text-sm text-destructive">
                {t.triage.emptyError}
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-card p-5">
            <div className="space-y-1">
              <Label className="text-base">{t.triage.symptomsLabel}</Label>
              <p className="text-xs text-muted-foreground">{t.triage.symptomsHint}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOM_IDS.map((id) => {
                const selected = symptoms.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSymptom(id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40 hover:bg-accent",
                    )}
                  >
                    {t.symptom[id]}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <div className="space-y-1.5">
              <Label htmlFor="duration">{t.triage.durationLabel}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="duration"
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(event) => setDurationDays(Math.max(1, Number(event.target.value)))}
                  className="tabular w-24"
                />
                <span className="text-sm text-muted-foreground">{t.triage.durationDays}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="temperature">{t.triage.temperatureLabel}</Label>
              <div className="flex items-center gap-2">
                <Thermometer className="size-4 text-muted-foreground" />
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min={34}
                  max={43}
                  placeholder="38.5"
                  value={temperature}
                  onChange={(event) => setTemperature(event.target.value)}
                  className="tabular w-24"
                />
                <span className="text-sm text-muted-foreground">°C</span>
              </div>
              <p className="text-xs text-muted-foreground">{t.triage.temperatureHint}</p>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border bg-card p-5">
            <div className="space-y-1">
              <Label htmlFor="images">{t.triage.attachmentsLabel}</Label>
              <p className="text-xs text-muted-foreground">{t.triage.attachmentsHint}</p>
            </div>

            <label
              htmlFor="images"
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-accent/50"
            >
              <ImagePlus className="size-4" />
              {t.reports.chooseFile}
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => addImages(event.target.files)}
            />

            {images.length > 0 && (
              <ul className="space-y-1.5">
                {images.map((image, index) => (
                  <li
                    key={`${image.name}-${index}`}
                    className="flex items-center gap-2 rounded-md bg-muted px-2.5 py-1.5 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate">{image.name}</span>
                    <button
                      type="button"
                      aria-label={t.common.remove}
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Button type="submit" size="lg" className="w-full gap-2" disabled={createTriage.isPending}>
            {createTriage.isPending && <Loader2 className="size-4 animate-spin" />}
            {createTriage.isPending ? t.triage.submitting : t.triage.submit}
          </Button>

          <p className="text-xs leading-relaxed text-muted-foreground">{t.ai.triageDisclaimer}</p>
        </div>
      </form>
    </div>
  );
}
