import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, FileUp, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, StatCard } from "@/components/hr/page-header";
import { Forbidden } from "@/components/hr/forbidden";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { CSV_COLUMNS, decodeCsvBytes, type Anomaly, type DetectedEncoding } from "@/lib/csv-import";
import { importCollaborateurs, type ImportReport } from "@/lib/import.functions";

export const Route = createFileRoute("/_authenticated/import")({
  head: () => ({
    meta: [
      { title: "Import CSV — Leonida HR" },
      { name: "description", content: "Import du fichier collaborateurs Leonida avec rapport détaillé des anomalies." },
      { property: "og:title", content: "Import CSV — Leonida HR" },
      { property: "og:description", content: "Importer et contrôler le fichier RH des collaborateurs Leonida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportPage,
});

interface LoadedFile {
  name: string;
  text: string;
  encoding: DetectedEncoding;
  lines: number;
}

function ImportPage() {
  const { data: me, isLoading } = useMe();
  const runImport = useServerFn(importCollaborateurs);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<LoadedFile | null>(null);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [pending, setPending] = useState<"dry" | "real" | null>(null);

  const logs = useQuery({
    queryKey: ["import_logs"],
    enabled: me?.role === "RH_ADMIN",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_logs")
        .select("id, created_at, author_name, file_name, total_rows, created_count, updated_count, rejected_count, warning_count")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return null;
  if (me?.role !== "RH_ADMIN") return <Forbidden message="L'import CSV est réservé au profil RH_ADMIN." />;

  async function onFile(f: File | undefined) {
    if (!f) return;
    const { text, encoding } = decodeCsvBytes(new Uint8Array(await f.arrayBuffer()));
    const lines = text.split(/\r?\n/).filter((l) => l.trim()).length - 1;
    setFile({ name: f.name, text, encoding, lines: Math.max(0, lines) });
    setReport(null);
  }

  async function launch(dryRun: boolean) {
    if (!file) return;
    setPending(dryRun ? "dry" : "real");
    try {
      const res = await runImport({
        data: { csvText: file.text, fileName: file.name, encoding: file.encoding, dryRun },
      });
      setReport(res);
      if (res.fatal) toast.error("Import refusé");
      else if (dryRun) toast.success("Simulation terminée : aucune donnée modifiée");
      else {
        toast.success(`${res.importedCount} ligne(s) importée(s)`);
        await queryClient.invalidateQueries();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import impossible");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Import CSV des collaborateurs"
        description="Fichier séparé par des points-virgules (;), encodage UTF-8 ou Windows-1252 détecté automatiquement, dates au format JJ/MM/AAAA."
      />

      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <label
          htmlFor="csv-file"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
          }}
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-input bg-muted/40 px-6 py-10 text-center transition hover:border-primary/50 hover:bg-accent/40"
        >
          <div className="grid size-12 place-items-center rounded-xl bg-gradient-signal text-primary-foreground shadow-glow">
            <FileUp className="size-6" />
          </div>
          <div>
            <p className="font-semibold">Déposez votre fichier CSV ici ou cliquez pour le sélectionner</p>
            <p className="mt-1 text-xs text-muted-foreground">19 colonnes attendues · séparateur « ; »</p>
          </div>
          <input
            ref={inputRef}
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </label>

        {file && (
          <div className="mt-5 flex flex-col gap-4 rounded-xl border bg-background p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="size-8 text-primary" />
              <div>
                <p className="font-semibold">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.lines} ligne(s) de données · encodage détecté : <strong>{file.encoding}</strong>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={pending !== null} onClick={() => launch(true)}>
                {pending === "dry" && <Loader2 className="animate-spin" />} Simuler (sans enregistrer)
              </Button>
              <Button disabled={pending !== null} onClick={() => launch(false)} className="shadow-glow">
                {pending === "real" ? <Loader2 className="animate-spin" /> : <FileUp />} Lancer l'import
              </Button>
            </div>
          </div>
        )}

        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-semibold">Colonnes attendues</summary>
          <p className="mt-2 font-mono leading-relaxed">{CSV_COLUMNS.join(" ; ")}</p>
        </details>
      </section>

      {report && <ReportView report={report} />}

      <section className="rounded-2xl border bg-card p-6 shadow-card">
        <h2 className="text-base font-semibold">Historique des imports</h2>
        {logs.data && logs.data.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Auteur</th>
                  <th className="py-2 pr-4">Fichier</th>
                  <th className="py-2 pr-4 text-right">Lignes</th>
                  <th className="py-2 pr-4 text-right">Créées</th>
                  <th className="py-2 pr-4 text-right">Mises à jour</th>
                  <th className="py-2 pr-4 text-right">Rejetées</th>
                  <th className="py-2 text-right">Avert.</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.data.map((l) => (
                  <tr key={l.id}>
                    <td className="py-2 pr-4 tabular-nums">{new Date(l.created_at).toLocaleString("fr-FR")}</td>
                    <td className="py-2 pr-4">{l.author_name ?? "—"}</td>
                    <td className="max-w-[200px] truncate py-2 pr-4">{l.file_name}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{l.total_rows}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{l.created_count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{l.updated_count}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{l.rejected_count}</td>
                    <td className="py-2 text-right tabular-nums">{l.warning_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Aucun import réalisé pour le moment.</p>
        )}
      </section>
    </div>
  );
}

function ReportView({ report }: { report: ImportReport }) {
  if (report.fatal) {
    return (
      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertTitle>Import refusé</AlertTitle>
        <AlertDescription>{report.fatal}</AlertDescription>
      </Alert>
    );
  }
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">Rapport d'import</h2>
        {report.dryRun ? <Badge variant="warning">Simulation</Badge> : <Badge variant="success">Enregistré</Badge>}
        <span className="text-sm text-muted-foreground">
          {report.fileName} · {report.encoding}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Lignes lues" value={report.totalRows} icon={<FileSpreadsheet className="size-4" />} />
        <StatCard
          label="Lignes importées"
          value={report.importedCount}
          hint={`${report.createdCount} créée(s) · ${report.updatedCount} mise(s) à jour`}
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard label="Lignes rejetées" value={report.rejected.length} icon={<XCircle className="size-4" />} />
        <StatCard label="Avertissements" value={report.warnings.length} icon={<AlertTriangle className="size-4" />} />
      </div>
      <Tabs defaultValue={report.rejected.length ? "rejected" : "warnings"}>
        <TabsList>
          <TabsTrigger value="rejected">Rejets ({report.rejected.length})</TabsTrigger>
          <TabsTrigger value="warnings">Avertissements ({report.warnings.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="rejected">
          <AnomalyTable items={report.rejected} empty="Aucune ligne rejetée." />
        </TabsContent>
        <TabsContent value="warnings">
          <AnomalyTable items={report.warnings} empty="Aucun avertissement." />
        </TabsContent>
      </Tabs>
    </section>
  );
}

function AnomalyTable({ items, empty }: { items: Anomaly[]; empty: string }) {
  if (!items.length) return <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5">Ligne</th>
            <th className="px-4 py-2.5">ID</th>
            <th className="px-4 py-2.5">Colonne</th>
            <th className="px-4 py-2.5">Valeur</th>
            <th className="px-4 py-2.5">Motif</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((a, i) => (
            <tr key={`${a.line}-${a.column}-${i}`}>
              <td className="px-4 py-2.5 font-mono tabular-nums">{a.line}</td>
              <td className="px-4 py-2.5 font-mono">{a.id_collaborateur ?? "—"}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{a.column}</td>
              <td className="max-w-[200px] truncate px-4 py-2.5 text-muted-foreground">{a.value || "(vide)"}</td>
              <td className="px-4 py-2.5">{a.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
