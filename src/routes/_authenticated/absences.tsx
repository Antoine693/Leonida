import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/hr/page-header";

export const Route = createFileRoute("/_authenticated/absences")({
  head: () => ({
    meta: [
      { title: "Temps & Absences — Leonida HR" },
      { name: "description", content: "Module GTA de Leonida HR : demandes de congés, validation manager et soldes." },
      { property: "og:title", content: "Temps & Absences — Leonida HR" },
      { property: "og:description", content: "Gestion des temps et absences des collaborateurs Leonida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Module GTA"
      title="Temps & Absences"
      text="Demandes de CP, RTT et absences, calcul en jours ouvrés, validation par le manager et décompte automatique des soldes."
    />
  ),
});

export function ModulePlaceholder({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} />
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center shadow-card">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-accent text-primary">
          <CalendarClock className="size-6" />
        </div>
        <p className="font-semibold">Module en préparation</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
