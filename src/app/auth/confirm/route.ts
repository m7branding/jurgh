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
//
// Doorsturen gebeurt met een relatieve Location. Netlify serveert dezelfde
// site ook onder een deploy-specifieke host, en een absolute URL die daaruit
// wordt afgeleid stuurt de klant naar die lange host — waar de zojuist gezette
// cookie niet geldt en hij dus alsnog uitgelogd is.
// ============================================================

export const dynamic = "force-dynamic";

function naar(pad: string) {
  return new Response(null, { status: 303, headers: { Location: pad } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") || "magiclink") as EmailOtpType;

  if (!tokenHash) return naar("/login?fout=link");

  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  // verlopen of al gebruikt — een inloglink werkt maar één keer
  if (error) return naar("/login?fout=verlopen");

  const profile = await getSessionProfile();
  return naar(homePathForRole(profile?.role ?? "klant"));
}
