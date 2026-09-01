// Losse, server-onafhankelijke types + helpers (mogen ook in client components).

export type Vehicle = {
  id: string;
  license_plate: string | null;
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
  company_name: string | null;
  is_business: boolean;
  reminders_enabled: boolean;
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
  loaner_car: boolean;
  loaner_car_plate: string | null;
  transport: boolean;
  customers?: Customer;
  vehicles?: Vehicle;
};

export function vehicleTitle(v?: Vehicle | null): string {
  if (!v) return "Onbekende auto";
  const parts = [v.make, v.model].filter(Boolean).join(" ");
  return parts || v.license_plate || "Auto zonder kenteken";
}

/** Kenteken netjes weergeven; leeg kenteken mag sinds migratie 0007. */
export function hasPlate(plate?: string | null): boolean {
  return Boolean(plate && plate.trim());
}

export const NO_PLATE_LABEL = "Kenteken onbekend";

/** Kenteken uniform maken: hoofdletters, zonder streepjes of spaties. */
export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
}
