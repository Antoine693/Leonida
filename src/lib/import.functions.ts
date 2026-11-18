import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { analyzeCsv, type Anomaly } from "./csv-import";

const importSchema = z.object({
  csvText: z.string().max(5_000_000),
  fileName: z.string().max(255),
  encoding: z.enum(["UTF-8", "Windows-1252"]),
  dryRun: z.boolean(),
});

export interface ImportReport {
  fatal: string | null;
  dryRun: boolean;
  fileName: string;
  encoding: string;
  totalRows: number;
  importedCount: number;
  createdCount: number;
  updatedCount: number;
  rejected: Anomaly[];
  warnings: Anomaly[];
}

export const importCollaborateurs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => importSchema.parse(input))
  .handler(async ({ data, context }): Promise<ImportReport> => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "RH_ADMIN",
    });
    if (roleError) throw new Error("Impossible de vérifier vos droits.");
    if (!isAdmin) throw new Error("403 — L'import est réservé au profil RH_ADMIN.");

    const { data: existingRows, error: existingError } = await supabase
      .from("collaborateurs")
      .select("id_collaborateur, email");
    if (existingError) throw new Error("Lecture des collaborateurs existants impossible.");

    const existing = {
      ids: new Set(existingRows.map((r) => r.id_collaborateur)),
      emails: new Map(existingRows.map((r) => [r.email.toLowerCase(), r.id_collaborateur])),
    };

    const analysis = analyzeCsv(data.csvText, existing);
    const createdCount = analysis.rows.filter((r) => !existing.ids.has(r.id_collaborateur)).length;
    const report: ImportReport = {
      fatal: analysis.fatal,
      dryRun: data.dryRun,
      fileName: data.fileName,
      encoding: data.encoding,
      totalRows: analysis.totalRows,
      importedCount: analysis.rows.length,
      createdCount,
      updatedCount: analysis.rows.length - createdCount,
      rejected: analysis.rejected,
      warnings: analysis.warnings,
    };

    if (analysis.fatal || data.dryRun) {
      if (analysis.fatal) report.importedCount = report.createdCount = report.updatedCount = 0;
      return report;
    }

    for (let i = 0; i < analysis.rows.length; i += 200) {
      const chunk = analysis.rows.slice(i, i + 200);
      const { error } = await supabase.from("collaborateurs").upsert(chunk, { onConflict: "id_collaborateur" });
      if (error) {
        console.error("[import] upsert failed", error);
        throw new Error(`Échec de l'enregistrement en base : ${error.message}`);
      }
    }

    const { data: me } = await supabase
      .from("collaborateurs")
      .select("prenom, nom")
      .eq("user_id", userId)
      .maybeSingle();

    await supabase.from("import_logs").insert({
      author_user_id: userId,
      author_name: me ? `${me.prenom} ${me.nom}` : null,
      file_name: data.fileName,
      encoding: data.encoding,
      total_rows: report.totalRows,
      created_count: report.createdCount,
      updated_count: report.updatedCount,
      rejected_count: report.rejected.length,
      warning_count: report.warnings.length,
      report: { rejected: report.rejected, warnings: report.warnings } as never,
    });

    return report;
  });
