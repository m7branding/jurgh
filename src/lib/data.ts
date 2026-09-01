import { createClient } from "@/lib/supabase/server";
import type { Vehicle, Customer, Project } from "@/lib/types";

export type { Vehicle, Customer, Project };

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
    .select("*, profiles:created_by(full_name)")
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

export async function getExtraWorkCatalog() {
  const supabase = createClient();
  const { data } = await supabase
    .from("extra_work_catalog")
    .select("*")
    .order("title");
  return data ?? [];
}

export async function getExtraWork(projectId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("extra_work")
    .select("*, profiles:created_by(full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ----- Admin overzichten -----

export async function listAllWorkLogs() {
  const supabase = createClient();
  const { data } = await supabase
    .from("work_logs")
    .select(
      "*, profiles:employee_id(full_name), projects:project_id(id, title, vehicles:vehicle_id(license_plate, make, model), customers:customer_id(name))"
    )
    .order("log_date", { ascending: false })
    .limit(2000);
  return data ?? [];
}

export async function listCustomersOverview() {
  const supabase = createClient();
  const { data } = await supabase
    .from("customers")
    .select("*, vehicles(id, license_plate, make, model), projects(id, status)")
    .order("name");
  return data ?? [];
}

export async function listVehicles() {
  const supabase = createClient();
  const { data } = await supabase
    .from("vehicles")
    .select("*, customers:customer_id(name), projects(id, status, completed_at)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/** Auto + afgeronde behandelingen voor het Detailing Passport. */
export async function getVehiclePassport(vehicleId: string) {
  const supabase = createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, customers:customer_id(name, email, phone)")
    .eq("id", vehicleId)
    .maybeSingle();
  if (!vehicle) return null;

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("vehicle_id", vehicleId)
    .in("status", ["afgerond", "gefactureerd"])
    .order("completed_at", { ascending: true });

  return { vehicle, projects: projects ?? [] };
}

/** Eigen gelogde uren van een medewerker: vandaag + deze week (ma-zo). */
export async function getEmployeeHours(employeeId: string) {
  const supabase = createClient();
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = maandag
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  const mondayStr = monday.toISOString().slice(0, 10);
  const todayStr = now.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("work_logs")
    .select("hours, log_date")
    .eq("employee_id", employeeId)
    .gte("log_date", mondayStr);

  const rows = data ?? [];
  const today = rows
    .filter((r: any) => r.log_date === todayStr)
    .reduce((s: number, r: any) => s + Number(r.hours || 0), 0);
  const week = rows.reduce((s: number, r: any) => s + Number(r.hours || 0), 0);
  return { today, week };
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

export async function getVehicleWithProjects(
  vehicleId: string
): Promise<{ vehicle: Vehicle & { customers?: Customer }; projects: Project[] } | null> {
  const supabase = createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("*, customers:customer_id(*)")
    .eq("id", vehicleId)
    .maybeSingle();
  if (!vehicle) return null;

  const { data: projects } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("vehicle_id", vehicleId)
    .order("created_at", { ascending: false });

  return { vehicle, projects: (projects as Project[]) ?? [] };
}

export { vehicleTitle } from "@/lib/types";
