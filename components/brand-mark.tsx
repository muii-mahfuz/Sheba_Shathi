import { cn } from "@/lib/utils";

/**
 * The mark: a single ECG trace, the same idea as the `.ecg-paper` texture used
 * behind the auth screen and dashboard headers. One motif, used twice, rather
 * than a logo that has nothing to do with the rest of the surface.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 32 32" className="size-6" fill="none" aria-hidden>
        <path
          d="M3 17h5.2l2.4-6.6 3.6 12.4 3.1-9.1 2.1 3.3H29"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BrandLockup({
  name,
  tagline,
  className,
}: {
  name: string;
  tagline?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark />
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-semibold tracking-tight">{name}</span>
        {tagline && (
          <span className="text-[0.7rem] text-muted-foreground">{tagline}</span>
        )}
      </span>
    </span>
  );
}
