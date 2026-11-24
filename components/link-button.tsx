import Link from "next/link";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "@/components/ui/button";

/**
 * A button that is really a link.
 *
 * Base UI's Button assumes a native `<button>` unless told otherwise, and
 * silently rendering an anchor through it strips the button semantics that
 * forms and screen readers rely on. Wrapping the `nativeButton={false}` pairing
 * once means no call site has to remember it.
 */
export function LinkButton({
  href,
  variant,
  size,
  className,
  children,
  ...props
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & VariantProps<typeof buttonVariants> &
  Omit<React.ComponentProps<typeof Button>, "render" | "nativeButton" | "className">) {
  return (
    <Button
      {...props}
      variant={variant}
      size={size}
      className={className}
      nativeButton={false}
      render={<Link href={href} />}
    >
      {children}
    </Button>
  );
}
