import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Clock3,
  Euro,
  FileUp,
  Palmtree,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { StatCard } from "@/components/hr/page-header";
import { ContractBadge } from "@/components/hr/badges";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import {
  SERVICE_LABELS,
  computeSeniority,
  contractEndStatus,
  formatDateFr,
  formatDays,
  formatDec1,
  formatEuroRound,
  formatPercent,
  formatSeniority,
  fullName,
  seniorityInYears,
  computeAge,
} from "@/lib/hr";
import { TYPES_CONTRAT } from "@/lib/csv-import";

export const Route = createFileRoute("/_authenticated/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Leonida HR" },
      { name: "description", content: "Vue d'ensemble RH de Leonida : effectifs, contrats, soldes de congés et alertes." },
      { property: "og:title", content: "Tableau de bord — Leonida HR" },
      { property: "og:description", content: "Effectifs, contrats, soldes et alertes RH en un coup d'œil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const CONTRACT_COLORS: Record<string, string> = {
  CDI: "var(--contract-cdi)",
  CDD: "var(--contract-cdd)",
  Alternance: "var(--contract-alternance)",
  Stage: "var(--contract-stage)",
  Freelance: "var(--contract-freelance)",
};

const serviceChartConfig = { effectif: { label: "Effectif", color: "var(--primary)" } } satisfies ChartConfig;
const contractChartConfig: ChartConfig = Object.fromEntries(
  TYPES_CONTRAT.map((t) => [t, { label: t, color: CONTRACT_COLORS[t] ?? "var(--primary)" }]),
);

function useVisibleCollaborateurs(enabled: boolean) {
  return useQuery({
    queryKey: ["collaborateurs", "dashboard"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collaborateurs")
        .select(
          "id_collaborateur, nom, prenom, code_service, type_contrat, date_naissance, date_embauche, date_fin_contrat, salaire_brut_mensuel, solde_cp, solde_rtt, id_manager, intitule_poste",
        )
        .order("nom");
      if (error) throw error;
      return data;
    },
  });
}

function Dashboard() {
  const { data: me, isLoading } = useMe();
  const role = me?.role;
  const isCollab = role === "COLLABORATEUR";
  const { data: rows, isLoading: rowsLoading } = useVisibleCollaborateurs(!!role && !isCollab);

  if (isLoading || !me) return <DashboardSkeleton />;
  const self = me.collaborateur;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-navy p-8 text-navy-foreground shadow-lift md:p-10">
        <div className="absolute inset-0 bg-gradient-navy" />
        <div className="absolute inset-0 bg-grid-signal opacity-30" />
        <div className="absolute -right-16 -top-20 size-72 rounded-full bg-gradient-signal opacity-25 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-signal">
              {role === "RH_ADMIN" ? "Espace RH" : role === "MANAGER" ? "Espace manager" : "Mon espace"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl">Bonjour {self?.prenom ?? ""}</h1>
            <p className="mt-2 max-w-xl text-navy-muted">
              {role === "RH_ADMIN" &&
                "Pilotez l'ensemble des collaborateurs de Leonida, les imports de données et les indicateurs RH."}
              {role === "MANAGER" && "Retrouvez votre équipe directe, ses contrats et ses soldes de congés."}
              {isCollab && "Consultez votre fiche, vos soldes de congés et votre contrat."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {role === "RH_ADMIN" && (
              <Button asChild variant="secondary">
                <Link to="/import">
                  <FileUp /> Importer un CSV
                </Link>
              </Button>
            )}
            {self && (
              <Button asChild className="shadow-glow">
                <Link to="/collaborateurs/$id" params={{ id: String(self.id_collaborateur) }}>
                  <UserRound /> Ma fiche
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {isCollab || !rows ? (
        isCollab && self ? (
          <CollaborateurOverview self={self} />
        ) : rowsLoading ? (
          <DashboardSkeleton />
        ) : null
      ) : (
        <TeamOverview rows={rows} isAdmin={role === "RH_ADMIN"} selfId={self?.id_collaborateur ?? null} />
      )}
    </div>
  );
}

type Row = NonNullable<ReturnType<typeof useVisibleCollaborateurs>["data"]>[number];

function TeamOverview({ rows, isAdmin, selfId }: { rows: Row[]; isAdmin: boolean; selfId: number | null }) {
  // Managers see their own fiche + their team: indicators cover the team only.
  const scope = isAdmin ? rows : rows.filter((r) => r.id_collaborateur !== selfId);
  const n = scope.length || 1;
  const cdi = scope.filter((r) => r.type_contrat === "CDI").length;
  const avgSeniority = scope.reduce((s, r) => s + seniorityInYears(r.date_embauche), 0) / n;
  const avgCp = scope.reduce((s, r) => s + Number(r.solde_cp), 0) / n;
  const avgRtt = scope.reduce((s, r) => s + Number(r.solde_rtt), 0) / n;
  const payroll = scope.reduce((s, r) => s + Number(r.salaire_brut_mensuel), 0);
  const avgAge = scope.reduce((s, r) => s + computeAge(r.date_naissance), 0) / n;

  const byService = Object.entries(
    scope.reduce<Record<string, number>>((acc, r) => {
      acc[r.code_service] = (acc[r.code_service] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([service, effectif]) => ({ service, effectif }))
    .sort((a, b) => b.effectif - a.effectif);

  const byContract = TYPES_CONTRAT.map((t) => ({
    type: t,
    value: scope.filter((r) => r.type_contrat === t).length,
  })).filter((d) => d.value > 0);

  const endings = scope
    .filter((r) => r.date_fin_contrat)
    .map((r) => ({ ...r, status: contractEndStatus(r.date_fin_contrat) }))
    .sort((a, b) => (b.date_fin_contrat ?? "").localeCompare(a.date_fin_contrat ?? ""));
  const expired = endings.filter((e) => e.status === "expired");

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={isAdmin ? "Effectif total" : "Mon équipe"}
          value={scope.length}
          hint={`${formatPercent(cdi / n)} en CDI`}
          icon={<Users className="size-4" />}
        />
        <StatCard
          label="Ancienneté moyenne"
          value={`${formatDec1(avgSeniority)} ans`}
          hint={`Âge moyen ${Math.round(avgAge)} ans`}
          icon={<Clock3 className="size-4" />}
        />
        <StatCard
          label="Solde CP moyen"
          value={formatDays(avgCp)}
          hint={`RTT moyen ${formatDays(avgRtt)}`}
          icon={<Palmtree className="size-4" />}
        />
        {isAdmin ? (
          <StatCard
            label="Masse salariale brute"
            value={formatEuroRound(payroll)}
            hint="Mensuelle, hors charges"
            icon={<Euro className="size-4" />}
          />
        ) : (
          <StatCard
            label="Fins de contrat"
            value={endings.length}
            hint={`${expired.length} échue(s) à régulariser`}
            icon={<CalendarClock className="size-4" />}
          />
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border bg-card p-6 shadow-card lg:col-span-3">
          <h2 className="text-base font-semibold">Effectif par service</h2>
          <p className="text-xs text-muted-foreground">Nombre de collaborateurs par code service</p>
          <ChartContainer config={serviceChartConfig} className="mt-4 h-[260px] w-full">
            <BarChart data={byService} margin={{ left: -16, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="service" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(v) => SERVICE_LABELS[String(v)] ?? String(v)}
                  />
                }
              />
              <Bar dataKey="effectif" fill="var(--color-effectif)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card lg:col-span-2">
          <h2 className="text-base font-semibold">Types de contrat</h2>
          <p className="text-xs text-muted-foreground">Répartition des contrats</p>
          <ChartContainer config={contractChartConfig} className="mx-auto mt-2 h-[200px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="type" hideLabel />} />
              <Pie data={byContract} dataKey="value" nameKey="type" innerRadius={52} outerRadius={84} strokeWidth={3}>
                {byContract.map((d) => (
                  <Cell key={d.type} fill={CONTRACT_COLORS[d.type]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {byContract.map((d) => (
              <li key={d.type} className="flex items-center justify-between rounded-lg bg-muted px-3 py-1.5">
                <ContractBadge type={d.type} />
                <span className="font-semibold tabular-nums">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="size-4 text-warning" /> Échéances de contrat
            </h2>
            <p className="text-xs text-muted-foreground">CDD, stages et contrats à durée déterminée</p>
          </div>
          {expired.length > 0 && <Badge variant="destructive">{expired.length} échu(s)</Badge>}
        </div>
        {endings.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Aucune date de fin de contrat renseignée.</p>
        ) : (
          <ul className="mt-4 divide-y">
            {endings.slice(0, 6).map((e) => (
              <li key={e.id_collaborateur}>
                <Link
                  to="/collaborateurs/$id"
                  params={{ id: String(e.id_collaborateur) }}
                  className="flex items-center gap-4 py-3 transition hover:bg-muted/60 sm:px-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{fullName(e)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {e.intitule_poste} · {e.code_service}
                    </p>
                  </div>
                  <ContractBadge type={e.type_contrat} />
                  <span className="w-24 text-right text-sm tabular-nums">{formatDateFr(e.date_fin_contrat)}</span>
                  <Badge
                    variant={e.status === "expired" ? "destructive" : e.status === "soon" ? "warning" : "secondary"}
                    className="hidden w-20 justify-center sm:inline-flex"
                  >
                    {e.status === "expired" ? "Échu" : e.status === "soon" ? "< 90 j" : "À venir"}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function CollaborateurOverview({ self }: { self: NonNullable<ReturnType<typeof useMe>["data"]>["collaborateur"] & {} }) {
  const seniority = computeSeniority(self.date_embauche);
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solde congés payés</p>
        <p className="mt-3 font-display text-5xl font-semibold tabular-nums text-primary">{formatDec1(Number(self.solde_cp))}</p>
        <p className="mt-1 text-sm text-muted-foreground">jours disponibles</p>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solde RTT</p>
        <p className="mt-3 font-display text-5xl font-semibold tabular-nums text-signal">{formatDec1(Number(self.solde_rtt))}</p>
        <p className="mt-1 text-sm text-muted-foreground">jours disponibles</p>
      </div>
      <div className="rounded-2xl border bg-card p-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mon contrat</p>
        <div className="mt-3 flex items-center gap-2">
          <ContractBadge type={self.type_contrat} />
          <span className="text-sm text-muted-foreground">depuis le {formatDateFr(self.date_embauche)}</span>
        </div>
        <p className="mt-3 text-lg font-semibold">{formatSeniority(seniority)}</p>
        <p className="text-sm text-muted-foreground">d'ancienneté · {self.intitule_poste}</p>
      </div>
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-dashed bg-accent/40 p-6 md:col-span-3 md:flex-row md:items-center">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="font-semibold">Poser un congé</p>
            <p className="text-sm text-muted-foreground">
              Le module Temps & Absences arrive bientôt : demandes, validation manager et décompte automatique.
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link to="/absences">
            Découvrir <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
