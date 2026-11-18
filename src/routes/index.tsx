import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Session-aware entry point: signed-in users land on the dashboard, others on the sign-in page.
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Leonida HR — Accueil" },
      { name: "description", content: "Accès au SIRH interne de Leonida : connexion et tableau de bord RH." },
      { property: "og:title", content: "Leonida HR — Accueil" },
      { property: "og:description", content: "Le SIRH interne de Leonida, réseaux, fibre et cloud télécom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/tableau-de-bord" });
    throw redirect({ to: "/auth", search: { redirect: undefined } });
  },
  component: () => null,
});
