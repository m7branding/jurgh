import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { importWonProposal, logOfforteEvent } from "@/lib/offorte-import";

// ============================================================
// Webhook-eindpunt voor Offorte.
//
// Offorte stuurt { type, date_created, data } en ondertekent niets, dus de
// beveiliging zit in een geheim in de URL:
//   https://<portaal>/api/offorte/webhook?token=<OFFORTE_WEBHOOK_SECRET>
//
// Alleen 'proposal_won' doet iets; de rest wordt netjes genegeerd zodat de
// webhook in Offorte op "alle events" mag staan.
// ============================================================

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tokenMatches(given: string | null): boolean {
  const expected = process.env.OFFORTE_WEBHOOK_SECRET;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? request.headers.get("x-webhook-token");
  if (!tokenMatches(token)) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Geen geldige JSON" }, { status: 400 });
  }

  const eventType = String(payload?.type ?? "");
  const data = payload?.data ?? {};
  const proposalId = data.id ?? data.proposal_id ?? null;

  if (eventType !== "proposal_won") {
    return NextResponse.json({ ok: true, ignored: eventType });
  }

  if (!proposalId) {
    await logOfforteEvent({
      eventType,
      status: "fout",
      message: "proposal_won zonder offerte-id in de payload.",
    });
    return NextResponse.json({ error: "Geen offerte-id in de payload" }, { status: 400 });
  }

  try {
    const result = await importWonProposal(proposalId);
    await logOfforteEvent({
      eventType,
      proposalId,
      status: result.status,
      message: result.status === "ok" ? `Project aangemaakt: ${result.title}` : result.message,
      projectId: "projectId" in result ? result.projectId : null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Onbekende fout";
    await logOfforteEvent({ eventType, proposalId, status: "fout", message });
    // 500 zodat de mislukking ook in het webhook-overzicht van Offorte zichtbaar is
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Handig om te controleren of het eindpunt leeft, zonder iets te verklappen. */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "offorte-webhook" });
}
