import { listCustomersWithVehicles } from "@/lib/data";
import { NewProjectForm } from "@/components/forms/NewProjectForm";
import { BackLink } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const customers = (await listCustomersWithVehicles()) as any[];
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackLink href="/admin/projecten">Terug naar projecten</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-jurgh-text">Nieuw project aanmaken</h1>
        <p className="text-jurgh-muted">
          Koppel een klant en auto, kies het type en zet het project klaar.
        </p>
      </div>
      <NewProjectForm customers={customers} />
    </div>
  );
}
