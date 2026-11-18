import { useId } from "react";
import { cn } from "@/lib/utils";

/** Leonida mark: a network signal wave emitting from a node. */
export function LeonidaMark({ className }: { className?: string }) {
  const gid = useId();
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} role="img" aria-label="Leonida">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--primary)" }} />
          <stop offset="1" style={{ stopColor: "var(--signal)" }} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gid})`} />
      <g className="text-primary-foreground" fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M7 24c2.6 0 3.2-9 5.8-9s3.2 13 5.8 13 3.2-17 5.8-17" strokeWidth="2.6" />
        <path d="M28.5 13.2a5 5 0 0 1 0 7.6" strokeWidth="2.2" opacity="0.85" />
        <path d="M31.8 10a9.5 9.5 0 0 1 0 14" strokeWidth="2.2" opacity="0.5" />
      </g>
      <circle cx="24.4" cy="11" r="2.4" className="fill-primary-foreground" />
    </svg>
  );
}

export function LeonidaLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LeonidaMark className="size-9 shrink-0" />
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-semibold tracking-tight">Leonida</div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-signal">HR · SIRH</div>
        </div>
      )}
    </div>
  );
}
