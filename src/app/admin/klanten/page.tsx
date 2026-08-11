import { listCustomersOverview } from "@/lib/data";
import { CustomerList } from "@/components/CustomerList";
import { StatCard, SectionTitle, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminKlantenPage() {
  const customers = (await listCustomersOverview()) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Klanten</h1>
        <p className="text-jurgh-muted">Alle klanten met hun auto's en projecten.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Klanten" value={customers.length} accent />
        <StatCard label="Zakelijke klanten" value={customers.filter((c) => c.is_business).length} />
        <StatCard label="Auto's totaal" value={customers.reduce((s, c) => s + (c.vehicles?.length || 0), 0)} />
      </div>

      <SectionTitle>Alle klanten</SectionTitle>
      {customers.length === 0 ? (
        <EmptyState title="Nog geen klanten" />
      ) : (
        <CustomerList customers={customers} />
      )}
    </div>
  );
}
