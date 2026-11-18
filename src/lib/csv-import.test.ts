import { describe, expect, it } from "vitest";
import { analyzeCsv, decodeCsvBytes, parseFrenchDate } from "./csv-import";

const HEADER =
  "id_collaborateur;nom;prenom;email;date_naissance;date_embauche;type_contrat;code_service;intitule_poste;niveau_classification;salaire_brut_mensuel;taux_temps_travail;solde_cp;solde_rtt;id_manager;profil_acces;niveau_formation;competences_cles;date_fin_contrat";

const row = (over: Partial<Record<string, string>> = {}) => {
  const base: Record<string, string> = {
    id_collaborateur: "1001",
    nom: "MEYER",
    prenom: "Sophie",
    email: "s.meyer@Leonida.fr",
    date_naissance: "24/11/1981",
    date_embauche: "01/02/2022",
    type_contrat: "CDI",
    code_service: "RH",
    intitule_poste: "Gestionnaire paie",
    niveau_classification: "Employé N3",
    salaire_brut_mensuel: "2151.01",
    taux_temps_travail: "1.0",
    solde_cp: "0.3",
    solde_rtt: "0.7",
    id_manager: "",
    profil_acces: "COLLABORATEUR",
    niveau_formation: "Bac+3",
    competences_cles: "Communication|SIRH|Paie",
    date_fin_contrat: "",
    ...over,
  };
  return HEADER.split(";")
    .map((c) => base[c])
    .join(";");
};

describe("import CSV collaborateurs", () => {
  it("converts French dates DD/MM/YYYY to ISO", () => {
    expect(parseFrenchDate("24/11/1981")).toBe("1981-11-24");
    expect(parseFrenchDate("31/02/2020")).toBeNull();
    expect(parseFrenchDate("2015-09-01")).toBeNull();
  });

  it("decodes Windows-1252 files and keeps French accents", () => {
    const bytes = new Uint8Array([0x45, 0x6d, 0x70, 0x6c, 0x6f, 0x79, 0xe9]); // "Employé" in cp1252
    const { text, encoding } = decodeCsvBytes(bytes);
    expect(encoding).toBe("Windows-1252");
    expect(text).toBe("Employé");
  });

  it("decodes UTF-8 files as UTF-8", () => {
    const { text, encoding } = decodeCsvBytes(new TextEncoder().encode("Employé"));
    expect(encoding).toBe("UTF-8");
    expect(text).toBe("Employé");
  });

  it("refuses the whole file when a required column is missing", () => {
    const csv = HEADER.replace(";email", "") + "\n";
    expect(analyzeCsv(csv).fatal).toContain("email");
  });

  it("rejects a type_contrat outside CDI, CDD, Alternance, Stage, Freelance", () => {
    const res = analyzeCsv([HEADER, row({ type_contrat: "Interim" })].join("\n"));
    expect(res.rows).toHaveLength(0);
    expect(res.rejected[0]).toMatchObject({ line: 2, column: "type_contrat", value: "Interim" });
  });

  it("rejects a profil_acces outside RH_ADMIN, MANAGER, COLLABORATEUR", () => {
    const res = analyzeCsv([HEADER, row({ profil_acces: "ADMIN" })].join("\n"));
    expect(res.rejected[0]).toMatchObject({ column: "profil_acces" });
  });

  it("rejects an invalid date with line and column", () => {
    const res = analyzeCsv([HEADER, row({ date_embauche: "2015-13-01" })].join("\n"));
    expect(res.rejected[0]).toMatchObject({ line: 2, column: "date_embauche", value: "2015-13-01" });
  });

  it("rejects only the second occurrence of a duplicated email and imports the rest", () => {
    const res = analyzeCsv(
      [
        HEADER,
        row({ id_collaborateur: "1001", email: "a.b@leonida.fr" }),
        row({ id_collaborateur: "1002", email: "c.d@leonida.fr" }),
        row({ id_collaborateur: "1003", email: "A.B@Leonida.fr" }),
      ].join("\r\n"),
    );
    expect(res.rows.map((r) => r.id_collaborateur)).toEqual([1001, 1002]);
    expect(res.rejected).toHaveLength(1);
    expect(res.rejected[0]).toMatchObject({ line: 4, column: "email" });
  });

  it("rejects the second occurrence of a duplicated id_collaborateur", () => {
    const res = analyzeCsv(
      [HEADER, row({ email: "x@leonida.fr" }), row({ email: "y@leonida.fr" })].join("\n"),
    );
    expect(res.rows).toHaveLength(1);
    expect(res.rejected[0]).toMatchObject({ line: 3, column: "id_collaborateur" });
  });

  it("imports with a non-blocking warning when id_manager is unknown", () => {
    const res = analyzeCsv([HEADER, row({ id_manager: "9999" })].join("\n"));
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0]?.id_manager).toBeNull();
    expect(res.warnings.some((w) => w.column === "id_manager" && w.value === "9999")).toBe(true);
  });

  it("imports with a warning when id_manager is empty", () => {
    const res = analyzeCsv([HEADER, row({ id_manager: "" })].join("\n"));
    expect(res.rows).toHaveLength(1);
    expect(res.warnings.some((w) => w.column === "id_manager")).toBe(true);
  });

  it("resolves a manager declared later in the file", () => {
    const res = analyzeCsv(
      [HEADER, row({ id_manager: "1002" }), row({ id_collaborateur: "1002", email: "m@leonida.fr" })].join("\n"),
    );
    expect(res.rows[0]?.id_manager).toBe(1002);
  });

  it("splits competences on | and normalises email to lower case", () => {
    const res = analyzeCsv([HEADER, row()].join("\n"));
    expect(res.rows[0]?.competences_cles).toEqual(["Communication", "SIRH", "Paie"]);
    expect(res.rows[0]?.email).toBe("s.meyer@leonida.fr");
  });
});
