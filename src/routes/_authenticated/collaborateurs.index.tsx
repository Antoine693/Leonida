import { useEffect, useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/hr/page-header";
import { ContractBadge, RoleBadge } from "@/components/hr/badges";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { CODES_SERVICE, PROFILS_ACCES, TYPES_CONTRAT } from "@/lib/csv-import";
import { SERVICE_LABELS, ROLE_LABELS, formatDec1, initials } from "@/lib/hr";

const PAGE_SIZE = 15;

type ListSearch = {
  q?: string | undefined;
  service?: string | undefined;
  contrat?: string | undefined;
  profil?: string | undefined;
  page?: number | undefined;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export const Route = createFileRoute("/_authenticated/collaborateurs/")({
  validateSearch: (s: Record<string, unknown>): ListSearch => {
    const page = Number(s["page"]);
    return {
      q: str(s["q"]),
      service: str(s["service"]),
      contrat: str(s["contrat"]),
      profil: str(s["profil"]),
      page: Number.isFinite(page) && page > 1 ? Math.floor(page) : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Collaborateurs — Leonida HR" },
      { name: "description", content: "Annuaire Core RH de Leonida : recherche, filtres par service, contrat et profil." },
      { property: "og:title", content: "Collaborateurs — Leonida HR" },
      { property: "og:description", content: "Annuaire des collaborateurs Leonida avec soldes CP et RTT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CollaborateursPage,
});

function CollaborateursPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/collaborateurs/" });
  const { data: me } = useMe();
  const [term, setTerm] = useState(search.q ?? "");
  const page = search.page ?? 1;

  // Instant search: debounce typing into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((search.q ?? "") !== term.trim()) {
        navigate({ search: (prev) => ({ ...prev, q: term.trim() || undefined, page: undefined }), replace: true });
      }
    }, 200);
    return () => clearTimeout(t);
  }, [term, search.q, navigate]);

  const query = useQuery({
    queryKey: ["collaborateurs", "list", search],
    placeholderData: keepPreviousData,
    enabled: !!me && me.role !== "COLLABORATEUR",
    queryFn: async () => {
      let q = supabase
        .from("collaborateurs")
        .select(
          "id_collaborateur, nom, prenom, email, code_service, intitule_poste, type_contrat, profil_acces, solde_cp, solde_rtt",
          { count: "exact" },
        );
      const words = (search.q ?? "")
        .replace(/[%,()*\\.:]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      for (const w of words) q = q.or(`nom.ilike.%${w}%,prenom.ilike.%${w}%`);
      if (search.service) q = q.eq("code_service", search.service);
      if (search.contrat) q = q.eq("type_contrat", search.contrat);
      if (search.profil) q = q.eq("profil_acces", search.profil);
      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await q
        .order("nom")
        .order("prenom")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });

  if (me?.role === "COLLABORATEUR" && me.collaborateur) {
    return <Navigate to="/collaborateurs/$id" params={{ id: String(me.collaborateur.id_collaborateur) }} replace />;
  }

  const setFilter = (key: "service" | "contrat" | "profil", value: string) =>
    navigate({ search: (prev) => ({ ...prev, [key]: value === "all" ? undefined : value, page: undefined }) });

  const total = query.data?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = !!(search.q || search.service || search.contrat || search.profil);

  return (
    <div>
      <PageHeader
        eyebrow="Core RH"
        title={me?.role === "MANAGER" ? "Mon équipe" : "Collaborateurs"}
        description={
          me?.role === "MANAGER"
            ? "Votre fiche et celles des collaborateurs dont vous êtes le manager direct."
            : "Annuaire complet des collaborateurs de Leonida."
        }
      />

      <div className="mb-4 grid gap-3 rounded-xl border bg-card p-4 shadow-card md:grid-cols-[1fr_repeat(3,minmax(0,180px))_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Rechercher par nom ou prénom"
            placeholder="Rechercher par nom ou prénom…"
            className="pl-9"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Select value={search.service ?? "all"} onValueChange={(v) => setFilter("service", v)}>
          <SelectTrigger aria-label="Service">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les services</SelectItem>
            {CODES_SERVICE.map((s) => (
              <SelectItem key={s} value={s}>
                {s} · {SERVICE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.contrat ?? "all"} onValueChange={(v) => setFilter("contrat", v)}>
          <SelectTrigger aria-label="Type de contrat">
            <SelectValue placeholder="Contrat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les contrats</SelectItem>
            {TYPES_CONTRAT.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={search.profil ?? "all"} onValueChange={(v) => setFilter("profil", v)}>
          <SelectTrigger aria-label="Profil d'accès">
            <SelectValue placeholder="Profil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les profils</SelectItem>
            {PROFILS_ACCES.map((p) => (
              <SelectItem key={p} value={p}>
                {ROLE_LABELS[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          disabled={!hasFilters}
          onClick={() => {
            setTerm("");
            navigate({ search: {} });
          }}
        >
          <RotateCcw /> Réinitialiser
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Collaborateur</th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">Poste</th>
                <th className="px-4 py-3 font-semibold">Contrat</th>
                <th className="px-4 py-3 font-semibold">Profil</th>
                <th className="px-4 py-3 text-right font-semibold">Solde CP</th>
                <th className="px-4 py-3 text-right font-semibold">Solde RTT</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {query.isLoading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </td>
                  </tr>
                ))}
              {query.data?.rows.map((c) => (
                <tr
                  key={c.id_collaborateur}
                  tabIndex={0}
                  role="link"
                  onClick={() => navigate({ to: "/collaborateurs/$id", params: { id: String(c.id_collaborateur) } })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      navigate({ to: "/collaborateurs/$id", params: { id: String(c.id_collaborateur) } });
                  }}
                  className="cursor-pointer transition hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-xs font-bold text-primary">
                        {initials(c)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {c.nom} {c.prenom}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold">{c.code_service}</span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">{c.intitule_poste}</td>
                  <td className="px-4 py-3">
                    <ContractBadge type={c.type_contrat} />
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={c.profil_acces} />
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatDec1(Number(c.solde_cp))} j</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatDec1(Number(c.solde_rtt))} j</td>
                </tr>
              ))}
              {query.data && query.data.rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Aucun collaborateur ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm sm:flex-row">
          <p className="text-muted-foreground">
            {total} collaborateur{total > 1 ? "s" : ""} · page {Math.min(page, pages)} sur {pages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => navigate({ search: (prev) => ({ ...prev, page: page - 1 > 1 ? page - 1 : undefined }) })}
            >
              <ChevronLeft /> Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => navigate({ search: (prev) => ({ ...prev, page: page + 1 }) })}
            >
              Suivant <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
