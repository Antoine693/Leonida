import { Link } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Forbidden({ message }: { message?: string }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
      <div className="mb-6 grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldX className="size-8" />
      </div>
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-destructive">Erreur 403</p>
      <h1 className="mt-2 text-3xl font-semibold">Accès refusé</h1>
      <p className="mt-3 text-muted-foreground">
        {message ?? "Votre profil ne vous autorise pas à consulter cette page. Le contrôle est appliqué par le serveur."}
      </p>
      <Button asChild className="mt-8">
        <Link to="/tableau-de-bord">Retour au tableau de bord</Link>
      </Button>
    </div>
  );
}

export function NotFoundCard({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg py-20 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Erreur 404
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Introuvable</h1>
      <p className="mt-3 text-muted-foreground">{message}</p>
      <Button asChild variant="outline" className="mt-8">
        <Link to="/collaborateurs">Retour à l'annuaire</Link>
      </Button>
    </div>
  );
}
