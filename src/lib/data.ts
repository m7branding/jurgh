import { createClient } from "@/lib/supabase/server";

export type Vehicle = {
  id: string;
  license_plate: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  mileage: number | null;
  photo_url: string | null;
  customer_id: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profile_id: string | null;
};

export type Project = {
  id: string;
  title: string;
  type: string;
  status: string;
  price: number | null;
  discount: number | null;
  price_note: string | null;
  start_date: string | null;
  appointment_date: string | null;
  expected_delivery_date: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  completed_at: string | null;
  created_at: string;
  customer_id: string;
  vehicle_id: string;
  customers?: Customer;
  vehicles?: Vehicle;
};

const PROJECT_SELECT =
  "*, customers:customer_id(*), vehicles:vehicle_id(*)";

/** Lijst van projecten (RLS filtert automatisch op rol). */
export async function listProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("created_at", { ascending: false });
  return (data as Project[]) ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", id)
    .maybeSingle();
  return (data as Project) ?? null;
}

export async function getStatusHistory(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("project_status_history")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getRemarks(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("project_remarks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getWorkLogs(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("work_logs")
    .select("*, profiles:employee_id(full_name)")
    .eq("project_id", projectId)
    .order("log_date", { ascending: false });
  return data ?? [];
}

export type SignedPhoto = {
  id: string;
  url: string | null;
  label: string;
  caption: string | null;
  visible_to_customer: boolean;
  created_at: string;
};

export async function getPhotos(projectId: string): Promise<SignedPhoto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("project_photos")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const photos = data ?? [];
  const signed = await Promise.all(
    photos.map(async (p: any) => {
      const { data: s } = await supabase.storage
        .from("project-photos")
        .createSignedUrl(p.storage_path, 60 * 60);
      return {
        id: p.id,
        url: s?.signedUrl ?? null,
        label: p.label,
        caption: p.caption,
        visible_to_customer: p.visible_to_customer,
        created_at: p.created_at,
      };
    })
  );
  return signed;
}

export type SignedDoc = {
  id: string;
  name: string;
  type: string;
  url: string | null;
  created_at: string;
};

export async function getDocuments(projectId: string): Promise<SignedDoc[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("project_documents")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const docs = data ?? [];
  const signed = await Promise.all(
    docs.map(async (d: any) => {
      const { data: s } = await supabase.storage
        .from("project-documents")
        .createSignedUrl(d.storage_path, 60 * 60);
      return {
        id: d.id,
        name: d.name,
        type: d.type,
        url: s?.signedUrl ?? null,
        created_at: d.created_at,
      };
    })
  );
  return signed;
}

/** Voor het keuzemenu in 'project aanmaken'. */
export async function listCustomersWithVehicles() {
  const supabase = createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, email, profile_id, vehicles(id, license_plate, make, model)")
    .order("name");
  return data ?? [];
}

export function vehicleTitle(v?: Vehicle | null): string {
  if (!v) return "Onbekende auto";
  const parts = [v.make, v.model].filter(Boolean).join(" ");
  return parts || v.license_plate;
}
