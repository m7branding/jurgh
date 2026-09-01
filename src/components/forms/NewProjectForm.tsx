"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createProject } from "@/app/actions/projects";
import { lookupLicensePlate } from "@/app/actions/rdw";
import { PROJECT_TYPES, PROJECT_STATUSES, type ProjectStatus } from "@/lib/constants";
import { StatusBadge } from "@/components/ui";

type CustomerOption = {
  id: string;
  name: string;
  email: string | null;
  vehicles: { id: string; license_plate: string; make: string | null; model: string | null }[];
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary px-6 py-3" disabled={pending}>
      {pending ? "Project aanmaken…" : "Project aanmaken"}
    </button>
  );
}

export function NewProjectForm({ customers }: { customers: CustomerOption[] }) {
  const [state, action] = useFormState(createProject, { error: "" } as { error?: string });
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("concept");
  const [isBusiness, setIsBusiness] = useState(false);
  const [loanerCar, setLoanerCar] = useState(false);

  // ---- auto + kentekencheck (RDW) ----
  const [plate, setPlate] = useState("");
  const [plateUnknown, setPlateUnknown] = useState(false);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [color, setColor] = useState("");
  const [rdw, setRdw] = useState<{ tone: "ok" | "error"; message: string } | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkedPlate, setCheckedPlate] = useState("");

  async function runPlateCheck() {
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean.length < 6) {
      setRdw({ tone: "error", message: "Vul een volledig kenteken in." });
      return;
    }
    setCheckedPlate(clean);
    setChecking(true);
    try {
      const result = await lookupLicensePlate(clean);
      if (!result.ok) {
        setRdw({ tone: "error", message: result.error });
        return;
      }
      // gevonden waarden invullen; wat de RDW niet weet, blijft staan
      if (result.make) setMake(result.make);
      if (result.model) setModel(result.model);
      if (result.year) setYear(String(result.year));
      if (result.color) setColor(result.color);
      setRdw({
        tone: "ok",
        message: `Gevonden bij de RDW: ${
          [result.make, result.model].filter(Boolean).join(" ") || "voertuig"
        }. Aanpassen mag.`,
      });
    } finally {
      setChecking(false);
    }
  }

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const newCustomer = customerId === "";

  return (
    <form action={action} className="space-y-6">
      {/* ---------- Klant ---------- */}
      <section className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-jurgh-text">Klant</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Bestaande klant</label>
            <select
              className="input"
              value={customerId}
              name="customer_id"
              onChange={(e) => {
                setCustomerId(e.target.value);
                setVehicleId("");
              }}
            >
              <option value="">+ Nieuwe klant aanmaken</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.email ? `(${c.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          {newCustomer && (
            <>
              <div>
                <label className="label">Naam klant *</label>
                <input name="customer_name" className="input" placeholder="Jan de Vries" />
              </div>
              <div>
                <label className="label">E-mail klant</label>
                <input name="customer_email" type="email" className="input" placeholder="jan@voorbeeld.nl" />
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 text-sm text-jurgh-muted">
                  <input
                    type="checkbox"
                    name="is_business"
                    checked={isBusiness}
                    onChange={(e) => setIsBusiness(e.target.checked)}
                    className="accent-jurgh-red"
                  />
                  Zakelijke klant
                </label>
              </div>
              {isBusiness && (
                <div className="sm:col-span-2">
                  <label className="label">Bedrijfsnaam</label>
                  <input name="company_name" className="input" placeholder="Jurgh Detailing B.V." />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ---------- Auto ---------- */}
      <section className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-jurgh-text">Auto</h2>
        {selectedCustomer && selectedCustomer.vehicles.length > 0 && (
          <div className="mb-4">
            <label className="label">Bestaande auto van deze klant</label>
            <select
              className="input"
              name="vehicle_id"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">+ Nieuwe auto toevoegen</option>
              {selectedCustomer.vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {[v.make, v.model].filter(Boolean).join(" ")} — {v.license_plate}
                </option>
              ))}
            </select>
          </div>
        )}

        {!vehicleId && (
          <div className="grid gap-4 sm:grid-cols-3">
            {!plateUnknown && (
              <div className="sm:col-span-3">
                <label className="label">Kenteken</label>
                <div className="flex flex-wrap gap-2">
                  <input
                    name="license_plate"
                    className="input uppercase sm:max-w-[220px]"
                    placeholder="XX-001-X"
                    value={plate}
                    onChange={(e) => {
                      setPlate(e.target.value);
                      setRdw(null);
                    }}
                    onBlur={() => {
                      const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
                      if (clean.length >= 6 && clean !== checkedPlate) void runPlateCheck();
                    }}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => void runPlateCheck()}
                    disabled={checking}
                  >
                    {checking ? "Ophalen…" : "Gegevens ophalen"}
                  </button>
                </div>
                {rdw && (
                  <p
                    className={`mt-1.5 text-xs ${
                      rdw.tone === "ok" ? "text-jurgh-green" : "text-jurgh-red"
                    }`}
                  >
                    {rdw.message}
                  </p>
                )}
                {!rdw && (
                  <p className="mt-1.5 text-xs text-jurgh-muted">
                    Merk, model, bouwjaar en kleur worden automatisch opgehaald bij de RDW.
                  </p>
                )}
              </div>
            )}

            <div className="sm:col-span-3">
              <label className="flex items-center gap-2 text-sm text-jurgh-muted">
                <input
                  type="checkbox"
                  checked={plateUnknown}
                  onChange={(e) => {
                    setPlateUnknown(e.target.checked);
                    if (e.target.checked) {
                      setPlate("");
                      setRdw(null);
                    }
                  }}
                  className="accent-jurgh-red"
                />
                Kenteken nog onbekend — vul dan minimaal merk en model in
              </label>
            </div>

            <div>
              <label className="label">Merk{plateUnknown ? " *" : ""}</label>
              <input
                name="make"
                className="input"
                placeholder="Porsche"
                value={make}
                onChange={(e) => setMake(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Model{plateUnknown ? " *" : ""}</label>
              <input
                name="model"
                className="input"
                placeholder="911 Carrera"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Bouwjaar</label>
              <input
                name="year"
                type="number"
                className="input"
                placeholder="2023"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Kleur</label>
              <input
                name="color"
                className="input"
                placeholder="GT Silver"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Km-stand</label>
              <input name="mileage" type="number" className="input" placeholder="8400" />
            </div>
            <div className="sm:col-span-3">
              <label className="label">Auto-foto (optioneel)</label>
              <input
                name="vehicle_photo"
                type="file"
                accept="image/*"
                className="block w-full text-sm text-jurgh-muted file:mr-3 file:rounded-lg file:border-0 file:bg-jurgh-red file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-jurgh-redDark"
              />
              <p className="mt-1 text-xs text-jurgh-muted">
                Geen foto? Dan tonen we automatisch een nette fallback-thumbnail.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ---------- Project ---------- */}
      <section className="card p-6">
        <h2 className="mb-4 text-lg font-bold text-jurgh-text">Projectgegevens</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Projecttitel</label>
            <input name="title" className="input" placeholder="Glascoating First Class — Porsche 911" />
          </div>
          <div>
            <label className="label">Projecttype</label>
            <select name="type" className="input" defaultValue="glascoating">
              {PROJECT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <div className="flex items-center gap-2">
              <select
                name="status"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <StatusBadge status={status} />
            </div>
          </div>
          <div>
            <label className="label">Prijs (excl. btw, excl. korting)</label>
            <input name="price" type="number" step="0.01" className="input" placeholder="1895.00" />
          </div>
          <div>
            <label className="label">Korting (€)</label>
            <input name="discount" type="number" step="0.01" className="input" placeholder="0" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Prijsnotitie</label>
            <input name="price_note" className="input" placeholder="bijv. op nacalculatie / vaste pakketprijs" />
          </div>
          <div>
            <label className="label">Afspraakdatum</label>
            <input name="appointment_date" type="date" className="input" />
          </div>
          <div>
            <label className="label">Verwachte oplevering</label>
            <input name="expected_delivery_date" type="date" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bericht / notitie voor klant</label>
            <textarea name="customer_notes" rows={2} className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Interne notities</label>
            <textarea name="internal_notes" rows={2} className="input" />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-jurgh-muted">
              <input
                type="checkbox"
                name="loaner_car"
                checked={loanerCar}
                onChange={(e) => setLoanerCar(e.target.checked)}
                className="accent-jurgh-red"
              />
              Leenauto meegegeven
            </label>
          </div>
          {loanerCar && (
            <div>
              <label className="label">Kenteken leenauto</label>
              <input name="loaner_car_plate" className="input uppercase" placeholder="XX-002-X" />
            </div>
          )}
          <div>
            <label className="flex items-center gap-2 text-sm text-jurgh-muted">
              <input type="checkbox" name="transport" className="accent-jurgh-red" />
              Transport (halen/brengen)
            </label>
          </div>
        </div>
      </section>

      {state?.error && (
        <p className="rounded-lg border border-jurgh-red/40 bg-jurgh-red/10 px-3 py-2 text-sm text-jurgh-red">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
