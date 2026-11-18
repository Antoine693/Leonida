import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "./absences";

export const Route = createFileRoute("/_authenticated/recrutement")({
  head: () => ({
    meta: [
      { title: "Recrutement — Leonida HR" },
      { name: "description", content: "Futur module Recrutement de Leonida HR : offres, pipeline candidats, onboarding." },
      { property: "og:title", content: "Recrutement — Leonida HR" },
      { property: "og:description", content: "Offres d'emploi, pipeline candidats et onboarding chez Leonida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Bientôt"
      title="Recrutement"
      text="Offres d'emploi, pipeline candidats en Kanban, planification des entretiens et onboarding."
    />
  ),
});
