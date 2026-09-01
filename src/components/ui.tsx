import Link from "next/link";
import {
  STATUS_LABEL,
  statusOrder,
  statusColor,
  STATUS_MAX_ORDER,
  type ProjectStatus,
} from "@/lib/constants";
import { hasPlate, NO_PLATE_LABEL } from "@/lib/types";

// ---------- Logo + "Detailing Portal" lockup ----------
export function Logo({
  className = "",
  tagline = true,
  height = 28,
}: {
  className?: string;
  tagline?: boolean;
  height?: number;
}) {
  return (
    <span className={`inline-flex items-center ${className}`}>
      {/* echte asset: /public/JURGH-Logo2.svg */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/JURGH-Logo2.svg" alt="JURGH" style={{ height }} className="w-auto" />
      {tagline && (
        <>
          <span className="brand-sep" />
          <span className="brand-tag">Detailing Portal</span>
        </>
      )}
    </span>
  );
}

// ---------- Badge ----------
const toneClasses: Record<string, string> = {
  green: "bg-jurgh-green/15 text-jurgh-green border-jurgh-green/30",
  red: "bg-jurgh-red/15 text-jurgh-red border-jurgh-red/30",
  amber: "bg-jurgh-gold/15 text-jurgh-gold border-jurgh-gold/30",
  neutral: "bg-white/5 text-jurgh-muted border-jurgh-border",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "green" | "red" | "amber" | "neutral";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}

// ---------- Kenteken ----------
// Sinds migratie 0007 mag een auto (nog) geen kenteken hebben; dat moet zichtbaar
// zijn zonder dat de layout verspringt.
export function Plate({
  value,
  className = "",
}: {
  value?: string | null;
  className?: string;
}) {
  // De terugval houdt bewust zijn eigen (gedempte) kleur, los van de className
  // die de aanroeper voor een écht kenteken meegeeft.
  if (!hasPlate(value)) {
    return <span className="italic text-jurgh-muted">{NO_PLATE_LABEL}</span>;
  }
  return <span className={`font-mono uppercase tracking-wide ${className}`}>{value}</span>;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { r, g, b } = hexToRgb(statusColor(status));
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
      style={{
        backgroundColor: `rgba(${r}, ${g}, ${b}, 0.15)`,
        color: `rgb(${r}, ${g}, ${b})`,
        borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

// ---------- Progress bar ----------
export function ProgressBar({
  value,
  className = "",
}: {
  value: number; // 0..100
  className?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-jurgh-black/80 ${className}`}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-jurgh-redDark to-jurgh-red transition-all"
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function StatusProgress({ status }: { status: ProjectStatus }) {
  const pct = Math.round((statusOrder(status) / STATUS_MAX_ORDER) * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-jurgh-muted">
        <span>Voortgang</span>
        <span className="text-jurgh-text">{pct}%</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}

// ---------- Checkmark ----------
export function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-4 w-4 text-jurgh-green ${className}`}
      stroke="currentColor"
      strokeWidth={3}
    >
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------- Empty state ----------
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <p className="text-base font-semibold text-jurgh-text">{title}</p>
      {description && <p className="max-w-md text-sm text-jurgh-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

// ---------- Stat card ----------
export function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-jurgh-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ? "text-jurgh-red" : "text-jurgh-text"}`}>
        {value}
      </p>
    </div>
  );
}

// ---------- Uitklapbare sectie (mobiel: dicht, desktop: standaard open) ----------
export function Collapsible({
  title,
  action,
  children,
}: {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <details className="card group p-6 open:pb-6" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 text-lg font-bold text-jurgh-text">
          <span className="inline-block text-jurgh-muted transition-transform group-open:rotate-90">›</span>
          {title}
        </span>
        {action}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

// ---------- Section heading ----------
export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-jurgh-text">{children}</h2>
      {action}
    </div>
  );
}

// ---------- Car thumbnail with fallback ----------
export function CarThumb({
  src,
  alt,
  className = "",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-jurgh-panel to-jurgh-black ${className}`}
    >
      <svg viewBox="0 0 64 32" className="h-10 w-20 text-jurgh-border" fill="currentColor">
        <path d="M6 22c0-2 1-3 3-3h2l4-7c1-2 3-3 5-3h18c2 0 4 1 5 3l3 5 5 1c2 0 4 2 4 4v3h-6a4 4 0 0 1-8 0H20a4 4 0 0 1-8 0H6v-3z" />
      </svg>
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm text-jurgh-muted hover:text-jurgh-text">
      <span aria-hidden>←</span> {children}
    </Link>
  );
}
