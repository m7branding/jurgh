"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";
import type {
  ProjectStatus,
  PhotoLabel,
  WorkType,
  DocumentType,
  ProjectType,
} from "@/lib/constants";

async function staff() {
  const profile = await getSessionProfile();
  if (!profile || !["admin", "medewerker"].includes(profile.role)) {
    throw new Error("Geen toegang");
  }
  return profile;
}

async function adminOnly() {
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "admin") throw new Error("Alleen admin");
  return profile;
}

function refresh(projectId: string) {
  revalidatePath(`/admin/projecten/${projectId}`);
  revalidatePath(`/medewerker/projecten/${projectId}`);
  revalidatePath(`/klant/dossier/${projectId}`);
  revalidatePath("/admin");
  revalidatePath("/medewerker");
  revalidatePath("/klant");
}

// ---------- Project aanmaken (admin) ----------
export async function createProject(_prev: unknown, formData: FormData) {
  const profile = await adminOnly();
  const supabase = createClient();

  const customerName = String(formData.get("customer_name") || "").trim();
  const customerEmail = String(formData.get("customer_email") || "").trim();
  const customerProfileId = String(formData.get("customer_profile_id") || "").trim();
  let customerId = String(formData.get("customer_id") || "").trim();

  // nieuwe klant aanmaken indien geen bestaande gekozen
  if (!customerId) {
    if (!customerName) return { error: "Vul een klantnaam in of kies een bestaande klant." };
    const isBusiness = formData.get("is_business") === "on";
    const { data, error } = await supabase
      .from("customers")
      .insert({
        name: customerName,
        email: customerEmail || null,
        profile_id: customerProfileId || null,
        is_business: isBusiness,
        company_name: isBusiness ? String(formData.get("company_name") || "").trim() || null : null,
      })
      .select("id")
      .single();
    if (error) return { error: "Kon klant niet aanmaken: " + error.message };
    customerId = data.id;
  }

  // auto
  let vehicleId = String(formData.get("vehicle_id") || "").trim();
  if (!vehicleId) {
    const plate = String(formData.get("license_plate") || "").trim();
    if (!plate) return { error: "Vul een kenteken in." };
    const { data, error } = await supabase
      .from("vehicles")
      .insert({
        customer_id: customerId,
        license_plate: plate.toUpperCase(),
        make: String(formData.get("make") || "") || null,
        model: String(formData.get("model") || "") || null,
        year: Number(formData.get("year")) || null,
        color: String(formData.get("color") || "") || null,
        mileage: Number(formData.get("mileage")) || null,
      })
      .select("id")
      .single();
    if (error) return { error: "Kon auto niet aanmaken: " + error.message };
    vehicleId = data.id;

    // optionele auto-foto die bij het aanmaken is meegegeven
    const photo = formData.get("vehicle_photo") as File | null;
    if (photo && photo.size > 0) {
      const ext = photo.name.split(".").pop() || "jpg";
      const path = `${vehicleId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, photo, { contentType: photo.type });
      if (!upErr) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("vehicle-photos").getPublicUrl(path);
        await supabase.from("vehicles").update({ photo_url: publicUrl }).eq("id", vehicleId);
      }
    }
  }

  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "detailing") as ProjectType;
  const price = formData.get("price") ? Number(formData.get("price")) : null;
  const discount = formData.get("discount") ? Number(formData.get("discount")) : 0;
  const loanerCar = formData.get("loaner_car") === "on";
  const transport = formData.get("transport") === "on";

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      customer_id: customerId,
      vehicle_id: vehicleId,
      title: title || "Nieuw project",
      type,
      status: (String(formData.get("status") || "concept") as ProjectStatus) || "concept",
      price,
      discount,
      price_note: String(formData.get("price_note") || "") || null,
      appointment_date: String(formData.get("appointment_date") || "") || null,
      expected_delivery_date: String(formData.get("expected_delivery_date") || "") || null,
      start_date: String(formData.get("start_date") || "") || null,
      internal_notes: String(formData.get("internal_notes") || "") || null,
      customer_notes: String(formData.get("customer_notes") || "") || null,
      loaner_car: loanerCar,
      loaner_car_plate: loanerCar
        ? String(formData.get("loaner_car_plate") || "").trim().toUpperCase() || null
        : null,
      transport,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error) return { error: "Kon project niet aanmaken: " + error.message };

  redirect(`/admin/projecten/${project.id}`);
}

// ---------- Status bijwerken (alleen admin) ----------
export async function updateStatus(formData: FormData) {
  await adminOnly();
  const supabase = createClient();
  const projectId = String(formData.get("project_id"));
  const status = String(formData.get("status")) as ProjectStatus;
  const note = String(formData.get("note") || "").trim();

  const patch: Record<string, unknown> = { status };
  if (status === "afgerond") patch.completed_at = new Date().toISOString();

  const { error } = await supabase.from("projects").update(patch).eq("id", projectId);
  if (error) throw new Error(error.message);

  // optionele toelichting bij de statusregel
  if (note) {
    await supabase
      .from("project_status_history")
      .update({ note })
      .eq("project_id", projectId)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .limit(1);
  }

  refresh(projectId);
}

// ---------- Leenauto / transport aanpassen (admin, ook na aanmaken project) ----------
export async function updateProjectExtras(formData: FormData) {
  await adminOnly();
  const supabase = createClient();
  const projectId = String(formData.get("project_id"));
  const loanerCar = formData.get("loaner_car") === "on";
  const transport = formData.get("transport") === "on";

  const { error } = await supabase
    .from("projects")
    .update({
      loaner_car: loanerCar,
      loaner_car_plate: loanerCar
        ? String(formData.get("loaner_car_plate") || "").trim().toUpperCase() || null
        : null,
      transport,
    })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  refresh(projectId);
}

// ---------- Project afronden (markeren als compleet, alleen admin) ----------
export async function completeProject(formData: FormData) {
  await adminOnly();
  const supabase = createClient();
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase
    .from("projects")
    .update({ status: "afgerond", completed_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  refresh(projectId);
}

// ---------- Bijzonderheid / opmerking ----------
export async function addRemark(formData: FormData) {
  const profile = await staff();
  const supabase = createClient();
  const projectId = String(formData.get("project_id"));
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  const visible = formData.get("visible_to_customer") === "on";
  const { error } = await supabase.from("project_remarks").insert({
    project_id: projectId,
    body,
    visible_to_customer: visible,
    created_by: profile.id,
  });
  if (error) throw new Error(error.message);
  refresh(projectId);
}

// ---------- Urenregistratie ----------
export async function addWorkLog(_prev: unknown, formData: FormData) {
  const profile = await staff();
  const supabase = createClient();
  const projectId = String(formData.get("project_id"));
  const hours = Number(formData.get("hours"));
  if (!hours || hours <= 0) return { error: "Vul een geldig aantal uren in." };

  const { error } = await supabase.from("work_logs").insert({
    project_id: projectId,
    employee_id: profile.id,
    log_date: String(formData.get("log_date") || new Date().toISOString().slice(0, 10)),
    work_type: String(formData.get("work_type") || "overig") as WorkType,
    hours,
    description: String(formData.get("description") || "") || null,
    internal_note: String(formData.get("internal_note") || "") || null,
  });
  if (error) return { error: error.message };
  refresh(projectId);
  return { ok: true };
}

// ---------- Urenregistratie bewerken (alleen eigen log, admin mag alles) ----------
export async function updateWorkLog(_prev: unknown, formData: FormData) {
  await staff();
  const supabase = createClient();
  const id = String(formData.get("work_log_id"));
  const projectId = String(formData.get("project_id"));
  const hours = Number(formData.get("hours"));
  if (!hours || hours <= 0) return { error: "Vul een geldig aantal uren in." };

  const { error } = await supabase
    .from("work_logs")
    .update({
      log_date: String(formData.get("log_date") || new Date().toISOString().slice(0, 10)),
      work_type: String(formData.get("work_type") || "overig") as WorkType,
      hours,
      description: String(formData.get("description") || "") || null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  refresh(projectId);
  return { ok: true };
}

// ---------- Meerwerk / minderwerk (alleen admin) ----------
export async function addExtraWork(_prev: unknown, formData: FormData) {
  const profile = await adminOnly();
  const supabase = createClient();
  const projectId = String(formData.get("project_id"));
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Vul een titel in." };

  const { error } = await supabase.from("extra_work").insert({
    project_id: projectId,
    title,
    description: String(formData.get("description") || "") || null,
    price: formData.get("price") ? Number(formData.get("price")) : 0,
    estimated_hours: formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : 0,
    pricing_mode: String(formData.get("pricing_mode") || "totaal"),
    status: "concept",
    created_by: profile.id,
  });
  if (error) return { error: error.message };
  refresh(projectId);
  return { ok: true };
}

// Admin verstuurt een concept-meerwerkvoorstel naar de klant.
export async function sendExtraWorkToCustomer(formData: FormData) {
  await adminOnly();
  const supabase = createClient();
  const id = String(formData.get("extra_work_id"));
  const projectId = String(formData.get("project_id"));
  const { error } = await supabase
    .from("extra_work")
    .update({ status: "voorgesteld" })
    .eq("id", id)
    .eq("status", "concept");
  if (error) throw new Error(error.message);
  refresh(projectId);
}

// Klant accepteert of wijst af (via veilige RPC).
export async function respondExtraWork(formData: FormData) {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Geen toegang");
  const supabase = createClient();
  const id = String(formData.get("extra_work_id"));
  const projectId = String(formData.get("project_id"));
  const accept = formData.get("accept") === "true";
  const { error } = await supabase.rpc("respond_extra_work", { p_id: id, p_accept: accept });
  if (error) throw new Error(error.message);
  refresh(projectId);
}

// Admin werkt de status bij (bv. markeren als uitgevoerd).
export async function setExtraWorkStatus(formData: FormData) {
  await adminOnly();
  const supabase = createClient();
  const id = String(formData.get("extra_work_id"));
  const projectId = String(formData.get("project_id"));
  const status = String(formData.get("status"));
  await supabase.from("extra_work").update({ status }).eq("id", id);
  refresh(projectId);
}

// ---------- Meerwerk-catalogus beheren (admin) ----------
export async function addCatalogItem(_prev: unknown, formData: FormData) {
  await adminOnly();
  const supabase = createClient();
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Vul een titel in." };

  const { error } = await supabase.from("extra_work_catalog").insert({
    title,
    description: String(formData.get("description") || "") || null,
    price: formData.get("price") ? Number(formData.get("price")) : 0,
    estimated_hours: formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : 0,
    pricing_mode: String(formData.get("pricing_mode") || "totaal"),
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/catalogus");
  return { ok: true };
}

export async function deleteCatalogItem(formData: FormData) {
  await adminOnly();
  const supabase = createClient();
  const id = String(formData.get("id"));
  await supabase.from("extra_work_catalog").delete().eq("id", id);
  revalidatePath("/admin/catalogus");
}

// ---------- Foto uploaden ----------
export async function uploadPhoto(_prev: unknown, formData: FormData) {
  const profile = await staff();
  const supabase = createClient();
  const projectId = String(formData.get("project_id"));
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Selecteer een foto." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("project-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: "Upload mislukt: " + upErr.message };

  const { error } = await supabase.from("project_photos").insert({
    project_id: projectId,
    storage_path: path,
    label: String(formData.get("label") || "tijdens_behandeling") as PhotoLabel,
    caption: String(formData.get("caption") || "") || null,
    visible_to_customer: formData.get("visible_to_customer") === "on",
    uploaded_by: profile.id,
  });
  if (error) return { error: error.message };
  refresh(projectId);
  return { ok: true };
}

export async function togglePhotoVisibility(formData: FormData) {
  await staff();
  const supabase = createClient();
  const id = String(formData.get("photo_id"));
  const projectId = String(formData.get("project_id"));
  const visible = formData.get("visible") === "true";
  await supabase.from("project_photos").update({ visible_to_customer: visible }).eq("id", id);
  refresh(projectId);
}

// ---------- Auto-foto uploaden / vervangen ----------
export async function uploadVehiclePhoto(_prev: unknown, formData: FormData) {
  await staff();
  const supabase = createClient();
  const vehicleId = String(formData.get("vehicle_id"));
  const projectId = String(formData.get("project_id") || "");
  const file = formData.get("file") as File | null;
  if (!vehicleId) return { error: "Geen auto gekoppeld." };
  if (!file || file.size === 0) return { error: "Selecteer een foto." };

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${vehicleId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("vehicle-photos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: "Upload mislukt: " + upErr.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("vehicle-photos").getPublicUrl(path);

  const { error } = await supabase
    .from("vehicles")
    .update({ photo_url: publicUrl })
    .eq("id", vehicleId);
  if (error) return { error: error.message };

  if (projectId) refresh(projectId);
  return { ok: true };
}

// ---------- Herinneringen aan/uit per klant (admin) ----------
export async function toggleCustomerReminders(formData: FormData) {
  await adminOnly();
  const supabase = createClient();
  const customerId = String(formData.get("customer_id"));
  const enabled = formData.get("enabled") === "true";
  const { error } = await supabase
    .from("customers")
    .update({ reminders_enabled: enabled })
    .eq("id", customerId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/klanten");
}

// ---------- Km-stand bijwerken (op autoniveau) ----------
export async function updateVehicleMileage(formData: FormData) {
  await staff();
  const supabase = createClient();
  const vehicleId = String(formData.get("vehicle_id"));
  const mileage = formData.get("mileage") ? Number(formData.get("mileage")) : null;

  const { error } = await supabase.from("vehicles").update({ mileage }).eq("id", vehicleId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/autos/${vehicleId}`);
  revalidatePath("/admin/autos");
}

// ---------- Document uploaden (offerte / factuur / certificaat, alleen admin) ----------
export async function uploadDocument(_prev: unknown, formData: FormData) {
  const profile = await adminOnly();
  const supabase = createClient();
  const projectId = String(formData.get("project_id"));
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Selecteer een bestand." };

  const ext = file.name.split(".").pop() || "pdf";
  const path = `${projectId}/${crypto.randomUUID()}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from("project-documents")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: "Upload mislukt: " + upErr.message };

  const { error } = await supabase.from("project_documents").insert({
    project_id: projectId,
    type: String(formData.get("type") || "overig") as DocumentType,
    name: String(formData.get("name") || file.name) || file.name,
    storage_path: path,
    uploaded_by: profile.id,
  });
  if (error) return { error: error.message };
  refresh(projectId);
  return { ok: true };
}
