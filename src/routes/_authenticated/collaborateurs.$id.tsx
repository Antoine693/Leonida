import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, GraduationCap, Mail, Network, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContractBadge, RoleBadge } from "@/components/hr/badges";
import { Forbidden, NotFoundCard } from "@/components/hr/forbidden";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import {
  SERVICE_LABELS,
  computeAge,
  computeSeniority,
  contractEndStatus,
  formatDateFr,
  formatDec1,
  formatEuro,
  formatPercent,
  formatSeniority,
  fullName,
  initials,
  type Collaborateur,
} from "@/lib/hr";

export const Route = createFileRoute("/_authenticated/collaborateurs/$id")({
  head: () => ({
    meta: [
      { title: "Fiche collaborateur — Leonida HR" },
      { name: "description", content: "Fiche collaborateur Leonida : contrat, poste, soldes, compétences et manager." },
      { property: "og:title", content: "Fiche collaborateur — Leonida HR" },
      { property: "og:description", content: "Toutes les données RH d'un collaborateur Leonida." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FichePage,
});

type FicheResult =
  | { status: "forbidden" | "not_found" }
  | {
      status: "ok";
      fiche: Collaborateur;
      manager: ManagerInfo | null;
      team: { id_collaborateur: number; nom: string; prenom: string; intitule_poste: string; type_contrat: string }[];
    };

interface ManagerInfo {
  id_collaborateur: number;
  nom: string;
  prenom: string;
  intitule_poste: string;
  can_open: boolean;
}

function useFiche(id: number | null) {
  return useQuery({
    queryKey: ["collaborateurs", "fiche", id],
    enabled: id !== null,
    queryFn: async (): Promise<FicheResult> => {
      const _id = id as number;
      // Server-side access decision (RLS + security definer function): ok / forbidden / not_found.
      const { data: access, error: accessError } = await supabase.rpc("collaborateur_access", { _id });
      if (accessError) throw accessError;
      if (access !== "ok") return { status: access === "not_found" ? "not_found" : "forbidden" };

      const [fiche, manager, team] = await Promise.all([
        supabase.from("collaborateurs").select("*").eq("id_collaborateur", _id).maybeSingle(),
        supabase.rpc("get_manager_of", { _id }),
        supabase
          .from("collaborateurs")
          .select("id_collaborateur, nom, prenom, intitule_poste, type_contrat")
          .eq("id_manager", _id)
          .order("nom"),
      ]);
      if (fiche.error) throw fiche.error;
      if (!fiche.data) return { status: "forbidden" };
      return {
        status: "ok",
        fiche: fiche.data,
        manager: manager.data?.[0] ?? null,
        team: team.data ?? [],
      };
    },
  });
}

function FichePage() {
  const { id } = Route.useParams();
  const numericId = /^\d+$/.test(id) ? Number(id) : null;
  const { data: me } = useMe();
  const { data, isLoading, error } = useFiche(numericId);

  if (numericId === null) return <NotFoundCard message="Identifiant de collaborateur invalide." />;
  if (isLoading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  if (error) return <NotFoundCard message="La fiche n'a pas pu être chargée. Réessayez." />;
  if (!data || data.status === "not_found") return <NotFoundCard message={`Aucun collaborateur n°${id}.`} />;
  if (data.status !== "ok")
    return <Forbidden message="Vous n'êtes pas autorisé à consulter la fiche de ce collaborateur." />;

  const { fiche: c, manager, team } = data;
  const age = computeAge(c.date_naissance);
  const seniority = computeSeniority(c.date_embauche);
  const endStatus = contractEndStatus(c.date_fin_contrat);
  const isSelf = me?.collaborateur?.id_collaborateur === c.id_collaborateur;

  return (
    <div className="space-y-6">
      {me?.role !== "COLLABORATEUR" && (
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/collaborateurs">
            <ArrowLeft /> Retour à l'annuaire
          </Link>
        </Button>
      )}

      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl bg-navy p-6 text-navy-foreground shadow-lift md:p-8">
        <div className="absolute inset-0 bg-gradient-navy" />
        <div className="absolute inset-0 bg-grid-signal opacity-25" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-signal font-display text-xl font-semibold text-primary-foreground shadow-glow">
              {initials(c)}
            </div>
            <div>
              <p className="font-mono text-xs text-signal">
                #{c.id_collaborateur} {isSelf && "· Ma fiche"}
              </p>
              <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{fullName(c)}</h1>
              <p className="mt-1 text-navy-muted">
                {c.intitule_poste} · {SERVICE_LABELS[c.code_service] ?? c.code_service}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ContractBadge type={c.type_contrat} />
                <RoleBadge role={c.profil_acces} />
                <a
                  href={`mailto:${c.email}`}
                  className="inline-flex items-center gap-1 text-xs text-navy-muted hover:text-signal"
                >
                  <Mail className="size-3.5" /> {c.email}
                </a>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-sidebar-accent px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-muted">Solde CP</p>
              <p className="font-display text-2xl font-semibold tabular-nums">{formatDec1(Number(c.solde_cp))} j</p>
            </div>
            <div className="rounded-xl bg-sidebar-accent px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-navy-muted">Solde RTT</p>
              <p className="font-display text-2xl font-semibold tabular-nums text-signal">
                {formatDec1(Number(c.solde_rtt))} j
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section icon={<UserRound className="size-4" />} title="Identité">
          <Field label="Nom" value={c.nom} />
          <Field label="Prénom" value={c.prenom} />
          <Field label="Email" value={c.email} />
          <Field label="Date de naissance" value={formatDateFr(c.date_naissance)} />
          <Field label="Âge" value={`${age} ans`} />
        </Section>

        <Section icon={<Briefcase className="size-4" />} title="Contrat">
          <Field label="Type de contrat" value={<ContractBadge type={c.type_contrat} />} />
          <Field label="Date d'embauche" value={formatDateFr(c.date_embauche)} />
          <Field label="Ancienneté" value={formatSeniority(seniority)} />
          <Field
            label="Date de fin de contrat"
            value={
              c.date_fin_contrat ? (
                <span className="flex items-center gap-2">
                  {formatDateFr(c.date_fin_contrat)}
                  {endStatus === "expired" && <Badge variant="destructive">Échu</Badge>}
                  {endStatus === "soon" && <Badge variant="warning">Moins de 90 jours</Badge>}
                </span>
              ) : (
                "—"
              )
            }
          />
          <Field label="Temps de travail" value={formatPercent(Number(c.taux_temps_travail))} />
        </Section>

        <Section icon={<Briefcase className="size-4" />} title="Poste & rémunération">
          <Field label="Service" value={`${c.code_service} · ${SERVICE_LABELS[c.code_service] ?? ""}`} />
          <Field label="Intitulé du poste" value={c.intitule_poste} />
          <Field label="Classification" value={c.niveau_classification} />
          <Field label="Salaire brut mensuel" value={formatEuro(Number(c.salaire_brut_mensuel))} />
          <Field label="Profil d'accès" value={<RoleBadge role={c.profil_acces} />} />
        </Section>

        <Section icon={<GraduationCap className="size-4" />} title="Formation & compétences">
          <Field label="Niveau de formation" value={c.niveau_formation ?? "—"} />
          <div className="py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Compétences clés
            </p>
            {c.competences_cles.length ? (
              <div className="flex flex-wrap gap-1.5">
                {c.competences_cles.map((skill) => (
                  <Badge key={skill} variant="signal">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune compétence renseignée.</p>
            )}
          </div>
        </Section>

        <Section icon={<Network className="size-4" />} title="Hiérarchie" className="lg:col-span-2">
          <Field
            label="Manager direct"
            value={
              manager ? (
                manager.can_open ? (
                  <Link
                    to="/collaborateurs/$id"
                    params={{ id: String(manager.id_collaborateur) }}
                    className="font-semibold text-primary hover:underline"
                  >
                    {manager.prenom} {manager.nom}
                    <span className="ml-1 font-normal text-muted-foreground">· {manager.intitule_poste}</span>
                  </Link>
                ) : (
                  <span>
                    <span className="font-semibold">
                      {manager.prenom} {manager.nom}
                    </span>
                    <span className="ml-1 text-muted-foreground">· {manager.intitule_poste}</span>
                  </span>
                )
              ) : (
                "Aucun manager (direction)"
              )
            }
          />
          {team.length > 0 && (
            <div className="py-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Équipe directe ({team.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {team.map((t) => (
                  <Link
                    key={t.id_collaborateur}
                    to="/collaborateurs/$id"
                    params={{ id: String(t.id_collaborateur) }}
                    className="flex items-center gap-3 rounded-lg border p-2.5 transition hover:border-primary/40 hover:bg-accent/40"
                  >
                    <div className="grid size-8 place-items-center rounded-md bg-accent text-[11px] font-bold text-primary">
                      {initials(t)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{fullName(t)}</p>
                      <p className="truncate text-xs text-muted-foreground">{t.intitule_poste}</p>
                    </div>
                    <ContractBadge type={t.type_contrat} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border bg-card p-6 shadow-card ${className ?? ""}`}>
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold">
        <span className="grid size-7 place-items-center rounded-lg bg-accent text-primary">{icon}</span>
        {title}
      </h2>
      <div className="divide-y">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words">{value}</span>
    </div>
  );
}
