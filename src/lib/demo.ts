/** Shared demo password for every collaborator account (documented in the README). */
export const DEMO_PASSWORD = "Leonida2026!";

export const DEMO_ACCOUNTS = [
  {
    role: "RH_ADMIN" as const,
    email: "m.durand@leonida.fr",
    name: "Maxime Durand",
    title: "DRH · Accès complet",
  },
  {
    role: "MANAGER" as const,
    email: "a.francois@leonida.fr",
    name: "Adrien François",
    title: "Responsable formation · 5 collaborateurs",
  },
  {
    role: "COLLABORATEUR" as const,
    email: "s.meyer@leonida.fr",
    name: "Sophie Meyer",
    title: "Gestionnaire paie · Sa fiche uniquement",
  },
];
