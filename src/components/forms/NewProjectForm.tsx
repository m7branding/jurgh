"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createProject } from "@/app/actions/projects";
import { PROJECT_TYPES, PROJECT_STATUSES } from "@/lib/constants";

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
            <div>
              <label className="label">Kenteken *</label>
              <input name="license_plate" className="input uppercase" placeholder="XX-001-X" />
            </div>
            <div>
              <label className="label">Merk</label>
              <input name="make" className="input" placeholder="Porsche" />
            </div>
            <div>
              <label className="label">Model</label>
              <input name="model" className="input" placeholder="911 Carrera" />
            </div>
            <div>
              <label className="label">Bouwjaar</label>
              <input name="year" type="number" className="input" placeholder="2023" />
            </div>
            <div>
              <label className="label">Kleur</label>
              <input name="color" className="input" placeholder="GT Silver" />
            </div>
            <div>
              <label className="label">Km-stand</label>
              <input name="mileage" type="number" className="input" placeholder="8400" />
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
            <select name="status" className="input" defaultValue="concept">
              {PROJECT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Prijs (excl. korting)</label>
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
