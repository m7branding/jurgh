"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CATALOG,
  CATEGORY_BY_ID,
  CATEGORY_ORDER,
  GOALS,
  PKG_BY_ID,
  STAGES,
  formatEuro,
  journeyFor,
  recommendationsFor,
  type Category,
  type IconKey,
  type Pkg,
} from "@/lib/catalog";
import { CategoryIcon } from "./CategoryIcon";
import { Starfield } from "./Starfield";

const INTRO_MAILTO =
  "mailto:hello@m7branding.com?subject=" +
  encodeURIComponent("Kennismakingsgesprek aanvragen") +
  "&body=" +
  encodeURIComponent(
    "Hoi M7,\n\nIk kom graag vrijblijvend kennismaken en sparren over de mogelijkheden.\n\nNaam:\nBedrijf:\nTelefoon:\nWaar ik mee wil starten:\n"
  );

// ------------------------------------------------------------ kleine icons
function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
function Sparkle() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  );
}

// ------------------------------------------------------------ hook: count-up
function useAnimatedNumber(value: number) {
  const [display, setDisplay] = useState(value);
  const from = useRef(value);
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    const start = performance.now();
    const a = from.current;
    const b = value;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 420);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(a + (b - a) * eased));
      if (k < 1) raf.current = requestAnimationFrame(step);
      else from.current = b;
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);
  return display;
}

// ------------------------------------------------------------ price label
function priceLabel(price: Pkg["price"]) {
  const { setup, monthly, custom, suffix } = price;
  const hasMonthly = typeof monthly === "number" && monthly > 0;
  const hasSetup = typeof setup === "number" && setup > 0;
  if (!hasMonthly && !hasSetup) {
    return { main: "Op aanvraag", unit: "", sub: "" };
  }
  if (hasMonthly) {
    return {
      main: `${formatEuro(monthly!)}${custom ? "" : ""}`,
      unit: `/mnd${suffix === "stuk" ? " · p/stuk" : ""}${custom ? " vanaf" : ""}`,
      sub: hasSetup ? `+ ${formatEuro(setup!)} eenmalig` : "",
    };
  }
  // enkel eenmalig / per stuk
  const unitMap: Record<string, string> = { stuk: "per stuk", "afl.": "per afl." };
  return {
    main: formatEuro(setup!),
    unit: suffix && unitMap[suffix] ? unitMap[suffix] : "eenmalig",
    sub: "",
  };
}

// ============================================================ CARD
function PkgCard({
  pkg,
  selected,
  qty,
  onToggle,
  onQty,
  reveal,
}: {
  pkg: Pkg;
  selected: boolean;
  qty: number;
  onToggle: () => void;
  onQty: (delta: number) => void;
  reveal: (el: HTMLElement | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const p = priceLabel(pkg.price);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 6}deg) translateY(-2px)`;
  };
  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
  };

  const isItem = pkg.kind === "item";

  return (
    <div
      ref={(el) => {
        (ref as any).current = el;
        reveal(el);
      }}
      className={`exp-card exp-reveal ${selected ? "is-selected" : ""} ${pkg.highlight ? "is-highlight" : ""}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={(e) => {
        // klik op de kaart zelf (niet op stepper-knoppen) toggelt/voegt toe
        if ((e.target as HTMLElement).closest(".exp-qty")) return;
        if (isItem && qty === 0) onQty(1);
        else if (isItem && qty > 0) return; // beheer via stepper
        else onToggle();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          isItem ? onQty(qty > 0 ? -qty : 1) : onToggle();
        }
      }}
    >
      <div className="exp-card-top">
        <div>
          <h3>{pkg.name}</h3>
          <p className="exp-card-tag">{pkg.tagline}</p>
        </div>
        {pkg.badge && <span className="exp-badge">{pkg.badge}</span>}
      </div>

      <div className="exp-price">
        <span className="exp-price-main">{p.main}</span>
        {p.unit && <span className="exp-price-unit">{p.unit}</span>}
      </div>
      {p.sub && <div className="exp-price-sub">{p.sub}</div>}

      <ul className="exp-features">
        {pkg.features.map((f) => (
          <li key={f}>
            <Check />
            {f}
          </li>
        ))}
      </ul>

      <div className="exp-card-foot">
        {isItem && qty > 0 ? (
          <>
            <div className="exp-qty" onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => onQty(-1)} aria-label="minder">
                –
              </button>
              <span>{qty}×</span>
              <button type="button" onClick={() => onQty(1)} aria-label="meer">
                +
              </button>
            </div>
            <button type="button" className="exp-select-btn" onClick={(e) => { e.stopPropagation(); onQty(-qty); }}>
              Verwijderen
            </button>
          </>
        ) : (
          <button type="button" className="exp-select-btn">
            {selected ? "✓ Toegevoegd" : isItem ? "Toevoegen" : pkg.kind === "addon" ? "+ Toevoegen" : "Kies dit plan"}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================ SECTION
function Section({
  cat,
  isRecommended,
  state,
  onPlan,
  onAddon,
  onQty,
  onOption,
  onGoTo,
  reveal,
  registerSection,
}: {
  cat: Category;
  isRecommended: boolean;
  state: ConfigState;
  onPlan: (catId: IconKey, pkgId: string) => void;
  onAddon: (pkgId: string) => void;
  onQty: (pkgId: string, delta: number) => void;
  onOption: (optId: string, value: string, multi: boolean) => void;
  onGoTo: (catId: IconKey) => void;
  reveal: (el: HTMLElement | null) => void;
  registerSection: (id: IconKey, el: HTMLElement | null) => void;
}) {
  const recs = state.recommendations;
  const recCats = [...recs].filter((r) => r !== cat.id).map((r) => CATEGORY_BY_ID[r]);

  return (
    <section
      className="exp-section"
      id={`cat-${cat.id}`}
      ref={(el) => registerSection(cat.id, el)}
    >
      <div className="exp-section-head exp-reveal" ref={(el) => reveal(el)}>
        <div className="exp-section-badge">
          <CategoryIcon name={cat.id} />
        </div>
        <div>
          <span className="exp-eyebrow">{cat.kicker}</span>
          <h2>{cat.label}</h2>
          <p className="exp-section-blurb">{cat.blurb}</p>
        </div>
      </div>

      {cat.options && cat.options.length > 0 && (
        <div className="exp-options exp-reveal" ref={(el) => reveal(el)}>
          {cat.options.map((opt) => {
            const picked = state.options[opt.id] ?? [];
            return (
              <div key={opt.id}>
                <div className="exp-opt-label">{opt.label}</div>
                {opt.multi ? (
                  <div className="exp-opt-chips">
                    {opt.choices.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`exp-opt-chip ${picked.includes(c) ? "is-on" : ""}`}
                        onClick={() => onOption(opt.id, c, true)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="exp-seg">
                    {opt.choices.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={picked.includes(c) ? "is-on" : ""}
                        onClick={() => onOption(opt.id, c, false)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="exp-cards">
        {cat.packages.map((pkg) => {
          const selected =
            pkg.kind === "plan"
              ? state.plans[cat.id] === pkg.id
              : pkg.kind === "addon"
              ? state.addons.includes(pkg.id)
              : (state.qty[pkg.id] ?? 0) > 0;
          return (
            <PkgCard
              key={pkg.id}
              pkg={pkg}
              selected={selected}
              qty={state.qty[pkg.id] ?? 0}
              onToggle={() => (pkg.kind === "plan" ? onPlan(cat.id, pkg.id) : onAddon(pkg.id))}
              onQty={(d) => onQty(pkg.id, d)}
              reveal={reveal}
            />
          );
        })}
      </div>

      {cat.note && <p className="exp-note">{cat.note}</p>}

      {isRecommended && recCats.length > 0 && (
        <div className="exp-recs exp-reveal" ref={(el) => reveal(el)}>
          <strong>
            <Sparkle /> Slim erbij →
          </strong>
          {recCats.map((rc) => (
            <button key={rc.id} type="button" className="exp-rec-btn" onClick={() => onGoTo(rc.id)}>
              <CategoryIcon name={rc.id} />
              {rc.label}
              <Arrow />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

// ============================================================ types
type ConfigState = {
  plans: Partial<Record<IconKey, string>>;
  addons: string[];
  qty: Record<string, number>;
  options: Record<string, string[]>;
  recommendations: Set<IconKey>;
};

// ============================================================ MAIN
export function Configurator() {
  const [plans, setPlans] = useState<Partial<Record<IconKey, string>>>({});
  const [addons, setAddons] = useState<string[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [activeCat, setActiveCat] = useState<IconKey>(CATALOG[0].id);
  const [modalOpen, setModalOpen] = useState(false);

  // ---- intake (waar sta je / wat wil je bereiken)
  const [stage, setStage] = useState<string | null>(null);
  const [goals, setGoals] = useState<string[]>([]);
  const journey = useMemo(() => journeyFor(stage, goals), [stage, goals]);
  const journeyIndex = useMemo(() => {
    const m = new Map<IconKey, number>();
    journey.forEach((c, i) => m.set(c, i + 1));
    return m;
  }, [journey]);

  const sectionRefs = useRef<Partial<Record<IconKey, HTMLElement>>>({});
  const io = useRef<IntersectionObserver | null>(null);

  // ---- afgeleide selectie
  const selectedIds = useMemo(() => {
    const s = new Set<string>();
    Object.values(plans).forEach((id) => id && s.add(id));
    addons.forEach((id) => s.add(id));
    Object.entries(qty).forEach(([id, n]) => n > 0 && s.add(id));
    return s;
  }, [plans, addons, qty]);

  const recommendations = useMemo(
    () => recommendationsFor(selectedIds, options),
    [selectedIds, options]
  );

  // ---- totalen
  const totals = useMemo(() => {
    let setup = 0;
    let monthly = 0;
    let custom = false;
    for (const id of selectedIds) {
      const entry = PKG_BY_ID[id];
      if (!entry) continue;
      const { price } = entry.pkg;
      const n = entry.pkg.kind === "item" ? qty[id] ?? 1 : 1;
      if (price.setup) setup += price.setup * n;
      if (price.monthly) monthly += price.monthly * n;
      if (price.custom) custom = true;
    }
    return { setup, monthly, custom };
  }, [selectedIds, qty]);

  const animSetup = useAnimatedNumber(totals.setup);
  const animMonthly = useAnimatedNumber(totals.monthly);

  // ---- reveal on scroll
  const reveal = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    if (!io.current) {
      io.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              io.current?.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
    }
    io.current.observe(el);
  }, []);

  // ---- scroll spy voor actieve tab
  const registerSection = useCallback((id: IconKey, el: HTMLElement | null) => {
    if (el) sectionRefs.current[id] = el;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight * 0.35;
      let current = CATALOG[0].id;
      for (const cat of CATALOG) {
        const el = sectionRefs.current[cat.id];
        if (el && el.getBoundingClientRect().top <= mid) current = cat.id;
      }
      setActiveCat(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = useCallback((catId: IconKey) => {
    sectionRefs.current[catId]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ---- selectie-handlers
  const onPlan = (catId: IconKey, pkgId: string) =>
    setPlans((p) => ({ ...p, [catId]: p[catId] === pkgId ? undefined : pkgId }));
  const onAddon = (pkgId: string) =>
    setAddons((a) => (a.includes(pkgId) ? a.filter((x) => x !== pkgId) : [...a, pkgId]));
  const onQtyChange = (pkgId: string, delta: number) =>
    setQty((q) => {
      const next = Math.max(0, (q[pkgId] ?? 0) + delta);
      const copy = { ...q };
      if (next === 0) delete copy[pkgId];
      else copy[pkgId] = next;
      return copy;
    });
  const onOption = (optId: string, value: string, multi: boolean) =>
    setOptions((o) => {
      const cur = o[optId] ?? [];
      if (multi) {
        return { ...o, [optId]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
      }
      return { ...o, [optId]: cur[0] === value ? [] : [value] };
    });

  const state: ConfigState = { plans, addons, qty, options, recommendations };

  // ---- tab-counts (aantal selecties per categorie)
  const countFor = (cat: Category) =>
    cat.packages.filter((pkg) =>
      pkg.kind === "plan"
        ? plans[cat.id] === pkg.id
        : pkg.kind === "addon"
        ? addons.includes(pkg.id)
        : (qty[pkg.id] ?? 0) > 0
    ).length;

  const totalCount = selectedIds.size;

  return (
    <>
      <Starfield />
      <div className="exp-bg-gradients" />
      <div className="exp-grid-overlay" />

      <div className="exp-shell">
        {/* -------- HERO -------- */}
        <header className="exp-hero">
          <span className="exp-eyebrow">
            <Sparkle /> M7 — online experience
          </span>
          <h1>
            Bouw je eigen <span className="exp-grad-text">digitale slagkracht</span>
          </h1>
          <p>
            Vergeet tig losse offertes. Vertel ons waar je staat en wat je wilt bereiken — wij
            zetten een logisch pad uit door de hele catalogus: van branding, websites, webshops en
            apps tot marketing, SEO/AEO, funnels, tracking, hosting en support.
          </p>

          {/* -------- INTAKE -------- */}
          <div className="exp-intake exp-reveal" ref={(el) => reveal(el)}>
            <div className="exp-intake-step">
              <div className="exp-intake-q">
                <span className="exp-intake-num">1</span> Waar sta je nu?
              </div>
              <div className="exp-opt-chips" style={{ justifyContent: "center" }}>
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`exp-opt-chip ${stage === s.id ? "is-on" : ""}`}
                    title={s.desc}
                    onClick={() => setStage((cur) => (cur === s.id ? null : s.id))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="exp-intake-step">
              <div className="exp-intake-q">
                <span className="exp-intake-num">2</span> Wat wil je bereiken?{" "}
                <span className="exp-intake-hint">meerdere mogelijk</span>
              </div>
              <div className="exp-opt-chips" style={{ justifyContent: "center" }}>
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={`exp-opt-chip ${goals.includes(g.id) ? "is-on" : ""}`}
                    onClick={() =>
                      setGoals((cur) =>
                        cur.includes(g.id) ? cur.filter((x) => x !== g.id) : [...cur, g.id]
                      )
                    }
                  >
                    <span aria-hidden style={{ opacity: 0.85 }}>{g.emoji}</span> {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* -------- JOUW PAD -------- */}
          {journey.length > 0 ? (
            <div className="exp-path exp-reveal" ref={(el) => reveal(el)}>
              <div className="exp-path-label">
                <Sparkle /> Jouw aanbevolen pad
              </div>
              <div className="exp-path-flow">
                {journey.map((cid, i) => (
                  <span key={cid} className="exp-path-node-wrap">
                    <button className="exp-path-node" onClick={() => goTo(cid)}>
                      <span className="exp-path-node-num">{i + 1}</span>
                      <CategoryIcon name={cid} />
                      {CATEGORY_BY_ID[cid].label}
                    </button>
                    {i < journey.length - 1 && <span className="exp-path-arrow"><Arrow /></span>}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="exp-hero-cta">
            <button
              className="exp-btn exp-btn-primary"
              onClick={() => goTo(journey[0] ?? CATALOG[0].id)}
            >
              {journey.length > 0 ? "Start bij stap 1" : "Begin met samenstellen"} <Arrow />
            </button>
            <a className="exp-btn exp-btn-ghost" href={INTRO_MAILTO}>
              Plan een kennismaking
            </a>
          </div>
          <p className="exp-note" style={{ textAlign: "center", marginTop: 18 }}>
            Alle bedragen zijn indicatieve vanafprijzen. De uiteindelijke scope bepalen we samen —
            geheel vrijblijvend.
          </p>
        </header>

        {/* -------- RAIL -------- */}
        <nav className="exp-rail" aria-label="Categorieën">
          {CATALOG.map((cat) => {
            const c = countFor(cat);
            const rec = recommendations.has(cat.id);
            const jn = journeyIndex.get(cat.id);
            return (
              <button
                key={cat.id}
                className={`exp-tab ${activeCat === cat.id ? "is-active" : ""} ${
                  jn && c === 0 ? "is-journey" : ""
                }`}
                onClick={() => goTo(cat.id)}
              >
                {jn && c === 0 && <span className="exp-tab-step">{jn}</span>}
                <CategoryIcon name={cat.id} className="exp-tab-icon" />
                {cat.label}
                {c > 0 && <span className="exp-tab-count">{c}</span>}
                {rec && c === 0 && <span className="exp-tab-rec" aria-label="aanbevolen" />}
              </button>
            );
          })}
        </nav>

        {/* -------- SECTIES -------- */}
        {CATALOG.map((cat) => (
          <Section
            key={cat.id}
            cat={cat}
            isRecommended={selectedIds.size > 0}
            state={state}
            onPlan={onPlan}
            onAddon={onAddon}
            onQty={onQtyChange}
            onOption={onOption}
            onGoTo={goTo}
            reveal={reveal}
            registerSection={registerSection}
          />
        ))}
      </div>

      {/* -------- ONDERBALK -------- */}
      {totalCount > 0 && (
        <div className="exp-bar">
          <div className="exp-bar-totals">
            <div className="exp-bar-total">
              <div className="k">Eenmalig vanaf</div>
              <div className="v">
                {formatEuro(animSetup)}
                {totals.custom && <small> + maatwerk</small>}
              </div>
            </div>
            <div className="exp-bar-total">
              <div className="k">Doorlopend</div>
              <div className="v">
                {formatEuro(animMonthly)} <small>/mnd</small>
              </div>
            </div>
            <div className="exp-bar-total" style={{ alignSelf: "center" }}>
              <div className="exp-bar-count">
                {totalCount} {totalCount === 1 ? "dienst" : "diensten"} gekozen
              </div>
            </div>
          </div>
          <button className="exp-btn exp-btn-primary" onClick={() => setModalOpen(true)}>
            Bekijk &amp; vraag aan <Arrow />
          </button>
        </div>
      )}

      {modalOpen && (
        <QuoteModal
          selectedIds={selectedIds}
          qty={qty}
          options={options}
          totals={totals}
          stage={stage}
          goals={goals}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}

// ============================================================ MODAL
function QuoteModal({
  selectedIds,
  qty,
  options,
  totals,
  stage,
  goals,
  onClose,
}: {
  selectedIds: Set<string>;
  qty: Record<string, number>;
  options: Record<string, string[]>;
  totals: { setup: number; monthly: number; custom: boolean };
  stage: string | null;
  goals: string[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // Rijen gegroepeerd per categorie (in catalogus-volgorde).
  const groups = useMemo(() => {
    const byCat = new Map<IconKey, { label: string; rows: { id: string; name: string; n: number; price: Pkg["price"] }[] }>();
    for (const id of selectedIds) {
      const entry = PKG_BY_ID[id];
      if (!entry) continue;
      const { pkg, cat } = entry;
      if (!byCat.has(cat.id)) byCat.set(cat.id, { label: cat.label, rows: [] });
      const n = pkg.kind === "item" ? qty[pkg.id] ?? 1 : 1;
      byCat.get(cat.id)!.rows.push({ id: pkg.id, name: pkg.name, n, price: pkg.price });
    }
    return CATEGORY_ORDER.filter((c) => byCat.has(c)).map((c) => ({ id: c, ...byCat.get(c)! }));
  }, [selectedIds, qty]);

  const stageLabel = STAGES.find((s) => s.id === stage)?.label;
  const goalLabels = goals.map((g) => GOALS.find((x) => x.id === g)?.label).filter(Boolean) as string[];

  const chosenOptions = useMemo(
    () =>
      CATALOG.flatMap((cat) =>
        (cat.options ?? [])
          .map((opt) => ({ label: opt.label, values: options[opt.id] ?? [] }))
          .filter((o) => o.values.length > 0)
      ),
    [options]
  );

  const summaryText = useMemo(() => {
    const lines = ["M7 — Samengestelde dienstverlening", ""];
    if (stageLabel) lines.push(`Startpunt: ${stageLabel}`);
    if (goalLabels.length) lines.push(`Doelen: ${goalLabels.join(", ")}`);
    if (stageLabel || goalLabels.length) lines.push("");
    groups.forEach((g) => {
      lines.push(`[${g.label}]`);
      g.rows.forEach((r) => {
        const p = priceLabel(r.price);
        lines.push(`  • ${r.name}${r.n > 1 ? ` (${r.n}×)` : ""} — ${p.main} ${p.unit}`.trim());
      });
    });
    if (chosenOptions.length) {
      lines.push("", "Voorkeuren:");
      chosenOptions.forEach((o) => lines.push(`• ${o.label}: ${o.values.join(", ")}`));
    }
    lines.push(
      "",
      `Totaal eenmalig (vanaf): ${formatEuro(totals.setup)}${totals.custom ? " + maatwerk" : ""}`,
      `Totaal doorlopend: ${formatEuro(totals.monthly)} /mnd`,
      "",
      "(Indicatieve vanafprijzen — graag vrijblijvend afstemmen.)"
    );
    return lines.join("\n");
  }, [groups, chosenOptions, totals, stageLabel, goalLabels]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard niet beschikbaar */
    }
  };

  const submit = () => {
    const body = encodeURIComponent(
      `${message ? message + "\n\n" : ""}${summaryText}\n\n— ${name || "?"}${company ? `, ${company}` : ""}`
    );
    const subject = encodeURIComponent("Offerte-aanvraag via online experience");
    window.location.href = `mailto:hello@m7branding.com?subject=${subject}&body=${body}${
      email ? `&cc=${encodeURIComponent(email)}` : ""
    }`;
  };

  return (
    <div className="exp-modal-overlay" onClick={onClose}>
      <div className="exp-modal" onClick={(e) => e.stopPropagation()} style={{ position: "relative" }}>
        <button className="exp-modal-close" onClick={onClose} aria-label="Sluiten">
          ×
        </button>
        <h3>Jouw dienstverlening</h3>
        <p style={{ color: "var(--exp-muted)", fontSize: 13.5, marginTop: 6 }}>
          Controleer je samenstelling en stuur 'm door — we werken 'm vrijblijvend uit tot een
          concrete offerte, of plannen eerst een kennismaking.
        </p>

        {(stageLabel || goalLabels.length > 0) && (
          <div className="exp-intake-summary">
            {stageLabel && <span className="exp-chip">Start · {stageLabel}</span>}
            {goalLabels.map((g) => (
              <span className="exp-chip" key={g}>
                Doel · {g}
              </span>
            ))}
          </div>
        )}

        <div className="exp-summary-list">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="exp-summary-group">
                <CategoryIcon name={g.id} />
                {g.label}
              </div>
              {g.rows.map((r) => {
                const p = priceLabel(r.price);
                return (
                  <div className="exp-summary-row" key={r.id}>
                    <div className="n">
                      {r.name}
                      {r.n > 1 ? ` · ${r.n}×` : ""}
                    </div>
                    <div className="p">
                      {p.main} <span style={{ color: "var(--exp-faint)" }}>{p.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          {chosenOptions.map((o) => (
            <div className="exp-summary-row" key={o.label}>
              <div className="n">{o.label}</div>
              <div className="p">{o.values.join(", ")}</div>
            </div>
          ))}
        </div>

        <div className="exp-summary-tot">
          <span>Totaal eenmalig (vanaf)</span>
          <span>
            {formatEuro(totals.setup)}
            {totals.custom && " + maatwerk"}
          </span>
        </div>
        <div className="exp-summary-tot" style={{ paddingTop: 4 }}>
          <span>Totaal doorlopend</span>
          <span>{formatEuro(totals.monthly)} /mnd</span>
        </div>

        <div className="exp-field">
          <label>Naam</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Je naam" />
        </div>
        <div className="exp-field">
          <label>Bedrijf</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Bedrijfsnaam" />
        </div>
        <div className="exp-field">
          <label>E-mail</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jij@bedrijf.nl" type="email" />
        </div>
        <div className="exp-field">
          <label>Bericht (optioneel)</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Waar kunnen we mee helpen?" />
        </div>

        <div className="exp-modal-actions">
          <button className="exp-btn exp-btn-primary" style={{ flex: 1 }} onClick={submit}>
            Verstuur aanvraag <Arrow />
          </button>
          <button className="exp-btn exp-btn-ghost" onClick={copy}>
            {copied ? "Gekopieerd ✓" : "Kopieer"}
          </button>
        </div>
        <p className="exp-note" style={{ textAlign: "center", marginTop: 14 }}>
          Liever eerst overleggen?{" "}
          <a href={INTRO_MAILTO} style={{ color: "var(--exp-a2)" }}>
            Plan een vrijblijvend kennismakingsgesprek
          </a>
          . Alle bedragen zijn indicatieve vanafprijzen.
        </p>
      </div>
    </div>
  );
}
