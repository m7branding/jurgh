import { listAllWorkLogs } from "@/lib/data";
import { WorkLogBrowser, type WorkLogRow } from "@/components/WorkLogBrowser";

export const dynamic = "force-dynamic";

export default async function AdminUrenPage() {
  const logs = (await listAllWorkLogs()) as WorkLogRow[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Uren &amp; werkzaamheden</h1>
        <p className="text-jurgh-muted">
          Filter op medewerker, werkzaamheid, periode of auto — de totalen volgen het filter.
        </p>
      </div>

      <WorkLogBrowser logs={logs} />
    </div>
  );
}
