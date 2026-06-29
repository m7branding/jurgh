"use client";

import { useEffect, useState } from "react";
import { ProgressBar, Check } from "@/components/ui";
import {
  TIERS,
  REWARDS,
  currentTier,
  nextTier,
  progressToNext,
  tierOf,
  type Tier,
} from "@/lib/rewards";

function TierBadge({ tier, size = 40 }: { tier: Tier; size?: number }) {
  return (
    <span
      title={tier.label}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(145deg, ${tier.from}, ${tier.to})`,
      }}
      className="inline-flex items-center justify-center rounded-full text-white shadow-card ring-2 ring-white/60"
    >
      <svg viewBox="0 0 24 24" fill="none" style={{ width: size * 0.5, height: size * 0.5 }}>
        <path
          d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 7.7l5.4-.8L12 2z"
          fill="rgba(255,255,255,0.92)"
        />
      </svg>
    </span>
  );
}

export function RewardsPanel({ points }: { points: number }) {
  const [open, setOpen] = useState(false);
  const tier = currentTier(points);
  const upcoming = nextTier(points);
  const { pct, target } = progressToNext(points);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <TierBadge tier={tier} size={56} />
          <div>
            <p className="text-xs uppercase tracking-wide text-jurgh-muted">Jouw niveau</p>
            <p className="text-xl font-bold text-jurgh-text">{tier.label}</p>
            <p className="text-sm text-jurgh-muted">{points.toLocaleString("nl-NL")} JURGH punten</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-ghost shrink-0">
          Bekijk volledige rewards →
        </button>
      </div>

      <div className="border-t border-jurgh-border p-6">
        {target ? (
          <>
            <p className="mb-3 text-sm text-jurgh-muted">
              Je bent <span className="font-semibold text-jurgh-text">{pct}%</span> onderweg naar{" "}
              <span className="font-semibold text-jurgh-text">{target.name}</span> 🎁
            </p>
            <ProgressBar value={pct} />
            <p className="mt-2 text-xs text-jurgh-muted">
              Nog {(target.points - points).toLocaleString("nl-NL")} punten
              {upcoming ? ` · volgend niveau: ${upcoming.label}` : ""}
            </p>
          </>
        ) : (
          <p className="text-sm font-medium text-jurgh-green">
            Alle rewards behaald — je bent Platinum Client! 🏆
          </p>
        )}
      </div>

      {open && <RewardsModal points={points} onClose={() => setOpen(false)} />}
    </section>
  );
}

function RewardsModal({ points, onClose }: { points: number; onClose: () => void }) {
  const tier = currentTier(points);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-b-none rounded-t-2xl p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-jurgh-text">JURGH Rewards</h2>
            <p className="text-sm text-jurgh-muted">
              Verdien punten en klim door de niveaus. 1 punt per bestede euro.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Sluiten"
            className="rounded-lg px-2 py-1 text-jurgh-muted hover:text-jurgh-text"
          >
            ✕
          </button>
        </div>

        {/* Niveau-track met badges */}
        <div className="mb-6 flex items-center justify-between gap-2">
          {TIERS.map((t, i) => {
            const reached = points >= t.min;
            const isCurrent = t.key === tier.key;
            return (
              <div key={t.key} className="flex flex-1 items-center">
                <div className="flex flex-col items-center text-center">
                  <div className={reached ? "opacity-100" : "opacity-40 grayscale"}>
                    <TierBadge tier={t} size={44} />
                  </div>
                  <span
                    className={`mt-1 text-[11px] font-semibold ${
                      isCurrent ? "text-jurgh-text" : "text-jurgh-muted"
                    }`}
                  >
                    {t.label.replace(" Client", "")}
                  </span>
                  <span className="text-[10px] text-jurgh-muted">{t.min}+</span>
                </div>
                {i < TIERS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 flex-1 rounded ${
                      points >= TIERS[i + 1].min ? "bg-jurgh-green" : "bg-jurgh-border"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Reward-pad */}
        <ul className="space-y-3">
          {REWARDS.map((r) => {
            const unlocked = points >= r.points;
            const rt = tierOf(r.tier);
            return (
              <li
                key={r.id}
                className={`flex items-center gap-4 rounded-xl border p-3 ${
                  unlocked ? "border-jurgh-green/40 bg-jurgh-green/5" : "border-jurgh-border"
                }`}
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-jurgh-border bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.image}
                    alt={r.name}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ background: `linear-gradient(145deg, ${rt.from}, ${rt.to})` }}
                      className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                    >
                      {rt.label.replace(" Client", "")}
                    </span>
                    <span className="text-xs text-jurgh-muted">{r.points.toLocaleString("nl-NL")} punten</span>
                  </div>
                  <p className="mt-0.5 font-semibold text-jurgh-text">{r.name}</p>
                  <p className="truncate text-sm text-jurgh-muted">{r.description}</p>
                </div>
                <div className="shrink-0">
                  {unlocked ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-jurgh-green">
                      <Check className="h-4 w-4" /> Behaald
                    </span>
                  ) : (
                    <span className="text-xs text-jurgh-muted">
                      nog {(r.points - points).toLocaleString("nl-NL")}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <button onClick={onClose} className="btn-ghost mt-6 w-full">
          Sluiten
        </button>
      </div>
    </div>
  );
}
