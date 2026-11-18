import type { Tables } from "@/integrations/supabase/types";

export type Collaborateur = Tables<"collaborateurs">;
export type AppRole = "RH_ADMIN" | "MANAGER" | "COLLABORATEUR";

export const SERVICE_LABELS: Record<string, string> = {
  RH: "Ressources humaines",
  IT: "Informatique & réseaux",
  LOG: "Logistique",
  VENTES: "Ventes",
  COMPTA: "Comptabilité",
  MKT: "Marketing",
  JUR: "Juridique",
  DIR: "Direction",
  ACHAT: "Achats",
};

export const ROLE_LABELS: Record<AppRole, string> = {
  RH_ADMIN: "RH Admin",
  MANAGER: "Manager",
  COLLABORATEUR: "Collaborateur",
};

/** Full years between birth date (YYYY-MM-DD) and today. */
export function computeAge(isoDate: string, today: Date = new Date()): number {
  const [y = 0, m = 1, d = 1] = isoDate.split("-").map(Number);
  let age = today.getFullYear() - y;
  const beforeBirthday = today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age--;
  return age;
}

/** Completed years and months since hire date (YYYY-MM-DD). */
export function computeSeniority(isoDate: string, today: Date = new Date()): { years: number; months: number } {
  const [y = 0, m = 1, d = 1] = isoDate.split("-").map(Number);
  let months = (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m);
  if (today.getDate() < d) months--;
  if (months < 0) return { years: 0, months: 0 };
  return { years: Math.floor(months / 12), months: months % 12 };
}

export function formatSeniority(s: { years: number; months: number }): string {
  const parts: string[] = [];
  if (s.years > 0) parts.push(`${s.years} an${s.years > 1 ? "s" : ""}`);
  if (s.months > 0) parts.push(`${s.months} mois`);
  return parts.length ? parts.join(" et ") : "Moins d'un mois";
}

export function seniorityInYears(isoDate: string, today: Date = new Date()): number {
  const s = computeSeniority(isoDate, today);
  return s.years + s.months / 12;
}

export function formatDateFr(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const [y, m, d] = isoDate.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function formatLongDateFr(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(
    date,
  );
}

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const euroRound = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const formatEuro = (n: number) => euro.format(n);
export const formatEuroRound = (n: number) => euroRound.format(n);
export const formatDays = (n: number) => `${dec1.format(n)} j`;
export const formatDec1 = (n: number) => dec1.format(n);
export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)} %`;

export function fullName(c: { prenom: string; nom: string }) {
  return `${c.prenom} ${c.nom}`;
}

export function initials(c: { prenom: string; nom: string }) {
  return `${c.prenom.charAt(0)}${c.nom.charAt(0)}`.toUpperCase();
}

/** Status of a fixed-term contract end date relative to today. */
export function contractEndStatus(
  isoDate: string | null,
  today: Date = new Date(),
): "none" | "expired" | "soon" | "future" {
  if (!isoDate) return "none";
  const end = new Date(`${isoDate}T00:00:00`);
  const diffDays = (end.getTime() - today.getTime()) / 86_400_000;
  if (diffDays < 0) return "expired";
  if (diffDays <= 90) return "soon";
  return "future";
}
