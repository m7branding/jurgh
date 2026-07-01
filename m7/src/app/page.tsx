import { Configurator } from "@/components/experience/Configurator";
import "./experience.css";

// Publieke, interactieve M7 service-catalogus / online experience.
export default function HomePage() {
  return (
    <main className="exp-root" data-theme="dark">
      <Configurator />
    </main>
  );
}
