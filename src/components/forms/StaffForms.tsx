"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRef } from "react";
import {
  updateStatus,
  completeProject,
  addRemark,
  addWorkLog,
  uploadPhoto,
  uploadDocument,
  uploadVehiclePhoto,
  togglePhotoVisibility,
} from "@/app/actions/projects";
import {
  PROJECT_STATUSES,
  PHOTO_LABELS,
  WORK_TYPES,
  DOCUMENT_TYPES,
  type ProjectStatus,
} from "@/lib/constants";

function Pending({ label, busy }: { label: string; busy?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? busy ?? "Bezig…" : label}
    </button>
  );
}

// ---------- Status bijwerken ----------
export function StatusForm({
  projectId,
  current,
  allowed,
}: {
  projectId: string;
  current: ProjectStatus;
  allowed?: ProjectStatus[]; // medewerker mag beperkte set
}) {
  const options = allowed
    ? PROJECT_STATUSES.filter((s) => allowed.includes(s.value))
    : PROJECT_STATUSES;

  return (
    <form action={updateStatus} className="space-y-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div>
        <label className="label">Nieuwe status</label>
        <select name="status" defaultValue={current} className="input">
          {options.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Toelichting (optioneel)</label>
        <input name="note" className="input" placeholder="bijv. polijsten afgerond" />
      </div>
      <Pending label="Status bijwerken" busy="Bijwerken…" />
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
