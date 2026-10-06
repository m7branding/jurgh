import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile, homePathForRole } from "@/lib/auth";
import type { EmailOtpType } from "@supabase/supabase-js";

// ============================================================
// Inloglink afhandelen.
//
// De klant klikt op een link naar /auth/confirm?token_hash=…&type=magiclink.
// verifyOtp wisselt dat token hier op de server in voor een sessie en zet de
// cookie. Dat is bewust niet de standaardlink van Supabase: die levert de
// tokens af achter een #, en een fragment stuurt de browser nooit mee naar de
// server — dan blijft de serversessie leeg.
// ============================================================

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") || "magiclink") as EmailOtpType;

  if (!tokenHash) {
    return NextResponse.redirect(new URL("/login?fout=link", url.origin));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    // verlopen of al gebruikt — een inloglink werkt maar één keer
    return NextResponse.redirect(new URL("/login?fout=verlopen", url.origin));
  }

  const profile = await getSessionProfile();
  return NextResponse.redirect(
    new URL(homePathForRole(profile?.role ?? "klant"), url.origin)
  );
}
