/**
 * Pure CSV import logic for the collaborateurs file (no I/O).
 * Shared by the browser (decoding + preview) and the server function (authoritative validation).
 */

export const CSV_COLUMNS = [
  "id_collaborateur",
  "nom",
  "prenom",
  "email",
  "date_naissance",
  "date_embauche",
  "type_contrat",
  "code_service",
  "intitule_poste",
  "niveau_classification",
  "salaire_brut_mensuel",
  "taux_temps_travail",
  "solde_cp",
  "solde_rtt",
  "id_manager",
  "profil_acces",
  "niveau_formation",
  "competences_cles",
  "date_fin_contrat",
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

export const TYPES_CONTRAT = ["CDI", "CDD", "Alternance", "Stage", "Freelance"] as const;
export const PROFILS_ACCES = ["RH_ADMIN", "MANAGER", "COLLABORATEUR"] as const;
export const CODES_SERVICE = ["RH", "IT", "LOG", "VENTES", "COMPTA", "MKT", "JUR", "DIR", "ACHAT"] as const;

export type TypeContrat = (typeof TYPES_CONTRAT)[number];
export type ProfilAcces = (typeof PROFILS_ACCES)[number];

const REQUIRED_VALUES: CsvColumn[] = [
  "id_collaborateur",
  "nom",
  "prenom",
  "email",
  "date_naissance",
  "date_embauche",
  "type_contrat",
  "code_service",
  "intitule_poste",
  "niveau_classification",
  "salaire_brut_mensuel",
  "taux_temps_travail",
  "solde_cp",
  "solde_rtt",
  "profil_acces",
];

export interface CollaborateurRow {
  id_collaborateur: number;
  nom: string;
  prenom: string;
  email: string;
  date_naissance: string;
  date_embauche: string;
  type_contrat: TypeContrat;
  code_service: string;
  intitule_poste: string;
  niveau_classification: string;
  salaire_brut_mensuel: number;
  taux_temps_travail: number;
  solde_cp: number;
  solde_rtt: number;
  id_manager: number | null;
  profil_acces: ProfilAcces;
  niveau_formation: string | null;
  competences_cles: string[];
  date_fin_contrat: string | null;
}

export interface Anomaly {
  line: number;
  column: string;
  value: string;
  message: string;
  id_collaborateur?: string | undefined;
}

export interface ImportAnalysis {
  /** Set when the whole file is refused (e.g. missing required columns). */
  fatal: string | null;
  totalRows: number;
  rows: CollaborateurRow[];
  rejected: Anomaly[];
  warnings: Anomaly[];
}

export interface ExistingData {
  ids: Set<number>;
  /** lower-cased email -> id_collaborateur already in the database */
  emails: Map<string, number>;
}

/* ------------------------------------------------------------------ */
/* Decoding                                                            */
/* ------------------------------------------------------------------ */

export type DetectedEncoding = "UTF-8" | "Windows-1252";

/** UTF-8 when the bytes are valid UTF-8, otherwise Windows-1252 (superset of ISO-8859-1 for French). */
export function decodeCsvBytes(bytes: Uint8Array): { text: string; encoding: DetectedEncoding } {
  let text: string;
  let encoding: DetectedEncoding;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    encoding = "UTF-8";
  } catch {
    text = new TextDecoder("windows-1252").decode(bytes);
    encoding = "Windows-1252";
  }
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return { text, encoding };
}

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

interface ParsedRecord {
  line: number;
  fields: string[];
}

/** RFC-4180-style parser (quotes, escaped quotes, CRLF) with a configurable separator. */
export function parseCsv(text: string, separator = ";"): ParsedRecord[] {
  const records: ParsedRecord[] = [];
  let fields: string[] = [];
  let field = "";
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  const pushRecord = () => {
    fields.push(field);
    const isBlank = fields.length === 1 && (fields[0] ?? "").trim() === "";
    if (!isBlank) records.push({ line: recordLine, fields });
    fields = [];
    field = "";
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (ch === "\n") line++;
        field += ch;
      }
      continue;
    }
    if (ch === '"' && field.trim() === "") {
      inQuotes = true;
      field = "";
    } else if (ch === separator) {
      fields.push(field);
      field = "";
    } else if (ch === "\r") {
      // handled with \n
    } else if (ch === "\n") {
      pushRecord();
      line++;
      recordLine = line;
    } else {
      field += ch;
    }
  }
  if (field !== "" || fields.length > 0) pushRecord();
  return records;
}

/* ------------------------------------------------------------------ */
/* Value parsers                                                       */
/* ------------------------------------------------------------------ */

/** DD/MM/YYYY -> YYYY-MM-DD, or null when not a real calendar date. */
export function parseFrenchDate(value: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || year < 1900 || year > 2100) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Accepts "2151.01" and "2151,01". */
export function parseDecimal(value: string): number | null {
  const v = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(v)) return null;
  return Number(v);
}

function parseIntStrict(value: string): number | null {
  const v = value.trim();
  if (!/^\d+$/.test(v)) return null;
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export function analyzeCsv(
  text: string,
  existing: ExistingData = { ids: new Set(), emails: new Map() },
  today: Date = new Date(),
): ImportAnalysis {
  const records = parseCsv(text, ";");
  const result: ImportAnalysis = { fatal: null, totalRows: 0, rows: [], rejected: [], warnings: [] };

  if (records.length === 0) {
    result.fatal = "Le fichier est vide.";
    return result;
  }

  const header = records[0]!.fields.map((h) => h.trim().toLowerCase());
  if (header.length === 1 && (header[0] ?? "").includes(",")) {
    result.fatal =
      "Séparateur incorrect : le fichier doit utiliser le point-virgule (;) comme séparateur de colonnes.";
    return result;
  }
  const missing = CSV_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    result.fatal = `Import refusé : colonne(s) obligatoire(s) absente(s) de l'en-tête : ${missing.join(", ")}.`;
    return result;
  }
  const index = Object.fromEntries(CSV_COLUMNS.map((c) => [c, header.indexOf(c)])) as Record<CsvColumn, number>;

  const dataRecords = records.slice(1);
  result.totalRows = dataRecords.length;

  const seenIds = new Map<number, number>(); // id -> line
  const seenEmails = new Map<string, number>(); // email -> line
  const pendingManagers: { row: CollaborateurRow; line: number; raw: string }[] = [];
  const todayIso = today.toISOString().slice(0, 10);

  for (const rec of dataRecords) {
    const line = rec.line;
    const get = (c: CsvColumn) => (rec.fields[index[c]] ?? "").trim();
    const idRaw = get("id_collaborateur");
    const reject = (column: string, value: string, message: string) =>
      result.rejected.push({ line, column, value, message, id_collaborateur: idRaw || undefined });
    const warn = (column: string, value: string, message: string) =>
      result.warnings.push({ line, column, value, message, id_collaborateur: idRaw || undefined });

    if (rec.fields.length < header.length) {
      reject(
        "(ligne)",
        rec.fields.join(";").slice(0, 80),
        `Ligne malformée : ${rec.fields.length} colonne(s) au lieu de ${header.length}.`,
      );
      continue;
    }

    // 1. Required values
    const empty = REQUIRED_VALUES.find((c) => get(c) === "");
    if (empty) {
      reject(empty, "", `Valeur obligatoire manquante (${empty}).`);
      continue;
    }

    // 2. Formats
    const id = parseIntStrict(idRaw);
    if (id === null) {
      reject("id_collaborateur", idRaw, "Identifiant invalide : un entier positif est attendu.");
      continue;
    }

    const email = get("email").toLowerCase();
    if (!EMAIL_RE.test(email)) {
      reject("email", get("email"), "Adresse email invalide.");
      continue;
    }

    const dateNaissance = parseFrenchDate(get("date_naissance"));
    if (!dateNaissance) {
      reject("date_naissance", get("date_naissance"), "Date invalide : format attendu JJ/MM/AAAA (ex. 24/11/1981).");
      continue;
    }
    const dateEmbauche = parseFrenchDate(get("date_embauche"));
    if (!dateEmbauche) {
      reject("date_embauche", get("date_embauche"), "Date invalide : format attendu JJ/MM/AAAA (ex. 01/09/2015).");
      continue;
    }
    let dateFin: string | null = null;
    if (get("date_fin_contrat") !== "") {
      dateFin = parseFrenchDate(get("date_fin_contrat"));
      if (!dateFin) {
        reject("date_fin_contrat", get("date_fin_contrat"), "Date invalide : format attendu JJ/MM/AAAA.");
        continue;
      }
    }

    const typeContrat = get("type_contrat");
    if (!(TYPES_CONTRAT as readonly string[]).includes(typeContrat)) {
      reject("type_contrat", typeContrat, `Valeur non autorisée. Valeurs acceptées : ${TYPES_CONTRAT.join(", ")}.`);
      continue;
    }
    const profil = get("profil_acces");
    if (!(PROFILS_ACCES as readonly string[]).includes(profil)) {
      reject("profil_acces", profil, `Valeur non autorisée. Valeurs acceptées : ${PROFILS_ACCES.join(", ")}.`);
      continue;
    }

    const numbers: Partial<Record<CsvColumn, number>> = {};
    let badNumber: CsvColumn | null = null;
    for (const c of ["salaire_brut_mensuel", "taux_temps_travail", "solde_cp", "solde_rtt"] as const) {
      const n = parseDecimal(get(c));
      if (n === null) {
        badNumber = c;
        break;
      }
      numbers[c] = n;
    }
    if (badNumber) {
      reject(badNumber, get(badNumber), "Nombre décimal attendu (ex. 3200.00).");
      continue;
    }
    if (numbers.salaire_brut_mensuel! < 0) {
      reject("salaire_brut_mensuel", get("salaire_brut_mensuel"), "Le salaire ne peut pas être négatif.");
      continue;
    }
    if (numbers.taux_temps_travail! <= 0 || numbers.taux_temps_travail! > 1) {
      reject(
        "taux_temps_travail",
        get("taux_temps_travail"),
        "Taux de temps de travail attendu entre 0 et 1 (1.0 = 100 %).",
      );
      continue;
    }

    // 3. Uniqueness (second occurrence rejected)
    if (seenIds.has(id)) {
      reject("id_collaborateur", idRaw, `Doublon : id_collaborateur déjà présent ligne ${seenIds.get(id)}.`);
      continue;
    }
    if (seenEmails.has(email)) {
      reject("email", get("email"), `Doublon : email déjà utilisé ligne ${seenEmails.get(email)}.`);
      continue;
    }
    const emailOwner = existing.emails.get(email);
    if (emailOwner !== undefined && emailOwner !== id) {
      reject("email", get("email"), `Email déjà attribué au collaborateur ${emailOwner} en base.`);
      continue;
    }
    seenIds.set(id, line);
    seenEmails.set(email, line);

    // 4. Non-blocking coherence warnings
    const service = get("code_service").toUpperCase();
    if (!(CODES_SERVICE as readonly string[]).includes(service)) {
      warn("code_service", get("code_service"), `Code service inconnu (attendus : ${CODES_SERVICE.join(", ")}).`);
    }
    if (dateNaissance > todayIso) warn("date_naissance", get("date_naissance"), "Date de naissance dans le futur.");
    if (dateEmbauche < dateNaissance)
      warn("date_embauche", get("date_embauche"), "Date d'embauche antérieure à la date de naissance.");
    if ((typeContrat === "CDD" || typeContrat === "Stage") && !dateFin) {
      warn("date_fin_contrat", "", `${typeContrat} sans date de fin de contrat.`);
    }
    if (dateFin && dateFin < dateEmbauche)
      warn("date_fin_contrat", get("date_fin_contrat"), "Date de fin antérieure à la date d'embauche.");
    if (numbers.solde_cp! < 0) warn("solde_cp", get("solde_cp"), "Solde CP négatif.");
    if (numbers.solde_rtt! < 0) warn("solde_rtt", get("solde_rtt"), "Solde RTT négatif.");

    const competences = Array.from(
      new Set(
        get("competences_cles")
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    );

    const row: CollaborateurRow = {
      id_collaborateur: id,
      nom: get("nom"),
      prenom: get("prenom"),
      email,
      date_naissance: dateNaissance,
      date_embauche: dateEmbauche,
      type_contrat: typeContrat as TypeContrat,
      code_service: service,
      intitule_poste: get("intitule_poste"),
      niveau_classification: get("niveau_classification"),
      salaire_brut_mensuel: Math.round(numbers.salaire_brut_mensuel! * 100) / 100,
      taux_temps_travail: numbers.taux_temps_travail!,
      solde_cp: numbers.solde_cp!,
      solde_rtt: numbers.solde_rtt!,
      id_manager: null,
      profil_acces: profil as ProfilAcces,
      niveau_formation: get("niveau_formation") || null,
      competences_cles: competences,
      date_fin_contrat: dateFin,
    };
    result.rows.push(row);
    pendingManagers.push({ row, line, raw: get("id_manager") });
  }

  // 5. Manager resolution (second pass: managers may appear later in the file)
  const knownIds = new Set<number>([...existing.ids, ...result.rows.map((r) => r.id_collaborateur)]);
  for (const { row, line, raw } of pendingManagers) {
    const idStr = String(row.id_collaborateur);
    if (raw === "") {
      result.warnings.push({
        line,
        column: "id_manager",
        value: "",
        message: "Aucun manager renseigné (normal pour la direction générale).",
        id_collaborateur: idStr,
      });
      continue;
    }
    const managerId = parseIntStrict(raw);
    if (managerId === null) {
      result.warnings.push({
        line,
        column: "id_manager",
        value: raw,
        message: "Identifiant manager invalide : collaborateur importé sans manager.",
        id_collaborateur: idStr,
      });
    } else if (managerId === row.id_collaborateur) {
      result.warnings.push({
        line,
        column: "id_manager",
        value: raw,
        message: "Un collaborateur ne peut pas être son propre manager : importé sans manager.",
        id_collaborateur: idStr,
      });
    } else if (!knownIds.has(managerId)) {
      result.warnings.push({
        line,
        column: "id_manager",
        value: raw,
        message: `Manager ${managerId} introuvable : collaborateur importé sans manager.`,
        id_collaborateur: idStr,
      });
    } else {
      row.id_manager = managerId;
    }
  }

  result.rejected.sort((a, b) => a.line - b.line);
  result.warnings.sort((a, b) => a.line - b.line);
  return result;
}
