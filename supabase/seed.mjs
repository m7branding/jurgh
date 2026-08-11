// ============================================================
// JURGH portaal — seed script
// Maakt 3 testaccounts (admin, medewerker, klant) + een demo dossier.
//
// Gebruik:
//   1. Run eerst de SQL migraties in supabase/migrations (in volgorde).
//   2. Zet NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY in .env
//   3. node supabase/seed.mjs
//
// Het service_role-sleutel omzeilt RLS en mag NOOIT in de browser/repo.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// minimale .env loader (geen extra dependency nodig)
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Ontbrekende NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "JurghTest123!";
const M7_PASSWORD = "123123123";

async function ensureUser(email, role, fullName, password = PASSWORD) {
  // bestaat de user al?
  const { data: list } = await admin.auth.admin.listUsers();
  let user = list?.users?.find((u) => u.email === email);

  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role, full_name: fullName },
    });
    if (error) throw error;
    user = data.user;
    console.log(`✓ user aangemaakt: ${email} (${role})`);
  } else {
    // zorg dat het testwachtwoord klopt (handig na een reset)
    await admin.auth.admin.updateUserById(user.id, { password });
    console.log(`• user bestaat al: ${email}`);
  }

  // zorg dat profielrol klopt (trigger zet 'm bij create, maar dit is idempotent)
  await admin.from("profiles").upsert({ id: user.id, role, full_name: fullName });
  return user;
}

async function ensureCustomerVehicleProject({
  customerProfileId,
  customerName,
  customerEmail,
  licensePlate,
  make,
  model,
  year,
  color,
  mileage,
  projectTitle,
  projectType,
  status,
  price,
  customerNotes,
  createdBy,
  completed = false,
}) {
  let { data: customer } = await admin
    .from("customers")
    .select("*")
    .eq("profile_id", customerProfileId)
    .maybeSingle();

  if (!customer) {
    const { data, error } = await admin
      .from("customers")
      .insert({ profile_id: customerProfileId, name: customerName, email: customerEmail })
      .select()
      .single();
    if (error) throw error;
    customer = data;
    console.log(`✓ klant aangemaakt: ${customerName}`);
  }

  let { data: vehicle } = await admin
    .from("vehicles")
    .select("*")
    .eq("customer_id", customer.id)
    .eq("license_plate", licensePlate)
    .maybeSingle();

  if (!vehicle) {
    const { data, error } = await admin
      .from("vehicles")
      .insert({ customer_id: customer.id, license_plate: licensePlate, make, model, year, color, mileage })
      .select()
      .single();
    if (error) throw error;
    vehicle = data;
    console.log(`✓ auto aangemaakt: ${make} ${model}`);
  }

  const { data: existingProject } = await admin
    .from("projects")
    .select("id")
    .eq("vehicle_id", vehicle.id)
    .maybeSingle();

  if (!existingProject) {
    const { error } = await admin.from("projects").insert({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      title: projectTitle,
      type: projectType,
      status,
      price,
      appointment_date: new Date().toISOString().slice(0, 10),
      completed_at: completed ? new Date().toISOString() : null,
      customer_notes: customerNotes,
      created_by: createdBy,
    });
    if (error) throw error;
    console.log(`✓ testproject aangemaakt: ${projectTitle}`);
  }
}

async function main() {
  const adminUser = await ensureUser("admin@jurgh.test", "admin", "JURGH Admin");
  await ensureUser("medewerker@jurgh.test", "medewerker", "JURGH Medewerker");
  const klantUser = await ensureUser("klant@jurgh.test", "klant", "Jan de Vries");

  // demo klant gekoppeld aan het klant-login account
  let { data: customer } = await admin
    .from("customers")
    .select("*")
    .eq("profile_id", klantUser.id)
    .maybeSingle();

  if (!customer) {
    const { data, error } = await admin
      .from("customers")
      .insert({
        profile_id: klantUser.id,
        name: "Jan de Vries",
        email: "klant@jurgh.test",
        phone: "+31 6 12345678",
      })
      .select()
      .single();
    if (error) throw error;
    customer = data;
    console.log("✓ demo klant aangemaakt");
  }

  // demo auto
  let { data: vehicle } = await admin
    .from("vehicles")
    .select("*")
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (!vehicle) {
    const { data, error } = await admin
      .from("vehicles")
      .insert({
        customer_id: customer.id,
        license_plate: "X-001-JG",
        make: "Porsche",
        model: "911 Carrera",
        year: 2023,
        color: "GT Silver",
        mileage: 8400,
      })
      .select()
      .single();
    if (error) throw error;
    vehicle = data;
    console.log("✓ demo auto aangemaakt");
  }

  // demo project
  const { data: existingProject } = await admin
    .from("projects")
    .select("id")
    .eq("vehicle_id", vehicle.id)
    .maybeSingle();

  if (!existingProject) {
    const { error } = await admin.from("projects").insert({
      customer_id: customer.id,
      vehicle_id: vehicle.id,
      title: "Glascoating First Class — Porsche 911",
      type: "glascoating",
      status: "in_behandeling",
      price: 1895.0,
      start_date: new Date().toISOString().slice(0, 10),
      appointment_date: new Date().toISOString().slice(0, 10),
      customer_notes: "Welkom in je JURGH dossier. Hier volg je live de voortgang.",
      created_by: adminUser.id,
    });
    if (error) throw error;
    console.log("✓ demo project aangemaakt");
  }

  // ---------- M7 Branding demo: Alexander (admin) + Alexander Koselka (klant) ----------
  const alexanderAdmin = await ensureUser("alexander@m7branding.com", "admin", "Alexander", M7_PASSWORD);
  const alexanderKlant = await ensureUser(
    "alexander_koselka@hotmail.com",
    "klant",
    "Alexander Koselka",
    M7_PASSWORD
  );

  await ensureCustomerVehicleProject({
    customerProfileId: alexanderKlant.id,
    customerName: "Alexander Koselka",
    customerEmail: "alexander_koselka@hotmail.com",
    licensePlate: "XX-001-M7",
    make: "Renault",
    model: "5 Alpine",
    year: 2026,
    color: "Alpine Blauw",
    mileage: 15,
    projectTitle: "Detailing — Renault 5 Alpine",
    projectType: "detailing",
    status: "offerte_verstuurd",
    price: 895.0,
    customerNotes: "Offerte verstuurd, we wachten op akkoord.",
    createdBy: alexanderAdmin.id,
  });

  await ensureCustomerVehicleProject({
    customerProfileId: alexanderKlant.id,
    customerName: "Alexander Koselka",
    customerEmail: "alexander_koselka@hotmail.com",
    licensePlate: "XX-002-M7",
    make: "Hyundai",
    model: "Ioniq 9",
    year: 2026,
    color: "Titan Grijs",
    mileage: 420,
    projectTitle: "PPF volledige carrosserie — Hyundai Ioniq 9",
    projectType: "ppf",
    status: "afgerond",
    price: 3450.0,
    customerNotes: "Klaar — auto is opgehaald.",
    createdBy: alexanderAdmin.id,
    completed: true,
  });

  console.log("\nKlaar. Testaccounts (wachtwoord voor alle: " + PASSWORD + "):");
  console.log("  admin@jurgh.test       → admin");
  console.log("  medewerker@jurgh.test  → medewerker");
  console.log("  klant@jurgh.test       → klant");
  console.log("\nM7 Branding testaccounts (wachtwoord voor beide: " + M7_PASSWORD + "):");
  console.log("  alexander@m7branding.com       → admin");
  console.log("  alexander_koselka@hotmail.com  → klant (Renault 5 Alpine + Hyundai Ioniq 9)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
