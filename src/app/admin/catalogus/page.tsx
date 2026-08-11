import { getExtraWorkCatalog } from "@/lib/data";
import { SectionTitle, EmptyState } from "@/components/ui";
import { CatalogItemForm, DeleteCatalogItemButton } from "@/components/forms/StaffForms";
import { formatPrice, PRICING_MODE_LABEL, type PricingMode } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminCatalogusPage() {
  const items = await getExtraWorkCatalog();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Meerwerk-catalogus</h1>
        <p className="text-jurgh-muted">Vaste opties om snel te kiezen bij het voorstellen van meerwerk.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="card p-6">
          <SectionTitle>Nieuw item</SectionTitle>
          <CatalogItemForm />
        </section>

        <section className="card p-6">
          <SectionTitle>Catalogus ({items.length})</SectionTitle>
          {items.length === 0 ? (
            <EmptyState title="Nog geen catalogus-items" />
          ) : (
            <ul className="space-y-2">
              {items.map((item: any) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-jurgh-border bg-jurgh-black/40 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-jurgh-text">{item.title}</p>
                    <p className="text-xs text-jurgh-muted">
                      {formatPrice(Number(item.price))} (
                      {PRICING_MODE_LABEL[(item.pricing_mode as PricingMode) || "totaal"]})
                      {Number(item.estimated_hours) > 0 ? ` · ${Number(item.estimated_hours)} u` : ""}
                    </p>
                  </div>
                  <DeleteCatalogItemButton id={item.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
