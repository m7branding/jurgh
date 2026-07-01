import type { Metadata } from "next";
import { Configurator } from "@/components/experience/Configurator";
import "./experience.css";

export const metadata: Metadata = {
  title: "M7 — Stel je online experience samen",
  description:
    "Blader door de M7-catalogus en stel real-time je dienstverlening samen: Hosting, Support, Marketing, Tracking, SEO/AEO, Funnels en CRM — met heldere eenmalige én doorlopende prijs.",
};

// Publieke, interactieve service-catalogus. Los van het portal-thema.
export default function ExperiencePage() {
  return (
    <main className="exp-root" data-theme="dark">
      <Configurator />
    </main>
  );
}
