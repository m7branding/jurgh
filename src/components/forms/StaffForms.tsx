"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  updateStatus,
  completeProject,
  addRemark,
  addWorkLog,
  updateWorkLog,
  addExtraWork,
  sendExtraWorkToCustomer,
  respondExtraWork,
  setExtraWorkStatus,
  uploadPhoto,
  uploadDocument,
  uploadVehiclePhoto,
  togglePhotoVisibility,
  updateProjectExtras,
  updateVehicleMileage,
  addCatalogItem,
  deleteCatalogItem,
} from "@/app/actions/projects";
import {
  PROJECT_STATUSES,
  PHOTO_LABELS,
  WORK_TYPES,
  WORK_TYPE_LABEL,
  DOCUMENT_TYPES,
  PRICING_MODES,
  formatDate,
  type ProjectStatus,
  type PricingMode,
  type WorkType,
} from "@/lib/constants";
import { StatusBadge } from "@/components/ui";

function Pending({ label, busy }: { label: string; busy?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? busy ?? "Bezig…" : label}
    </button>
  );
}

// ---------- Status bijwerken (alleen admin) ----------
export function StatusForm({ projectId, current }: { projectId: string; current: ProjectStatus }) {
  const [status, setStatus] = useState<ProjectStatus>(current);

  return (
    <form action={updateStatus} className="space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <label className="label">Nieuwe status</label>
        <div className="flex items-center gap-2">
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="input"
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
        <label className="label">Toelichting (optioneel)</label>
        <input name="note" className="input" placeholder="bijv. polijsten afgerond" />
      </div>
      <Pending label="Status bijwerken" busy="Bijwerken…" />
    </form>
  );
}

// ---------- Leenauto / transport (admin, ook na aanmaken project) ----------
export function ProjectExtrasForm({
  projectId,
  loanerCar,
  loanerCarPlate,
  transport,
}: {
  projectId: string;
  loanerCar: boolean;
  loanerCarPlate: string | null;
  transport: boolean;
}) {
  const [checked, setChecked] = useState(loanerCar);
  return (
    <form action={updateProjectExtras} className="space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <label className="flex items-center gap-2 text-sm text-jurgh-muted">
        <input
          type="checkbox"
          name="loaner_car"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="accent-jurgh-red"
        />
        Leenauto meegegeven
      </label>
      {checked && (
        <div>
          <label className="label">Kenteken leenauto</label>
          <input
            name="loaner_car_plate"
            defaultValue={loanerCarPlate ?? ""}
            className="input uppercase"
            placeholder="XX-002-X"
          />
        </div>
      )}
      <label className="flex items-center gap-2 text-sm text-jurgh-muted">
        <input type="checkbox" name="transport" defaultChecked={transport} className="accent-jurgh-red" />
        Transport (halen/brengen)
      </label>
      <Pending label="Opslaan" busy="Opslaan…" />
    </form>
  );
}

// ---------- Project afronden ----------
export function CompleteButton({ projectId }: { projectId: string }) {
  return (
    <form action={completeProject}>
      <input type="hidden" name="project_id" value={projectId} />
      <button type="submit" className="btn-green w-full py-3">
        ✓ Project afronden (markeren als compleet)
      </button>
    </form>
  );
}

// ---------- Bijzonderheid toevoegen ----------
export function RemarkForm({ projectId }: { projectId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await addRemark(fd);
        ref.current?.reset();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <textarea
        name="body"
        required
        rows={3}
        className="input"
        placeholder="Beschrijf de bijzonderheid of opmerking…"
      />
      <label className="flex items-center gap-2 text-sm text-jurgh-muted">
        <input type="checkbox" name="visible_to_customer" defaultChecked className="accent-jurgh-red" />
        Zichtbaar voor klant
      </label>
      <Pending label="Bijzonderheid opslaan" busy="Opslaan…" />
    </form>
  );
}

// ---------- Urenregistratie ----------
export function WorkLogForm({ projectId }: { projectId: string }) {
  const [state, action] = useFormState(addWorkLog, {} as { error?: string; ok?: boolean });
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <label className="label">Datum</label>
        <input
          type="date"
          name="log_date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="input"
        />
      </div>
      <div>
        <label className="label">Werkzaamheid</label>
        <select name="work_type" className="input">
          {WORK_TYPES.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Aantal uren</label>
        <input type="number" step="0.25" min="0" name="hours" required className="input" placeholder="1.5" />
      </div>
      <div>
        <label className="label">Omschrijving</label>
        <input name="description" className="input" placeholder="Wat is er gedaan?" />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Interne notitie (niet zichtbaar voor klant)</label>
        <input name="internal_note" className="input" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Pending label="Uren loggen" busy="Opslaan…" />
        {state?.error && <span className="text-sm text-jurgh-red">{state.error}</span>}
        {state?.ok && <span className="text-sm text-jurgh-green">Uren opgeslagen ✓</span>}
      </div>
    </form>
  );
}

// ---------- Urenregistratie-rij: bekijken + (eigen log) bewerken ----------
export function WorkLogRow({
  log,
  canEdit,
}: {
  log: {
    id: string;
    project_id: string;
    log_date: string;
    work_type: WorkType;
    hours: number;
    description: string | null;
    employeeName: string;
  };
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useFormState(updateWorkLog, {} as { error?: string; ok?: boolean });

  useEffect(() => {
    if (state?.ok) setEditing(false);
  }, [state]);

  if (!editing) {
    return (
      <tr className="border-t border-jurgh-border">
        <td className="py-2 pr-3 text-jurgh-muted">{formatDate(log.log_date)}</td>
        <td className="py-2 pr-3">{WORK_TYPE_LABEL[log.work_type]}</td>
        <td className="py-2 pr-3 font-semibold text-jurgh-text">{Number(log.hours).toFixed(2)}</td>
        <td className="py-2 pr-3 text-jurgh-muted">{log.employeeName}</td>
        <td className="py-2 text-jurgh-muted">
          <div className="flex items-center justify-between gap-2">
            <span>{log.description ?? "—"}</span>
            {canEdit && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="shrink-0 text-xs font-medium text-jurgh-red hover:underline"
              >
                Bewerken
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-jurgh-border bg-jurgh-black/30">
      <td colSpan={5} className="py-3">
        <form action={action} className="grid gap-2 sm:grid-cols-5 sm:items-end">
          <input type="hidden" name="work_log_id" value={log.id} />
          <input type="hidden" name="project_id" value={log.project_id} />
          <div>
            <label className="label">Datum</label>
            <input type="date" name="log_date" defaultValue={log.log_date} className="input" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="work_type" defaultValue={log.work_type} className="input">
              {WORK_TYPES.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Uren</label>
            <input type="number" step="0.25" min="0" name="hours" defaultValue={log.hours} className="input" />
          </div>
          <div>
            <label className="label">Omschrijving</label>
            <input name="description" defaultValue={log.description ?? ""} className="input" />
          </div>
          <div className="flex items-center gap-2">
            <Pending label="Opslaan" busy="Opslaan…" />
            <button type="button" onClick={() => setEditing(false)} className="btn-ghost px-3 py-1.5 text-xs">
              Annuleren
            </button>
          </div>
        </form>
        {state?.error && <p className="mt-2 text-xs text-jurgh-red">{state.error}</p>}
      </td>
    </tr>
  );
}

// ---------- Foto uploaden ----------
export function PhotoUploadForm({ projectId }: { projectId: string }) {
  const [state, action] = useFormState(uploadPhoto, {} as { error?: string; ok?: boolean });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="rounded-xl border border-dashed border-jurgh-border bg-jurgh-black/40 p-4">
        <input
          type="file"
          name="file"
          accept="image/*"
          required
          className="block w-full text-sm text-jurgh-muted file:mr-3 file:rounded-lg file:border-0 file:bg-jurgh-red file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-jurgh-redDark"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Label</label>
          <select name="label" className="input" defaultValue="tijdens_behandeling">
            {PHOTO_LABELS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Bijschrift (optioneel)</label>
          <input name="caption" className="input" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-jurgh-muted">
        <input type="checkbox" name="visible_to_customer" defaultChecked className="accent-jurgh-red" />
        Zichtbaar voor klant
      </label>
      <div className="flex items-center gap-3">
        <Pending label="Foto uploaden" busy="Uploaden…" />
        {state?.error && <span className="text-sm text-jurgh-red">{state.error}</span>}
        {state?.ok && <span className="text-sm text-jurgh-green">Foto geüpload ✓</span>}
      </div>
    </form>
  );
}

// ---------- Document uploaden ----------
export function DocumentUploadForm({ projectId }: { projectId: string }) {
  const [state, action] = useFormState(uploadDocument, {} as { error?: string; ok?: boolean });
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Type</label>
          <select name="type" className="input" defaultValue="factuur">
            {DOCUMENT_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Naam (optioneel)</label>
          <input name="name" className="input" placeholder="bijv. Factuur 2026-001" />
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-jurgh-border bg-jurgh-black/40 p-4">
        <input
          type="file"
          name="file"
          accept="application/pdf,image/*"
          required
          className="block w-full text-sm text-jurgh-muted file:mr-3 file:rounded-lg file:border-0 file:bg-jurgh-red file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-jurgh-redDark"
        />
      </div>
      <div className="flex items-center gap-3">
        <Pending label="Document uploaden" busy="Uploaden…" />
        {state?.error && <span className="text-sm text-jurgh-red">{state.error}</span>}
        {state?.ok && <span className="text-sm text-jurgh-green">Document geüpload ✓</span>}
      </div>
    </form>
  );
}

type CatalogItem = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  estimated_hours: number | null;
  pricing_mode: string;
};

// ---------- Meerwerk toevoegen als concept (admin) ----------
export function ExtraWorkForm({ projectId, catalog = [] }: { projectId: string; catalog?: CatalogItem[] }) {
  const [state, action] = useFormState(addExtraWork, {} as { error?: string; ok?: boolean });
  const ref = useRef<HTMLFormElement>(null);
  const [catalogId, setCatalogId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [hours, setHours] = useState("");
  const [pricingMode, setPricingMode] = useState<PricingMode>("totaal");

  useEffect(() => {
    if (state?.ok) {
      ref.current?.reset();
      setCatalogId("");
      setTitle("");
      setDescription("");
      setPrice("");
      setHours("");
      setPricingMode("totaal");
    }
  }, [state]);

  function applyCatalogItem(id: string) {
    setCatalogId(id);
    const item = catalog.find((c) => c.id === id);
    if (item) {
      setTitle(item.title);
      setDescription(item.description ?? "");
      setPrice(item.price != null ? String(item.price) : "");
      setHours(item.estimated_hours != null ? String(item.estimated_hours) : "");
      setPricingMode((item.pricing_mode as PricingMode) || "totaal");
    }
  }

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      {catalog.length > 0 && (
        <div>
          <label className="label">Uit catalogus kiezen (optioneel)</label>
          <select className="input" value={catalogId} onChange={(e) => applyCatalogItem(e.target.value)}>
            <option value="">— Vrije invoer —</option>
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="label">Titel</label>
        <input
          name="title"
          required
          className="input"
          placeholder="bijv. Extra polijststap motorkap"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Omschrijving</label>
        <textarea
          name="description"
          rows={2}
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Prijs (€, excl. btw, − voor minderwerk)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            className="input"
            placeholder="125.00"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Extra uren (schatting)</label>
          <input
            name="estimated_hours"
            type="number"
            step="0.25"
            min="0"
            className="input"
            placeholder="1.5"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">Prijsmodel</label>
        <select
          name="pricing_mode"
          className="input"
          value={pricingMode}
          onChange={(e) => setPricingMode(e.target.value as PricingMode)}
        >
          {PRICING_MODES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <Pending label="Opslaan als concept" busy="Opslaan…" />
        {state?.error && <span className="text-sm text-jurgh-red">{state.error}</span>}
        {state?.ok && (
          <span className="text-sm text-jurgh-green">
            Concept opgeslagen ✓ — verstuur naar de klant zodra je klaar bent.
          </span>
        )}
      </div>
    </form>
  );
}

// Admin: concept-meerwerk versturen naar de klant
export function ExtraWorkSendButton({ id, projectId }: { id: string; projectId: string }) {
  return (
    <form action={sendExtraWorkToCustomer}>
      <input type="hidden" name="extra_work_id" value={id} />
      <input type="hidden" name="project_id" value={projectId} />
      <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
        Versturen naar klant
      </button>
    </form>
  );
}

// Klant: accepteren / afwijzen
export function ExtraWorkRespond({
  id,
  projectId,
}: {
  id: string;
  projectId: string;
}) {
  return (
    <div className="flex gap-2">
      <form action={respondExtraWork}>
        <input type="hidden" name="extra_work_id" value={id} />
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="accept" value="true" />
        <button type="submit" className="btn-green px-3 py-1.5 text-xs">
          ✓ Accepteren
        </button>
      </form>
      <form action={respondExtraWork}>
        <input type="hidden" name="extra_work_id" value={id} />
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="accept" value="false" />
        <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
          Afwijzen
        </button>
      </form>
    </div>
  );
}

// Staff: status bijwerken (bv. uitgevoerd)
export function ExtraWorkStatusControl({
  id,
  projectId,
  current,
}: {
  id: string;
  projectId: string;
  current: string;
}) {
  return (
    <form action={setExtraWorkStatus} className="flex items-center gap-2">
      <input type="hidden" name="extra_work_id" value={id} />
      <input type="hidden" name="project_id" value={projectId} />
      <select name="status" defaultValue={current} className="input max-w-[170px] py-1.5 text-xs">
        <option value="concept">Concept</option>
        <option value="voorgesteld">Voorgesteld</option>
        <option value="intern_akkoord">Intern akkoord</option>
        <option value="klant_akkoord">Klant akkoord</option>
        <option value="uitgevoerd">Uitgevoerd</option>
        <option value="afgewezen">Afgewezen</option>
      </select>
      <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
        Opslaan
      </button>
    </form>
  );
}

// ---------- Meerwerk-catalogus beheren (admin) ----------
export function CatalogItemForm() {
  const [state, action] = useFormState(addCatalogItem, {} as { error?: string; ok?: boolean });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <div>
        <label className="label">Titel</label>
        <input name="title" required className="input" placeholder="bijv. Extra polijststap" />
      </div>
      <div>
        <label className="label">Omschrijving</label>
        <textarea name="description" rows={2} className="input" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Prijs (€)</label>
          <input name="price" type="number" step="0.01" className="input" placeholder="125.00" />
        </div>
        <div>
          <label className="label">Uren</label>
          <input name="estimated_hours" type="number" step="0.25" min="0" className="input" placeholder="1.5" />
        </div>
        <div>
          <label className="label">Prijsmodel</label>
          <select name="pricing_mode" className="input" defaultValue="totaal">
            {PRICING_MODES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Pending label="Toevoegen aan catalogus" busy="Opslaan…" />
        {state?.error && <span className="text-sm text-jurgh-red">{state.error}</span>}
        {state?.ok && <span className="text-sm text-jurgh-green">Toegevoegd ✓</span>}
      </div>
    </form>
  );
}

export function DeleteCatalogItemButton({ id }: { id: string }) {
  return (
    <form action={deleteCatalogItem}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">
        Verwijderen
      </button>
    </form>
  );
}

// ---------- Auto-foto uploaden / vervangen ----------
export function VehiclePhotoForm({
  vehicleId,
  projectId,
  hasPhoto,
}: {
  vehicleId: string;
  projectId: string;
  hasPhoto: boolean;
}) {
  const [state, action] = useFormState(uploadVehiclePhoto, {} as { error?: string; ok?: boolean });
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <input type="hidden" name="project_id" value={projectId} />
      <input
        type="file"
        name="file"
        accept="image/*"
        required
        className="block max-w-[230px] text-xs text-jurgh-muted file:mr-2 file:rounded-lg file:border-0 file:bg-jurgh-red file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-jurgh-redDark"
      />
      <Pending label={hasPhoto ? "Foto vervangen" : "Auto-foto uploaden"} busy="Uploaden…" />
      {state?.error && <span className="text-xs text-jurgh-red">{state.error}</span>}
      {state?.ok && <span className="text-xs text-jurgh-green">Foto opgeslagen ✓</span>}
    </form>
  );
}

// ---------- Km-stand bijwerken (op autoniveau) ----------
export function MileageForm({ vehicleId, mileage }: { vehicleId: string; mileage: number | null }) {
  return (
    <form action={updateVehicleMileage} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="vehicle_id" value={vehicleId} />
      <div>
        <label className="label">Km-stand</label>
        <input
          name="mileage"
          type="number"
          defaultValue={mileage ?? ""}
          className="input max-w-[160px]"
          placeholder="8400"
        />
      </div>
      <Pending label="Opslaan" busy="Opslaan…" />
    </form>
  );
}

// ---------- Foto zichtbaarheid wisselen ----------
export function PhotoVisibilityToggle({
  photoId,
  projectId,
  visible,
}: {
  photoId: string;
  projectId: string;
  visible: boolean;
}) {
  return (
    <form action={togglePhotoVisibility}>
      <input type="hidden" name="photo_id" value={photoId} />
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="visible" value={(!visible).toString()} />
      <button
        type="submit"
        className={`rounded-md px-2 py-1 text-xs font-medium ${
          visible
            ? "bg-jurgh-green/15 text-jurgh-green"
            : "bg-white/5 text-jurgh-muted"
        }`}
      >
        {visible ? "Zichtbaar voor klant" : "Verborgen"}
      </button>
    </form>
  );
}
