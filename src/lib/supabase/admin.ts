import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase-client met de service-sleutel: gaat langs RLS heen.
 *
 * Uitsluitend voor server-side code zonder ingelogde gebruiker, zoals de
 * Offorte-webhook. De sleutel staat alleen in de omgeving van de server en
 * mag nooit in een client component terechtkomen.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt.");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
