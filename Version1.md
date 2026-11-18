
===== FICHIER : leonida-hr/.gitignore =====
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
.output
.vinxi
.tanstack/**
.nitro
*.local

# Wrangler / Cloudflare
.wrangler/
.dev.vars

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?


===== FICHIER : leonida-hr/.prettierignore =====
node_modules
dist
.output
.vinxi
pnpm-lock.yaml
package-lock.json
bun.lock
routeTree.gen.ts


===== FICHIER : leonida-hr/.prettierrc =====
{
  "printWidth": 100,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all"
}


===== FICHIER : leonida-hr/AGENTS.md =====
<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Access control lives in Postgres RLS + security-definer functions (`has_role`, `can_view_collaborateur`, `collaborateur_access`, `get_manager_of`); UI checks are cosmetic only. Why: the spec requires server-side enforcement.
- Roles are stored in `public.user_roles`, synced by trigger from `collaborateurs.profil_acces`; never read privileges from the collaborateurs row in code. Why: avoids privilege escalation.
- Login accounts are created lazily by `activateCollaboratorAccount` (service role) on first sign-in of an email present in `collaborateurs`; public sign-up stays disabled. Why: the HR file is the source of truth for who can log in.
- CSV parsing/validation is a pure module (`src/lib/csv-import.ts`) shared by browser and server; the server function re-validates authoritatively. Why: one rule set, testable with vitest.
- Signed-in pages live under `src/routes/_authenticated/` (client-only gate, shell with sidebar); new modules add a route there and a sidebar entry. Why: consistent navigation for future modules.


===== FICHIER : leonida-hr/README.md =====
# Leonida HR — SIRH interne

SIRH interne de Leonida (télécoms : réseaux, fibre, cloud télécom — 100 collaborateurs).

## Modules

- **Tableau de bord** : effectifs, contrats, ancienneté, soldes CP/RTT, masse salariale (RH_ADMIN), échéances de contrat.
- **Collaborateurs (Core RH)** : annuaire paginé (15 / page), recherche instantanée nom/prénom, filtres service / contrat / profil, fiche complète (âge, ancienneté, compétences, manager cliquable, équipe directe).
- **Import CSV** (RH_ADMIN) : fichier `;`, encodage UTF-8 ou Windows-1252 détecté automatiquement, rapport détaillé (lignes importées, rejetées avec ligne / colonne / motif, avertissements), mode simulation, historique.
- **Temps & Absences (GTA)** et **Recrutement** : emplacements prêts, modules à développer.

## Comptes de démonstration

Mot de passe commun : `Leonida2026!`

| Profil | Email | Droits |
| --- | --- | --- |
| RH_ADMIN | m.durand@leonida.fr | Tous les collaborateurs, import CSV, statistiques |
| MANAGER | a.francois@leonida.fr | Sa fiche + ses 5 collaborateurs directs |
| COLLABORATEUR | s.meyer@leonida.fr | Sa fiche uniquement (403 sur les autres) |

Tout collaborateur présent dans la base peut se connecter avec son email et ce mot de passe : son compte est créé à la première connexion. L'inscription libre est désactivée.

## Règles d'accès

Les droits sont appliqués par la base de données (Row Level Security), pas seulement par l'interface :
- RH_ADMIN : lecture / écriture de toutes les fiches, import, journal des imports.
- MANAGER : sa fiche + collaborateurs dont il est `id_manager`.
- COLLABORATEUR : sa propre fiche. L'URL d'une autre fiche affiche « Erreur 403 — Accès refusé ».
- Le rôle vient de la colonne `profil_acces` et est synchronisé automatiquement dans une table de rôles séparée.

## Procédure d'import

1. Se connecter en RH_ADMIN → menu **Import CSV**.
2. Déposer le fichier (19 colonnes : `id_collaborateur;nom;prenom;email;date_naissance;date_embauche;type_contrat;code_service;intitule_poste;niveau_classification;salaire_brut_mensuel;taux_temps_travail;solde_cp;solde_rtt;id_manager;profil_acces;niveau_formation;competences_cles;date_fin_contrat`).
3. **Simuler** pour voir le rapport sans rien enregistrer, puis **Lancer l'import**.

Contrôles : colonnes obligatoires (sinon import refusé), valeurs obligatoires, dates `JJ/MM/AAAA`, `type_contrat` ∈ CDI/CDD/Alternance/Stage/Freelance, `profil_acces` ∈ RH_ADMIN/MANAGER/COLLABORATEUR, unicité `id_collaborateur` et email (2ᵉ occurrence rejetée), `id_manager` vide ou introuvable → avertissement non bloquant (importé sans manager), CDD/Stage sans date de fin → avertissement. Un collaborateur existant (même `id_collaborateur`) est mis à jour.

Avec le fichier fourni : 100 lignes, 98 importées, 2 rejetées (emails en doublon lignes 39 et 101), 7 avertissements (managers vides de la direction).

## Stack

TanStack Start (React 19, TypeScript), Tailwind CSS v4, Lovable Cloud (base PostgreSQL, authentification, fonctions serveur).

Tests : `bunx vitest run` (règles d'import, calculs d'âge et d'ancienneté).

## Limites connues

- Mot de passe de démo commun à tous les comptes (en production : invitation par email et mot de passe personnel).
- Modules GTA et Recrutement non développés.
- Pas d'export PDF pour le moment.


===== FICHIER : leonida-hr/bunfig.toml =====
[install]
saveTextLockfile = true
# 24h supply-chain guard: skip package versions published less than a day ago.
minimumReleaseAge = 86400
# Each entry bypasses the 24h guard for one package — confirm with the user
# before adding any.
minimumReleaseAgeExcludes = ["@lovable.dev/vite-tanstack-config", "@lovable.dev/mcp-js", "@lovable.dev/ai-gateway", "@lovable.dev/email-js", "@lovable.dev/webhooks-js", "@lovable.dev/lovable-auth-js"]


===== FICHIER : leonida-hr/components.json =====
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "css": "src/styles.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "rtl": false,
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {}
}


===== FICHIER : leonida-hr/drizzle.config.ts =====
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.LOVABLE_DB_MIGRATION_URL ?? "",
  },
});


===== FICHIER : leonida-hr/eslint.config.js =====
import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".output", ".vinxi"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "server-only",
              message:
                "TanStack Start does not use the Next.js `server-only` package. Rename the module to `*.server.ts` or mark it with `@tanstack/react-start/server-only`.",
            },
          ],
        },
      ],
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  eslintPluginPrettier,
);


===== FICHIER : leonida-hr/package.json =====
{
  "name": "tanstack_start_ts",
  "private": true,
  "sideEffects": false,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "overrides": {
    "rolldown": "1.2.1"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.2.2",
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-aspect-ratio": "^1.1.8",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-context-menu": "^2.2.16",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-hover-card": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-menubar": "^1.1.16",
    "@radix-ui/react-navigation-menu": "^1.2.14",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-progress": "^1.1.8",
    "@radix-ui/react-radio-group": "^1.3.8",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slider": "^1.3.6",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-toggle": "^1.1.10",
    "@radix-ui/react-toggle-group": "^1.1.11",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@supabase/supabase-js": "^2.119.0",
    "@tailwindcss/vite": "^4.2.1",
    "@tanstack/react-query": "^5.101.1",
    "@tanstack/react-router": "1.170.41",
    "@tanstack/react-start": "1.168.60",
    "@tanstack/router-plugin": "1.168.42",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^4.1.0",
    "embla-carousel-react": "^8.6.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.575.0",
    "react": "^19.2.0",
    "react-day-picker": "^9.14.0",
    "react-dom": "^19.2.0",
    "react-hook-form": "^7.71.2",
    "react-resizable-panels": "^4.6.5",
    "recharts": "^2.15.4",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tailwindcss": "^4.2.1",
    "tw-animate-css": "^1.3.4",
    "vaul": "^1.1.2",
    "vite-tsconfig-paths": "^6.0.2",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@eslint/js": "^9.32.0",
    "@lovable.dev/vite-tanstack-config": "2.27.2",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.0.0",
    "@types/node": "^22.16.5",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.2.0",
    "drizzle-kit": "0.x",
    "drizzle-orm": "0.x",
    "eslint": "^9.32.0",
    "eslint-config-prettier": "^10.1.1",
    "eslint-plugin-prettier": "^5.2.6",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "jsdom": "^20.0.3",
    "nitro": "3.0.260603-beta",
    "postgres": "^4.1.1",
    "prettier": "^3.7.3",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.56.1",
    "vite": "8.1.5",
    "vitest": "^4.1.10"
  }
}


===== FICHIER : leonida-hr/tsconfig.json =====
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "vite.config.ts",
    "vitest.config.ts",
    "eslint.config.js"
  ],
  "compilerOptions": {
    "target": "ES2022",
    "jsx": "react-jsx",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals"],

    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": false,
    "noEmit": true,

    "skipLibCheck": true,
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedSideEffectImports": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}


===== FICHIER : leonida-hr/vite.config.ts =====
// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// Never set ssr.external or resolve.external: the Worker has no runtime module resolution, so
// the build fails. Never add compression (compressPublicAssets, vite-plugin-compression):
// hosting already compresses at the edge.
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});


===== FICHIER : leonida-hr/vitest.config.ts =====
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});


===== FICHIER : leonida-hr/drizzle/schema.ts =====
// auto-generated and intentionally left blank, do not edit


===== FICHIER : leonida-hr/drizzle/migrations/0000_sirh_core_schema.sql =====
CREATE TYPE public.app_role AS ENUM ('RH_ADMIN', 'MANAGER', 'COLLABORATEUR');

-- ============ Collaborateurs ============
CREATE TABLE public.collaborateurs (
  id_collaborateur integer PRIMARY KEY CHECK (id_collaborateur > 0),
  user_id uuid UNIQUE,
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL UNIQUE,
  date_naissance date NOT NULL,
  date_embauche date NOT NULL,
  type_contrat text NOT NULL CHECK (type_contrat IN ('CDI','CDD','Alternance','Stage','Freelance')),
  code_service text NOT NULL,
  intitule_poste text NOT NULL,
  niveau_classification text NOT NULL,
  salaire_brut_mensuel numeric(12,2) NOT NULL,
  taux_temps_travail numeric(4,2) NOT NULL,
  solde_cp numeric(6,2) NOT NULL DEFAULT 0,
  solde_rtt numeric(6,2) NOT NULL DEFAULT 0,
  id_manager integer,
  profil_acces text NOT NULL CHECK (profil_acces IN ('RH_ADMIN','MANAGER','COLLABORATEUR')),
  niveau_formation text,
  competences_cles text[] NOT NULL DEFAULT '{}',
  date_fin_contrat date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX collaborateurs_id_manager_idx ON public.collaborateurs (id_manager);
CREATE INDEX collaborateurs_code_service_idx ON public.collaborateurs (code_service);
CREATE INDEX collaborateurs_nom_idx ON public.collaborateurs (nom, prenom);

-- user_id is only ever set by the server (service role) when an account is activated.
GRANT SELECT, DELETE ON public.collaborateurs TO authenticated;
GRANT INSERT (id_collaborateur, nom, prenom, email, date_naissance, date_embauche, type_contrat, code_service, intitule_poste, niveau_classification, salaire_brut_mensuel, taux_temps_travail, solde_cp, solde_rtt, id_manager, profil_acces, niveau_formation, competences_cles, date_fin_contrat)
  ON public.collaborateurs TO authenticated;
GRANT UPDATE (nom, prenom, email, date_naissance, date_embauche, type_contrat, code_service, intitule_poste, niveau_classification, salaire_brut_mensuel, taux_temps_travail, solde_cp, solde_rtt, id_manager, profil_acces, niveau_formation, competences_cles, date_fin_contrat, updated_at)
  ON public.collaborateurs TO authenticated;
GRANT ALL ON public.collaborateurs TO service_role;

ALTER TABLE public.collaborateurs ENABLE ROW LEVEL SECURITY;

-- ============ Rôles ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ Journal des imports ============
CREATE TABLE public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  author_user_id uuid NOT NULL DEFAULT auth.uid(),
  author_name text,
  file_name text,
  encoding text,
  total_rows integer NOT NULL DEFAULT 0,
  created_count integer NOT NULL DEFAULT 0,
  updated_count integer NOT NULL DEFAULT 0,
  rejected_count integer NOT NULL DEFAULT 0,
  warning_count integer NOT NULL DEFAULT 0,
  report jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT, INSERT ON public.import_logs TO authenticated;
GRANT ALL ON public.import_logs TO service_role;

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- ============ Fonctions d'accès ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_collaborateur_id()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id_collaborateur FROM public.collaborateurs WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_view_collaborateur(_id integer)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    auth.uid() IS NOT NULL AND (
      public.has_role(auth.uid(), 'RH_ADMIN')
      OR EXISTS (
        SELECT 1 FROM public.collaborateurs c
        WHERE c.id_collaborateur = _id
          AND (
            c.user_id = auth.uid()
            OR (public.has_role(auth.uid(), 'MANAGER') AND c.id_manager = public.current_collaborateur_id())
          )
      )
    )
$$;

-- 'ok' | 'forbidden' | 'not_found' — lets the UI show a real 403 page.
CREATE OR REPLACE FUNCTION public.collaborateur_access(_id integer)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN 'forbidden'
    WHEN NOT EXISTS (SELECT 1 FROM public.collaborateurs WHERE id_collaborateur = _id) THEN 'not_found'
    WHEN public.can_view_collaborateur(_id) THEN 'ok'
    ELSE 'forbidden'
  END
$$;

-- Manager name for a fiche the caller is allowed to see (name, title, service only).
CREATE OR REPLACE FUNCTION public.get_manager_of(_id integer)
RETURNS TABLE (id_collaborateur integer, nom text, prenom text, intitule_poste text, code_service text, can_open boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT m.id_collaborateur, m.nom, m.prenom, m.intitule_poste, m.code_service,
         public.can_view_collaborateur(m.id_collaborateur)
  FROM public.collaborateurs c
  JOIN public.collaborateurs m ON m.id_collaborateur = c.id_manager
  WHERE c.id_collaborateur = _id
    AND public.can_view_collaborateur(_id)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_collaborateur_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_view_collaborateur(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.collaborateur_access(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_manager_of(integer) FROM anon;

-- ============ Policies ============
CREATE POLICY "Lecture selon le rôle"
  ON public.collaborateurs FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'RH_ADMIN')
    OR user_id = auth.uid()
    OR (public.has_role(auth.uid(), 'MANAGER') AND id_manager = public.current_collaborateur_id())
  );

CREATE POLICY "RH_ADMIN crée des fiches"
  ON public.collaborateurs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'RH_ADMIN'));

CREATE POLICY "RH_ADMIN modifie des fiches"
  ON public.collaborateurs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'RH_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'RH_ADMIN'));

CREATE POLICY "RH_ADMIN supprime des fiches"
  ON public.collaborateurs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'RH_ADMIN'));

CREATE POLICY "Chacun lit ses rôles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "RH_ADMIN lit le journal des imports"
  ON public.import_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'RH_ADMIN'));

CREATE POLICY "RH_ADMIN écrit le journal des imports"
  ON public.import_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'RH_ADMIN') AND author_user_id = auth.uid());

-- ============ Triggers ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER collaborateurs_touch_updated_at
  BEFORE UPDATE ON public.collaborateurs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Keeps user_roles in sync with profil_acces (the CSV column is the source of truth).
CREATE OR REPLACE FUNCTION public.sync_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.user_id IS NOT NULL AND OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    DELETE FROM public.user_roles WHERE user_id = OLD.user_id;
  END IF;
  IF NEW.user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, NEW.profil_acces::public.app_role);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER collaborateurs_sync_role
  AFTER INSERT OR UPDATE OF profil_acces, user_id ON public.collaborateurs
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_role();

CREATE OR REPLACE FUNCTION public.remove_user_role_on_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.user_id IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = OLD.user_id;
  END IF;
  RETURN OLD;
END;
$$;

CREATE TRIGGER collaborateurs_remove_role
  AFTER DELETE ON public.collaborateurs
  FOR EACH ROW EXECUTE FUNCTION public.remove_user_role_on_delete();

===== FICHIER : leonida-hr/drizzle/migrations/0001_seed_collaborateurs_leonida.sql =====
INSERT INTO public.collaborateurs (id_collaborateur,nom,prenom,email,date_naissance,date_embauche,type_contrat,code_service,intitule_poste,niveau_classification,salaire_brut_mensuel,taux_temps_travail,solde_cp,solde_rtt,id_manager,profil_acces,niveau_formation,competences_cles,date_fin_contrat) VALUES
(1001,'MEYER','Sophie','s.meyer@leonida.fr','1981-11-24','2022-02-01','CDI','RH','Gestionnaire paie','Employé N3',2151.01,1.0,0.3,0.7,1006,'COLLABORATEUR','Bac+3',ARRAY['Communication','SIRH','Recrutement','GPEC','Gestion admin RH']::text[],NULL),
(1002,'FRANCOIS','Adrien','a.francois@leonida.fr','1991-06-09','2011-04-01','CDI','RH','Responsable formation','TAM N3',3404.42,1.0,8.4,0.7,1094,'MANAGER','Bac+3',ARRAY['GPEC','Formation','SIRH','Communication']::text[],NULL),
(1003,'DUBOIS','Patrick','p.dubois@leonida.fr','1989-10-07','2009-01-01','CDI','RH','Assistant RH','TAM N1',1232.37,0.5,19.3,0.0,1006,'COLLABORATEUR','Bac+3',ARRAY['Droit social','Gestion admin RH','Formation']::text[],NULL),
(1004,'FONTAINE','Christophe','c.fontaine@leonida.fr','1986-12-22','2007-10-01','CDI','RH','Chargé de recrutement','TAM N1',2452.42,1.0,13.4,2.0,1002,'COLLABORATEUR','Bac+5',ARRAY['Formation','PowerPoint','Recrutement','GPEC']::text[],NULL),
(1005,'BARON','Thierry','t.baron@leonida.fr','1988-07-09','2008-04-01','CDI','RH','Gestionnaire administration du personnel','Employé N3',2284.72,1.0,14.2,5.7,1007,'COLLABORATEUR','Bac+3',ARRAY['Excel','Gestion admin RH','Communication','Droit social','Paie']::text[],NULL),
(1006,'MEYER','Camille','c.meyer@leonida.fr','1988-10-13','2024-04-01','CDD','RH','Responsable formation','Cadre',1841.27,0.5,0.3,0.0,1094,'MANAGER','Bac+3',ARRAY['Paie','Communication','Gestion admin RH']::text[],'2024-10-28'),
(1007,'ROUSSEAU','Emilie','e.rousseau@leonida.fr','1965-11-24','2023-11-01','CDD','RH','Responsable formation','Cadre confirmé',4627.78,1.0,3.5,2.7,1094,'MANAGER','Bac+5',ARRAY['Paie','Excel','SIRH','GPEC']::text[],'2025-05-28'),
(1008,'NOEL','Jean','j.noel@leonida.fr','1998-09-20','2023-03-01','CDD','RH','Chargé de recrutement','Employé N2',1932.43,1.0,3.4,6.2,1002,'COLLABORATEUR','Bac+5',ARRAY['Communication','GPEC','Excel']::text[],'2024-03-28'),
(1009,'FONTAINE','Julie','j.fontaine@leonida.fr','1985-10-03','2007-12-01','CDI','RH','Gestionnaire administration du personnel','Employé N3',2107.71,1.0,1.7,6.1,1002,'COLLABORATEUR','Bac+3',ARRAY['Excel','PowerPoint','Paie']::text[],NULL),
(1010,'ROUSSEL','Jean','j.roussel@leonida.fr','1990-11-21','2019-08-01','CDI','RH','Assistant RH','Employé N3',2279.12,1.0,6.9,2.0,1002,'COLLABORATEUR','Bac+3',ARRAY['SIRH','PowerPoint','Recrutement','Formation']::text[],NULL),
(1011,'ROBERT','Sophie','s.robert@leonida.fr','2002-02-02','2024-02-17','Stage','RH','Chargée de mission SIRH','Employé N1',745.62,1.0,5.4,0.0,1002,'COLLABORATEUR','Bac+5',ARRAY['Communication','Excel','Recrutement','Gestion admin RH','PowerPoint']::text[],'2024-06-28'),
(1012,'DURAND','Maxime','m.durand@leonida.fr','2003-07-14','2024-12-02','Stage','RH','DRH','Employé N1',793.85,1.0,0.6,0.0,NULL,'RH_ADMIN','Bac+5',ARRAY['Droit social','Recrutement','PowerPoint','Communication']::text[],'2025-06-28'),
(1013,'LECOMTE','Julien','j.lecomte@leonida.fr','1980-08-26','2022-02-01','CDI','IT','Administrateurtrice systèmes','TAM N3',2849.01,1.0,9.0,6.7,1016,'COLLABORATEUR','Bac+5',ARRAY['React','Linux','Cybersécurité']::text[],NULL),
(1014,'VINCENT','Maxime','m.vincent@leonida.fr','1965-07-09','2019-05-01','CDI','IT','DSI','Cadre dirigeant',5792.29,1.0,15.2,8.0,NULL,'RH_ADMIN','Bac+3',ARRAY['AWS','Cybersécurité','React','Node.js','PostgreSQL']::text[],NULL),
(1015,'HENRY','Claire','c.henry@leonida.fr','1966-01-19','2025-09-01','Freelance','IT','DSI','Cadre dirigeant',6364.69,1.0,0.0,0.5,NULL,'RH_ADMIN','Bac+3',ARRAY['React','Java','Agile']::text[],NULL),
(1016,'DAVID','Valerie','v.david@leonida.fr','1966-10-03','2018-11-01','CDI','IT','Responsable cybersécurité','Cadre confirmé',4483.17,1.0,8.9,7.5,1094,'MANAGER','Bac+5',ARRAY['AWS','Docker','Node.js','PostgreSQL','Linux']::text[],NULL),
(1017,'JACQUET','Valerie','v.jacquet@leonida.fr','1978-08-20','2025-02-01','CDD','IT','Data Analyst','TAM N3',3147.38,1.0,0.8,1.1,1021,'COLLABORATEUR','Bac+5',ARRAY['Node.js','Docker','PostgreSQL']::text[],'2025-08-28'),
(1018,'CLEMENT','Chloe','c.clement@leonida.fr','2001-11-04','2022-09-01','Alternance','IT','Data Analyst','Employé N1',1344.86,1.0,7.4,0.0,1024,'COLLABORATEUR','Bac+5',ARRAY['PostgreSQL','Agile','Node.js','Docker']::text[],NULL),
(1019,'GUERIN','Valerie','v.guerin@leonida.fr','1979-02-21','2024-05-01','CDD','IT','Data Analyst','TAM N3',2820.19,1.0,2.5,5.1,1021,'COLLABORATEUR','Bac+5',ARRAY['AWS','Cybersécurité','DevOps']::text[],'2024-11-28'),
(1020,'MARTIN','Patrick','p.martin@leonida.fr','1976-06-19','2022-03-01','CDI','IT','Développeuruse Full-Stack','Cadre',3625.07,1.0,0.4,2.9,1024,'COLLABORATEUR','Bac+5',ARRAY['Node.js','Scrum','Azure','Java']::text[],NULL),
(1021,'MORIN','Emmanuel','e.morin@leonida.fr','2000-03-14','2022-09-01','Alternance','IT','Responsable cybersécurité','Employé N1',1362.24,1.0,7.8,0.0,1094,'MANAGER','Bac+5',ARRAY['AWS','Node.js','PostgreSQL','React','Java']::text[],NULL),
(1022,'THOMAS','Benoit','b.thomas@leonida.fr','1989-05-27','2014-04-01','CDI','IT','Support informatique','TAM N2',2499.28,1.0,4.8,2.6,1024,'COLLABORATEUR','Bac+5',ARRAY['Docker','Scrum','DevOps','Linux']::text[],NULL),
(1023,'DUBOIS','Thomas','t.dubois@leonida.fr','1976-02-20','2018-06-01','CDI','IT','Data Analyst','Cadre',3840.39,1.0,5.7,4.8,1024,'COLLABORATEUR','Bac+3',ARRAY['Linux','Agile','Node.js']::text[],NULL),
(1024,'LACROIX','Nicolas','n.lacroix@leonida.fr','1971-06-14','2007-11-01','CDI','IT','Responsable cybersécurité','Cadre confirmé',3819.77,0.8,15.6,0.0,1094,'MANAGER','Bac+3',ARRAY['AWS','PostgreSQL','DevOps']::text[],NULL),
(1025,'MULLER','Mickael','m.muller@leonida.fr','1979-04-14','2017-11-01','CDI','IT','DevOps Engineer','Cadre',3854.51,1.0,3.4,4.6,1024,'COLLABORATEUR','Bac+5',ARRAY['Python','PostgreSQL','AWS','Node.js','Linux']::text[],NULL),
(1026,'FRANCOIS','Philippe','p.francois@leonida.fr','2004-12-06','2025-02-10','Stage','IT','Support informatique','Employé N1',785.78,1.0,0.9,0.0,1016,'COLLABORATEUR','Bac+5',ARRAY['PostgreSQL','Node.js','AWS','React','Python']::text[],'2025-08-28'),
(1027,'CHEVALIER','Camille','c.chevalier@leonida.fr','1984-12-23','2024-08-01','CDD','IT','Développeureuse Full-Stack','TAM N3',1483.74,0.5,1.8,0.0,1024,'COLLABORATEUR','Bac+5',ARRAY['Azure','Linux','Node.js']::text[],'2025-08-28'),
(1028,'GUERRERO','Helene','h.guerrero@leonida.fr','1978-08-05','2019-11-01','CDI','IT','Support informatique','Cadre',3698.11,1.0,8.2,2.5,1021,'COLLABORATEUR','Bac+5',ARRAY['AWS','DevOps','Linux','Azure','Cybersécurité']::text[],NULL),
(1029,'CHEVALIER','Marine','m.chevalier@leonida.fr','1994-08-21','2015-05-01','CDI','IT','Support informatique','TAM N2',2724.25,1.0,17.8,1.9,1016,'COLLABORATEUR','Bac+5',ARRAY['DevOps','Java','React','Scrum']::text[],NULL),
(1030,'GUERRERO','Emilie','e.guerrero@leonida.fr','1991-07-11','2025-07-01','Freelance','IT','Administrateurtrice systèmes','TAM N2',2520.14,1.0,0.3,3.1,1021,'COLLABORATEUR','Bac+3',ARRAY['Python','Agile','Linux','Cybersécurité','Azure']::text[],NULL),
(1031,'NOEL','Clement','c.noel@leonida.fr','1985-05-14','2020-01-01','CDI','COMPTA','Contrôleuruse de gestion','Employé N3',2067.45,1.0,9.5,6.4,1035,'COLLABORATEUR','Bac+5',ARRAY['Audit','Excel','Contrôle de gestion']::text[],NULL),
(1032,'VINCENT','Justine','j.vincent@leonida.fr','2002-03-28','2023-09-01','Alternance','COMPTA','Assistante comptable','Employé N1',1030.08,1.0,3.3,0.0,1039,'COLLABORATEUR','Bac+3',ARRAY['Fiscalité','Trésorerie','Excel','Comptabilité générale']::text[],NULL),
(1033,'RICHARD','Thierry','t.richard@leonida.fr','1985-11-03','2006-01-01','CDI','COMPTA','Contrôleuruse de gestion','Employé N2',1999.86,1.0,5.0,0.2,1039,'COLLABORATEUR','Bac+2',ARRAY['Excel','Audit','Fiscalité']::text[],NULL),
(1034,'LEROY','Manon','m.leroy@leonida.fr','1983-10-20','2022-03-01','Freelance','COMPTA','Contrôleureuse de gestion','TAM N1',2606.89,1.0,1.0,0.2,1035,'COLLABORATEUR','Bac+3',ARRAY['Trésorerie','IFRS','Fiscalité','SAP','Sage']::text[],NULL),
(1035,'GUERRERO','Julie','j.guerrero@leonida.fr','2001-10-26','2023-06-18','Stage','COMPTA','Responsable comptabilité','Employé N1',620.69,1.0,6.5,0.0,1094,'MANAGER','Bac+2',ARRAY['Audit','SAP','Comptabilité générale','Excel']::text[],'2023-11-28'),
(1036,'LAURENT','David','d.laurent@leonida.fr','1995-08-15','2019-12-01','CDI','COMPTA','Contrôleuruse de gestion','TAM N1',1216.25,0.5,4.6,0.0,1035,'COLLABORATEUR','Bac+2',ARRAY['Contrôle de gestion','Audit','SAP']::text[],NULL),
(1037,'MATHIEU','Laurent','l.mathieu@leonida.fr','1993-06-06','2018-04-01','CDI','COMPTA','Trésorier','TAM N1',2321.18,1.0,4.8,2.2,1039,'COLLABORATEUR','Bac+5',ARRAY['Contrôle de gestion','Sage','IFRS','SAP','Audit']::text[],NULL),
(1039,'MORIN','Fabrice','f.morin@leonida.fr','1973-05-09','2012-02-01','CDI','COMPTA','Responsable comptabilité','Cadre confirmé',4602.19,1.0,7.9,5.9,1094,'MANAGER','Bac+5',ARRAY['Comptabilité générale','IFRS','Fiscalité']::text[],NULL),
(1040,'AUBERT','Romain','r.aubert@leonida.fr','1984-05-08','2024-03-01','CDD','COMPTA','Assistant comptable','TAM N1',2161.58,1.0,2.0,2.2,1039,'COLLABORATEUR','Bac+2',ARRAY['Contrôle de gestion','Excel','Fiscalité','Comptabilité générale','Sage']::text[],'2025-03-28'),
(1041,'FOURNIER','Manon','m.fournier@leonida.fr','1983-01-09','2024-02-01','CDD','VENTES','Chargée de comptes','TAM N2',2703.08,1.0,0.3,5.0,1043,'COLLABORATEUR','Bac+2',ARRAY['Prospection','Gestion de comptes','CRM']::text[],'2024-08-28'),
(1042,'MORIN','Julie','j.morin@leonida.fr','1990-08-15','2017-10-01','CDI','VENTES','Ingénieure commerciale','Employé N3',1853.27,0.8,6.0,0.0,1046,'COLLABORATEUR','Bac+5',ARRAY['Négociation','Salesforce','Excel']::text[],NULL),
(1043,'GARCIA','Alice','a.garcia@leonida.fr','1970-09-03','2010-01-01','CDI','VENTES','Directeurtrice commerciale','Cadre dirigeant',5775.58,1.0,17.2,3.8,1094,'MANAGER','Bac+2',ARRAY['Gestion de comptes','Management','Excel']::text[],NULL),
(1044,'BLANC','Pierre','p.blanc@leonida.fr','1971-07-04','2022-04-01','CDI','VENTES','Responsable commercial','Cadre confirmé',2269.25,0.5,7.8,0.0,1094,'MANAGER','Bac+2',ARRAY['CRM','Prospection','PowerPoint']::text[],NULL),
(1045,'MEYER','Olivier','o.meyer@leonida.fr','1999-08-23','2023-09-01','Alternance','VENTES','Ingénieur commercial','Employé N2',1371.34,1.0,5.0,0.0,1046,'COLLABORATEUR','Bac+3',ARRAY['Négociation','CRM','Salesforce','Excel']::text[],NULL),
(1046,'BERTRAND','Olivier','o.bertrand@leonida.fr','1965-11-27','2013-10-01','CDI','VENTES','Directeurtrice commercial','Cadre dirigeant',5350.89,1.0,18.9,3.8,1094,'MANAGER','Bac+5',ARRAY['Gestion de comptes','Prospection','Management','Salesforce']::text[],NULL),
(1047,'CHEVALIER','Pierre','p.chevalier@leonida.fr','1981-03-11','2018-12-01','CDI','VENTES','Commercial terrain','TAM N1',2387.06,1.0,11.2,3.2,1046,'COLLABORATEUR','Bac+5',ARRAY['Anglais','Négociation','Prospection']::text[],NULL),
(1048,'DUBOIS','Sebastien','s.dubois@leonida.fr','1992-07-02','2013-09-01','CDI','VENTES','Ingénieur commercial','Employé N2',1430.42,0.8,18.9,0.0,1043,'COLLABORATEUR','Bac+5',ARRAY['CRM','Salesforce','Prospection','Gestion de comptes']::text[],NULL),
(1049,'FOURNIER','Justine','j.fournier@leonida.fr','1978-11-20','2023-12-01','Freelance','VENTES','Chargée de comptes','TAM N2',2572.09,1.0,2.4,4.4,1044,'COLLABORATEUR','Bac+2',ARRAY['Négociation','Anglais','CRM']::text[],NULL),
(1050,'LACROIX','Mathilde','m.lacroix@leonida.fr','1993-08-08','2024-09-01','CDD','VENTES','Commerciale terrain','TAM N1',2334.65,1.0,2.3,4.1,1044,'COLLABORATEUR','Bac+2',ARRAY['Gestion de comptes','PowerPoint','Prospection']::text[],'2025-03-28'),
(1051,'MARTIN','Thierry','t.martin@leonida.fr','1996-11-16','2023-08-01','Freelance','VENTES','Commercial terrain','TAM N1',2407.26,1.0,1.8,4.4,1044,'COLLABORATEUR','Bac+5',ARRAY['Anglais','Excel','PowerPoint','Négociation']::text[],NULL),
(1052,'ROUSSEAU','Manon','m.rousseau@leonida.fr','1993-12-26','2017-07-01','CDI','VENTES','Responsable commerciale','TAM N3',3423.53,1.0,16.2,5.2,1043,'COLLABORATEUR','Bac+2',ARRAY['CRM','Prospection','Gestion de comptes','PowerPoint']::text[],NULL),
(1053,'DURAND','Benoit','b.durand@leonida.fr','1992-01-24','2023-07-01','CDD','VENTES','Ingénieur commercial','Employé N2',1347.7,0.8,4.2,0.0,1044,'COLLABORATEUR','Bac+3',ARRAY['PowerPoint','Négociation','Management','Prospection']::text[],'2024-01-28'),
(1054,'GUERIN','Sebastien','s.guerin@leonida.fr','1967-04-21','2025-05-01','CDD','VENTES','Responsable grands comptes','Cadre confirmé',4624.23,1.0,0.3,0.8,1046,'COLLABORATEUR','Bac+5',ARRAY['Négociation','Anglais','Management','Excel','Prospection']::text[],'2025-11-28'),
(1055,'BONNET','Claire','c.bonnet@leonida.fr','1989-07-05','2014-09-01','CDI','VENTES','Ingénieure commerciale','TAM N1',2347.99,1.0,17.0,1.4,1043,'COLLABORATEUR','Bac+2',ARRAY['PowerPoint','Salesforce','Anglais']::text[],NULL),
(1056,'GARNIER','Camille','c.garnier@leonida.fr','1975-08-10','2022-03-01','CDI','VENTES','Responsable grands comptes','Cadre',3368.55,1.0,8.3,7.9,1044,'COLLABORATEUR','Bac+3',ARRAY['PowerPoint','Gestion de comptes','Salesforce','Prospection','Négociation']::text[],NULL),
(1057,'CHEVALIER','Benoit','b.chevalier@leonida.fr','1976-10-10','2014-01-01','CDI','VENTES','Directeurtrice commercial','Cadre dirigeant',6432.22,1.0,16.5,2.2,1043,'COLLABORATEUR','Bac+5',ARRAY['CRM','Anglais','PowerPoint','Prospection','Négociation']::text[],NULL),
(1058,'GUERIN','Adrien','a.guerin@leonida.fr','1999-11-21','2022-09-01','Alternance','VENTES','Responsable commercial','Employé N2',1120.41,1.0,5.8,0.0,1044,'COLLABORATEUR','Bac+5',ARRAY['Négociation','Gestion de comptes','Prospection']::text[],NULL),
(1059,'LEFEVRE','Alexandre','a.lefevre@leonida.fr','1983-03-09','2024-05-01','CDD','VENTES','Responsable commercial','Cadre',3115.95,0.8,1.5,0.0,1046,'COLLABORATEUR','Bac+2',ARRAY['Salesforce','PowerPoint','Anglais']::text[],'2025-05-28'),
(1060,'VINCENT','Pierre','p.vincent@leonida.fr','1968-08-12','2013-10-01','CDI','VENTES','Directeurtrice commercial','Cadre dirigeant',4595.1,0.8,16.0,0.0,1043,'COLLABORATEUR','Bac+3',ARRAY['Salesforce','Anglais','CRM']::text[],NULL),
(1061,'MATHIEU','Florian','f.mathieu@leonida.fr','2004-12-10','2025-07-04','Stage','LOG','Cheffe d''entrepôt','Employé N1',611.16,1.0,10.0,0.0,1094,'MANAGER','CAP/BEP',ARRAY['Logistique','Gestion des stocks','Transport']::text[],'2025-11-28'),
(1062,'GARCIA','Francois','f.garcia@leonida.fr','1982-07-21','2022-08-01','Freelance','LOG','Agent logistique','TAM N2',2819.27,1.0,7.2,2.2,1064,'COLLABORATEUR','Bac+3',ARRAY['Logistique','SST','Transport','ERP']::text[],NULL),
(1063,'BLANC','Antoine','a.blanc@leonida.fr','1990-05-07','2023-08-01','CDD','LOG','Préparateurtrice de commandes','TAM N1',2465.44,1.0,3.3,4.8,1065,'COLLABORATEUR','CAP/BEP',ARRAY['Excel','Logistique','ERP']::text[],'2024-02-28'),
(1064,'NOEL','Marie','m.noel@leonida.fr','1972-06-25','2009-10-01','CDI','LOG','Coordinateurtrice transport','Cadre confirmé',3980.83,1.0,21.5,1.2,1094,'MANAGER','CAP/BEP',ARRAY['Supply Chain','Gestion des stocks','WMS','Excel','CACES']::text[],NULL),
(1065,'LAMBERT','Sophie','s.lambert@leonida.fr','2000-05-02','2022-09-01','Alternance','LOG','Cheffe d''entrepôt','Employé N2',1163.04,1.0,7.5,0.0,1094,'MANAGER','Bac+2',ARRAY['Excel','ERP','Logistique','Supply Chain']::text[],NULL),
(1066,'THOMAS','Sarah','s.thomas@leonida.fr','2003-08-21','2023-01-16','Stage','LOG','Agent logistique','Employé N1',632.39,1.0,7.1,0.0,1061,'COLLABORATEUR','Bac+2',ARRAY['ERP','Excel','Supply Chain']::text[],'2023-06-28'),
(1067,'MOREAU','Marie','m.moreau@leonida.fr','2003-09-10','2023-09-01','Alternance','LOG','Préparateurtrice de commandes','Employé N2',1115.1,1.0,7.9,0.0,1065,'COLLABORATEUR','CAP/BEP',ARRAY['Transport','Logistique','SST','CACES','ERP']::text[],NULL),
(1068,'GARNIER','Sebastien','s.garnier@leonida.fr','1991-06-22','2013-06-01','CDI','LOG','Gestionnaire stocks','Employé N2',2001.29,1.0,17.2,3.8,1064,'COLLABORATEUR','CAP/BEP',ARRAY['ERP','CACES','WMS']::text[],NULL),
(1069,'MOREAU','Stephane','s.moreau@leonida.fr','1975-11-04','2018-06-01','CDI','LOG','Coordinateurtrice transport','Cadre confirmé',3787.14,0.8,17.0,0.0,1061,'COLLABORATEUR','Bac+2',ARRAY['WMS','Supply Chain','SST','Gestion des stocks','Excel']::text[],NULL),
(1070,'PERRIN','Manon','m.perrin@leonida.fr','1972-02-12','2022-06-01','CDI','LOG','Cheffe d''entrepôt','Cadre confirmé',4077.73,1.0,2.3,1.8,1064,'COLLABORATEUR','Bac+2',ARRAY['Transport','WMS','Supply Chain','Excel','Gestion des stocks']::text[],NULL),
(1071,'MOREL','Emma','e.morel@leonida.fr','1978-03-28','2009-10-01','CDI','LOG','Agent logistique','TAM N1',2462.9,1.0,1.7,5.9,1061,'COLLABORATEUR','CAP/BEP',ARRAY['Transport','Logistique','SST']::text[],NULL),
(1072,'DUPONT','Philippe','p.dupont@leonida.fr','1977-01-05','2010-10-01','CDI','LOG','Cheffe d''entrepôt','Cadre',3351.18,1.0,2.0,3.5,1061,'COLLABORATEUR','Bac+2',ARRAY['SST','CACES','Gestion des stocks','ERP']::text[],NULL),
(1073,'LECOMTE','Aurelie','a.lecomte@leonida.fr','1980-09-22','2014-01-01','CDI','LOG','Responsable logistique','Cadre confirmé',2084.55,0.5,24.6,0.0,1065,'COLLABORATEUR','CAP/BEP',ARRAY['Logistique','Supply Chain','ERP']::text[],NULL),
(1074,'BERTRAND','Stephanie','s.bertrand@leonida.fr','1993-12-14','2013-03-01','CDI','LOG','Préparateurtrice de commandes','Employé N2',1794.67,1.0,17.6,4.0,1061,'COLLABORATEUR','Bac+3',ARRAY['ERP','CACES','SST','Excel']::text[],NULL),
(1075,'BERNARD','Lea','l.bernard@leonida.fr','1991-10-13','2020-11-01','CDI','LOG','Gestionnaire stocks','TAM N1',1175.31,0.5,1.4,0.0,1065,'COLLABORATEUR','CAP/BEP',ARRAY['Gestion des stocks','SST','CACES','Excel']::text[],NULL),
(1076,'LECOMTE','Pierre','p.lecomte@leonida.fr','1977-09-03','2017-05-01','CDI','MKT','Directeurtrice marketing','Cadre dirigeant',6164.53,1.0,4.6,6.2,1094,'MANAGER','Bac+3',ARRAY['Google Ads','Canva','CRM','Adobe Suite','Inbound Marketing']::text[],NULL),
(1077,'DURAND','Camille','c.durand@leonida.fr','1997-03-25','2016-03-01','CDI','MKT','Cheffe de produit','TAM N3',3400.79,1.0,14.9,3.7,1094,'MANAGER','Bac+5',ARRAY['Analyse de données','Inbound Marketing','CRM','Anglais','Adobe Suite']::text[],NULL),
(1078,'ROBERT','Chloe','c.robert@leonida.fr','1973-10-02','2024-09-01','CDD','MKT','Community Manager','Cadre confirmé',4246.83,1.0,1.1,0.5,1077,'COLLABORATEUR','Bac+5',ARRAY['Google Ads','CRM','Canva']::text[],'2025-03-28'),
(1079,'NICOLAS','Chloe','c.nicolas@leonida.fr','1990-09-05','2009-08-01','CDI','MKT','Responsable digital','Cadre',1694.95,0.5,22.5,0.0,1076,'COLLABORATEUR','Bac+5',ARRAY['Google Ads','Adobe Suite','SEO','Anglais','Canva']::text[],NULL),
(1080,'ROBIN','Jean','j.robin@leonida.fr','1987-07-14','2015-11-01','CDI','MKT','Graphiste','TAM N3',3184.29,1.0,19.4,5.2,1076,'COLLABORATEUR','Bac+3',ARRAY['Google Ads','CRM','Adobe Suite','Analyse de données']::text[],NULL),
(1081,'RICHARD','Nathalie','n.richard@leonida.fr','2003-05-21','2025-11-13','Stage','MKT','Graphiste','Employé N1',881.4,1.0,3.1,0.0,1076,'COLLABORATEUR','Bac+5',ARRAY['Inbound Marketing','Adobe Suite','Anglais','CRM','Réseaux sociaux']::text[],'2026-03-28'),
(1082,'GARCIA','Elise','e.garcia@leonida.fr','1986-05-06','2023-06-01','CDD','MKT','Community Manager','Cadre',3453.69,1.0,5.6,1.2,1076,'COLLABORATEUR','Bac+5',ARRAY['Anglais','SEO','Inbound Marketing']::text[],'2024-06-28'),
(1083,'BARON','Yannick','y.baron@leonida.fr','1979-03-06','2010-12-01','CDI','MKT','Graphiste','Cadre',3630.75,1.0,10.3,5.4,1076,'COLLABORATEUR','Bac+3',ARRAY['Réseaux sociaux','Analyse de données','Google Ads','Anglais']::text[],NULL),
(1084,'CHEVALIER','Isabelle','i.chevalier@leonida.fr','1979-08-25','2014-07-01','CDI','MKT','Cheffe de produit','Cadre confirmé',2206.66,0.5,10.5,0.0,1076,'COLLABORATEUR','Bac+3',ARRAY['Adobe Suite','Réseaux sociaux','SEO']::text[],NULL),
(1085,'FONTAINE','Benoit','b.fontaine@leonida.fr','1978-05-03','2010-05-01','CDI','MKT','Graphiste','Cadre',2911.32,0.8,12.8,0.0,1077,'COLLABORATEUR','Bac+5',ARRAY['Canva','Analyse de données','Adobe Suite']::text[],NULL),
(1086,'PETIT','Lea','l.petit@leonida.fr','1990-02-12','2023-01-01','CDD','JUR','Paralégale','TAM N3',3388.25,1.0,5.6,5.2,1089,'COLLABORATEUR','Bac+5',ARRAY['Droit des contrats','Droit des affaires','RGPD']::text[],'2024-01-28'),
(1087,'LACROIX','Stephanie','s.lacroix@leonida.fr','1977-01-09','2023-03-01','CDD','JUR','Paralégale','Cadre',3992.95,1.0,3.8,3.4,1089,'COLLABORATEUR','Bac+5',ARRAY['Droit des affaires','Droit des contrats','Rédaction juridique']::text[],'2024-09-28'),
(1088,'GUERIN','Lea','l.guerin@leonida.fr','1997-09-01','2023-10-01','CDI','JUR','Paralégale','TAM N2',2617.26,1.0,0.7,3.4,1089,'COLLABORATEUR','Bac+5',ARRAY['Rédaction juridique','RGPD','Droit social']::text[],NULL),
(1089,'FONTAINE','Pauline','p.fontaine@leonida.fr','1965-07-28','2024-01-01','CDD','JUR','Directeurtrice juridique','Cadre dirigeant',5148.63,0.8,1.1,0.0,1094,'MANAGER','Bac+5',ARRAY['Droit des contrats','Droit des affaires','Droit social','Rédaction juridique']::text[],'2025-01-28'),
(1090,'HENRY','Stephanie','s.henry@leonida.fr','1995-06-27','2023-03-01','CDI','JUR','Juriste contrats','TAM N2',2935.34,1.0,4.3,7.8,1089,'COLLABORATEUR','Bac+5',ARRAY['Droit social','Anglais juridique','Droit des contrats','Droit des affaires','Rédaction juridique']::text[],NULL),
(1091,'LEFEVRE','Isabelle','i.lefevre@leonida.fr','1975-05-17','2017-09-01','CDI','DIR','PDG','Cadre dirigeant',5850.4,1.0,0.7,5.2,NULL,'RH_ADMIN','Bac+5',ARRAY['Gestion de projet','Management','Excel','Anglais']::text[],NULL),
(1092,'FONTAINE','Helene','h.fontaine@leonida.fr','1988-03-16','2021-06-01','CDI','DIR','Assistante de direction','TAM N2',2986.11,1.0,5.5,6.4,1094,'COLLABORATEUR','Bac+3',ARRAY['Management','PowerPoint','Anglais','Stratégie']::text[],NULL),
(1093,'DURAND','Sebastien','s.durand@leonida.fr','1974-08-20','2018-03-01','CDI','DIR','PDG','Cadre dirigeant',6099.9,1.0,6.6,0.3,NULL,'RH_ADMIN','Bac+5',ARRAY['PowerPoint','Excel','Management','Anglais','Communication']::text[],NULL),
(1094,'PERRIN','Francois','f.perrin@leonida.fr','1979-01-05','2007-04-01','CDI','DIR','Directeurtrice général','Cadre dirigeant',6202.25,1.0,9.2,3.1,NULL,'MANAGER','Bac+3',ARRAY['Anglais','Stratégie','PowerPoint']::text[],NULL),
(1095,'FRANCOIS','Francois','f.francois@leonida.fr','1976-07-11','2013-04-01','CDI','DIR','PDG','Cadre dirigeant',6412.12,1.0,0.6,1.5,NULL,'RH_ADMIN','Bac+3',ARRAY['Anglais','Management','Excel','Gestion de projet']::text[],NULL),
(1096,'MATHIEU','Maxime','m.mathieu@leonida.fr','1978-03-28','2022-08-01','Freelance','ACHAT','Responsable sourcing','Cadre',3439.75,1.0,5.5,8.0,1094,'MANAGER','Bac+5',ARRAY['Excel','Analyse des coûts','Négociation','Gestion fournisseurs','SAP']::text[],NULL),
(1097,'SIMON','Benoit','b.simon@leonida.fr','1984-03-08','2020-01-01','CDI','ACHAT','Acheteuruse','Employé N3',2055.86,1.0,8.1,3.7,1098,'COLLABORATEUR','Bac+3',ARRAY['ERP','Négociation','SAP','Sourcing','Gestion fournisseurs']::text[],NULL),
(1098,'MULLER','Emmanuel','e.muller@leonida.fr','1967-08-15','2021-06-01','CDI','ACHAT','Directeurtrice achats','Cadre dirigeant',5452.49,1.0,8.8,4.4,1094,'MANAGER','Bac+3',ARRAY['Anglais','Gestion fournisseurs','Négociation']::text[],NULL),
(1099,'LAURENT','Pauline','p.laurent@leonida.fr','1985-06-17','2014-02-01','CDI','ACHAT','Responsable sourcing','TAM N3',2971.54,1.0,15.9,4.4,1096,'COLLABORATEUR','Bac+3',ARRAY['Gestion fournisseurs','Analyse des coûts','Anglais','Négociation','ERP']::text[],NULL);

===== FICHIER : leonida-hr/drizzle/migrations/0002_allow_upsert_key_column.sql =====
GRANT UPDATE (id_collaborateur) ON public.collaborateurs TO authenticated;

===== FICHIER : leonida-hr/drizzle/migrations/meta/0000_snapshot.json =====
{
  "id": "64b93a4a-afe2-4d39-b436-40b2e308330b",
  "prevId": "00000000-0000-0000-0000-000000000000",
  "version": "7",
  "dialect": "postgresql",
  "tables": {},
  "enums": {},
  "schemas": {},
  "views": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}


===== FICHIER : leonida-hr/drizzle/migrations/meta/0001_snapshot.json =====
{
  "id": "f8052543-8dbe-4127-8ad9-bdbd0cc7abbf",
  "prevId": "64b93a4a-afe2-4d39-b436-40b2e308330b",
  "version": "7",
  "dialect": "postgresql",
  "tables": {},
  "enums": {},
  "schemas": {},
  "views": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}


===== FICHIER : leonida-hr/drizzle/migrations/meta/0002_snapshot.json =====
{
  "id": "25978a91-da12-44d2-8bea-72659994b871",
  "prevId": "f8052543-8dbe-4127-8ad9-bdbd0cc7abbf",
  "version": "7",
  "dialect": "postgresql",
  "tables": {},
  "enums": {},
  "schemas": {},
  "views": {},
  "sequences": {},
  "roles": {},
  "policies": {},
  "_meta": {
    "columns": {},
    "schemas": {},
    "tables": {}
  }
}


===== FICHIER : leonida-hr/drizzle/migrations/meta/_journal.json =====
{
  "version": "7",
  "dialect": "postgresql",
  "entries": [
    {
      "idx": 0,
      "version": "7",
      "when": 1794924568514,
      "tag": "0000_sirh_core_schema",
      "breakpoints": true
    },
    {
      "idx": 1,
      "version": "7",
      "when": 1794924673516,
      "tag": "0001_seed_collaborateurs_leonida",
      "breakpoints": true
    },
    {
      "idx": 2,
      "version": "7",
      "when": 1794924843443,
      "tag": "0002_allow_upsert_key_column",
      "breakpoints": true
    }
  ]
}


===== FICHIER : leonida-hr/public/robots.txt =====
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /


===== FICHIER : leonida-hr/src/routeTree.gen.ts =====
/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthenticatedRouteRouteImport } from './routes/_authenticated/route'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as AuthenticatedAbsencesRouteImport } from './routes/_authenticated/absences'
import { Route as AuthenticatedImportRouteImport } from './routes/_authenticated/import'
import { Route as AuthenticatedRecrutementRouteImport } from './routes/_authenticated/recrutement'
import { Route as AuthenticatedTableauDeBordRouteImport } from './routes/_authenticated/tableau-de-bord'
import { Route as AuthenticatedCollaborateursIndexRouteImport } from './routes/_authenticated/collaborateurs.index'
import { Route as AuthenticatedCollaborateursIdRouteImport } from './routes/_authenticated/collaborateurs.$id'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedRouteRoute = AuthenticatedRouteRouteImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthRoute = AuthRouteImport.update({
  id: '/auth',
  path: '/auth',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedAbsencesRoute = AuthenticatedAbsencesRouteImport.update({
  id: '/absences',
  path: '/absences',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedImportRoute = AuthenticatedImportRouteImport.update({
  id: '/import',
  path: '/import',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedRecrutementRoute =
  AuthenticatedRecrutementRouteImport.update({
    id: '/recrutement',
    path: '/recrutement',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedTableauDeBordRoute =
  AuthenticatedTableauDeBordRouteImport.update({
    id: '/tableau-de-bord',
    path: '/tableau-de-bord',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedCollaborateursIndexRoute =
  AuthenticatedCollaborateursIndexRouteImport.update({
    id: '/collaborateurs/',
    path: '/collaborateurs/',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedCollaborateursIdRoute =
  AuthenticatedCollaborateursIdRouteImport.update({
    id: '/collaborateurs/$id',
    path: '/collaborateurs/$id',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/absences': typeof AuthenticatedAbsencesRoute
  '/import': typeof AuthenticatedImportRoute
  '/recrutement': typeof AuthenticatedRecrutementRoute
  '/tableau-de-bord': typeof AuthenticatedTableauDeBordRoute
  '/collaborateurs/$id': typeof AuthenticatedCollaborateursIdRoute
  '/collaborateurs/': typeof AuthenticatedCollaborateursIndexRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/auth': typeof AuthRoute
  '/absences': typeof AuthenticatedAbsencesRoute
  '/import': typeof AuthenticatedImportRoute
  '/recrutement': typeof AuthenticatedRecrutementRoute
  '/tableau-de-bord': typeof AuthenticatedTableauDeBordRoute
  '/collaborateurs/$id': typeof AuthenticatedCollaborateursIdRoute
  '/collaborateurs': typeof AuthenticatedCollaborateursIndexRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteRouteWithChildren
  '/auth': typeof AuthRoute
  '/_authenticated/absences': typeof AuthenticatedAbsencesRoute
  '/_authenticated/import': typeof AuthenticatedImportRoute
  '/_authenticated/recrutement': typeof AuthenticatedRecrutementRoute
  '/_authenticated/tableau-de-bord': typeof AuthenticatedTableauDeBordRoute
  '/_authenticated/collaborateurs/$id': typeof AuthenticatedCollaborateursIdRoute
  '/_authenticated/collaborateurs/': typeof AuthenticatedCollaborateursIndexRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/auth'
    | '/absences'
    | '/import'
    | '/recrutement'
    | '/tableau-de-bord'
    | '/collaborateurs/$id'
    | '/collaborateurs/'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/auth'
    | '/absences'
    | '/import'
    | '/recrutement'
    | '/tableau-de-bord'
    | '/collaborateurs/$id'
    | '/collaborateurs'
  id:
    | '__root__'
    | '/'
    | '/_authenticated'
    | '/auth'
    | '/_authenticated/absences'
    | '/_authenticated/import'
    | '/_authenticated/recrutement'
    | '/_authenticated/tableau-de-bord'
    | '/_authenticated/collaborateurs/$id'
    | '/_authenticated/collaborateurs/'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthenticatedRouteRoute: typeof AuthenticatedRouteRouteWithChildren
  AuthRoute: typeof AuthRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: '/'
      preLoaderRoute: typeof AuthenticatedRouteRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/auth': {
      id: '/auth'
      path: '/auth'
      fullPath: '/auth'
      preLoaderRoute: typeof AuthRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated/absences': {
      id: '/_authenticated/absences'
      path: '/absences'
      fullPath: '/absences'
      preLoaderRoute: typeof AuthenticatedAbsencesRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/import': {
      id: '/_authenticated/import'
      path: '/import'
      fullPath: '/import'
      preLoaderRoute: typeof AuthenticatedImportRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/recrutement': {
      id: '/_authenticated/recrutement'
      path: '/recrutement'
      fullPath: '/recrutement'
      preLoaderRoute: typeof AuthenticatedRecrutementRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/tableau-de-bord': {
      id: '/_authenticated/tableau-de-bord'
      path: '/tableau-de-bord'
      fullPath: '/tableau-de-bord'
      preLoaderRoute: typeof AuthenticatedTableauDeBordRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/collaborateurs/': {
      id: '/_authenticated/collaborateurs/'
      path: '/collaborateurs'
      fullPath: '/collaborateurs/'
      preLoaderRoute: typeof AuthenticatedCollaborateursIndexRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/collaborateurs/$id': {
      id: '/_authenticated/collaborateurs/$id'
      path: '/collaborateurs/$id'
      fullPath: '/collaborateurs/$id'
      preLoaderRoute: typeof AuthenticatedCollaborateursIdRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
  }
}

interface AuthenticatedRouteRouteChildren {
  AuthenticatedAbsencesRoute: typeof AuthenticatedAbsencesRoute
  AuthenticatedImportRoute: typeof AuthenticatedImportRoute
  AuthenticatedRecrutementRoute: typeof AuthenticatedRecrutementRoute
  AuthenticatedTableauDeBordRoute: typeof AuthenticatedTableauDeBordRoute
  AuthenticatedCollaborateursIdRoute: typeof AuthenticatedCollaborateursIdRoute
  AuthenticatedCollaborateursIndexRoute: typeof AuthenticatedCollaborateursIndexRoute
}

const AuthenticatedRouteRouteChildren: AuthenticatedRouteRouteChildren = {
  AuthenticatedAbsencesRoute: AuthenticatedAbsencesRoute,
  AuthenticatedImportRoute: AuthenticatedImportRoute,
  AuthenticatedRecrutementRoute: AuthenticatedRecrutementRoute,
  AuthenticatedTableauDeBordRoute: AuthenticatedTableauDeBordRoute,
  AuthenticatedCollaborateursIdRoute: AuthenticatedCollaborateursIdRoute,
  AuthenticatedCollaborateursIndexRoute: AuthenticatedCollaborateursIndexRoute,
}

const AuthenticatedRouteRouteWithChildren =
  AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute: AuthRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}


===== FICHIER : leonida-hr/src/router.tsx =====
import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // One client per request: a module-level QueryClient leaks cached data between SSR requests.
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Lets Query own freshness; set caching defaults on the QueryClient, not the router.
    defaultPreloadStaleTime: 0,
  });

  return router;
};


===== FICHIER : leonida-hr/src/server.ts =====
import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};


===== FICHIER : leonida-hr/src/start.ts =====
import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

// requestMiddleware runs on every request; functionMiddleware only on server functions, where
// client sendContext is unvalidated input. Append to these arrays, never replace them.
// Enabling Lovable Cloud adds functionMiddleware: [attachSupabaseAuth], the bearer token that
// requireSupabaseAuth server functions need. Add it by hand only if Lovable Cloud or a
// user-managed Supabase project is connected, no middleware here sets Authorization, and the
// project did not intentionally replace it.
export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));


===== FICHIER : leonida-hr/src/styles.css =====
/*
 * Tailwind v4 entry: config lives here, with no tailwind.config.js or PostCSS plugin.
 * Keep every @import in this top block. Web fonts are loaded with <link> in src/routes/__root.tsx.
 */
@import "tailwindcss" source(none);
@source "../src";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

/*
 * Leonida HR design system — "Signal" (telecom / réseau).
 * Navy #0F172A · Electric blue #2563EB · Cyan #06B6D4 · Canvas #F8FAFC.
 */

@theme inline {
  --font-sans: "Manrope", ui-sans-serif, system-ui, sans-serif;
  --font-display: "Sora", "Manrope", ui-sans-serif, sans-serif;

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary-glow: var(--primary-glow);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-ring-offset-background: var(--background);

  --color-navy: var(--navy);
  --color-navy-foreground: var(--navy-foreground);
  --color-navy-muted: var(--navy-muted);
  --color-signal: var(--signal);
  --color-signal-foreground: var(--signal-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);

  --color-contract-cdi: var(--contract-cdi);
  --color-contract-cdi-foreground: var(--contract-cdi-foreground);
  --color-contract-cdd: var(--contract-cdd);
  --color-contract-cdd-foreground: var(--contract-cdd-foreground);
  --color-contract-alternance: var(--contract-alternance);
  --color-contract-alternance-foreground: var(--contract-alternance-foreground);
  --color-contract-stage: var(--contract-stage);
  --color-contract-stage-foreground: var(--contract-stage-foreground);
  --color-contract-freelance: var(--contract-freelance);
  --color-contract-freelance-foreground: var(--contract-freelance-foreground);

  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --shadow-card: var(--elev-card);
  --shadow-lift: var(--elev-lift);
  --shadow-glow: var(--elev-glow);
}

:root {
  --radius: 0.75rem;

  /* Brand */
  --navy: oklch(0.208 0.042 265.755); /* #0F172A */
  --navy-foreground: oklch(0.984 0.003 247.858);
  --navy-muted: oklch(0.704 0.04 256.788);
  --signal: oklch(0.715 0.143 215.221); /* #06B6D4 */
  --signal-foreground: oklch(0.208 0.042 265.755);

  --background: oklch(0.984 0.003 247.858); /* #F8FAFC */
  --foreground: oklch(0.208 0.042 265.755);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.208 0.042 265.755);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.208 0.042 265.755);
  --primary: oklch(0.546 0.245 262.881); /* #2563EB */
  --primary-foreground: oklch(0.99 0.005 250);
  --primary-glow: oklch(0.623 0.214 259.815);
  --secondary: oklch(0.955 0.012 255);
  --secondary-foreground: oklch(0.279 0.041 260.031);
  --muted: oklch(0.962 0.008 250);
  --muted-foreground: oklch(0.52 0.04 257);
  --accent: oklch(0.95 0.035 255);
  --accent-foreground: oklch(0.42 0.2 263);
  --destructive: oklch(0.577 0.215 27.325);
  --destructive-foreground: oklch(0.99 0.005 25);
  --success: oklch(0.6 0.15 155);
  --success-foreground: oklch(0.99 0.01 155);
  --warning: oklch(0.75 0.16 70);
  --warning-foreground: oklch(0.38 0.09 55);
  --border: oklch(0.925 0.013 255.5);
  --input: oklch(0.905 0.016 255.5);
  --ring: oklch(0.546 0.245 262.881);

  /* Contract badges: base colour + readable text colour */
  --contract-cdi: oklch(0.546 0.245 262.881);
  --contract-cdi-foreground: oklch(0.42 0.2 263);
  --contract-cdd: oklch(0.769 0.165 70.08);
  --contract-cdd-foreground: oklch(0.47 0.12 55);
  --contract-alternance: oklch(0.696 0.15 162.48);
  --contract-alternance-foreground: oklch(0.43 0.1 163);
  --contract-stage: oklch(0.715 0.143 215.221);
  --contract-stage-foreground: oklch(0.45 0.09 220);
  --contract-freelance: oklch(0.645 0.2 16.439);
  --contract-freelance-foreground: oklch(0.48 0.16 18);

  --chart-1: oklch(0.546 0.245 262.881);
  --chart-2: oklch(0.715 0.143 215.221);
  --chart-3: oklch(0.38 0.12 264);
  --chart-4: oklch(0.769 0.165 70.08);
  --chart-5: oklch(0.696 0.15 162.48);

  --sidebar: oklch(0.208 0.042 265.755);
  --sidebar-foreground: oklch(0.82 0.025 254);
  --sidebar-primary: oklch(0.715 0.143 215.221);
  --sidebar-primary-foreground: oklch(0.208 0.042 265.755);
  --sidebar-accent: oklch(0.27 0.045 263);
  --sidebar-accent-foreground: oklch(0.984 0.003 247.858);
  --sidebar-border: oklch(1 0 0 / 8%);
  --sidebar-ring: oklch(0.715 0.143 215.221);

  /* Gradients & elevation */
  --gradient-signal: linear-gradient(135deg, var(--primary) 0%, var(--signal) 100%);
  --gradient-navy: radial-gradient(120% 120% at 100% 0%, oklch(0.32 0.11 262) 0%, var(--navy) 55%);
  --elev-card: 0 1px 2px oklch(0.208 0.042 265.755 / 0.04), 0 12px 32px -18px oklch(0.208 0.042 265.755 / 0.18);
  --elev-lift: 0 2px 4px oklch(0.208 0.042 265.755 / 0.05), 0 24px 48px -24px oklch(0.208 0.042 265.755 / 0.28);
  --elev-glow: 0 10px 30px -10px color-mix(in oklab, var(--primary) 55%, transparent);
}

@utility bg-gradient-signal {
  background-image: var(--gradient-signal);
}

@utility bg-gradient-navy {
  background-image: var(--gradient-navy);
}

@utility text-gradient-signal {
  background-image: var(--gradient-signal);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
}

/* Fine network grid used on dark surfaces */
@utility bg-grid-signal {
  background-image:
    linear-gradient(color-mix(in oklab, var(--signal) 14%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in oklab, var(--signal) 14%, transparent) 1px, transparent 1px);
  background-size: 28px 28px;
}

@utility font-display {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

@keyframes signal-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

@utility animate-signal {
  animation: signal-pulse 2.4s ease-in-out infinite;
}

@layer base {
  * {
    border-color: var(--color-border);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    font-feature-settings: "cv11", "ss01";
    -webkit-font-smoothing: antialiased;
  }

  h1,
  h2,
  h3 {
    font-family: var(--font-display);
    letter-spacing: -0.02em;
  }
}


===== FICHIER : leonida-hr/src/components/hr/app-shell.tsx =====
import type { ReactNode } from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/hr/app-sidebar";
import { RoleBadge } from "@/components/hr/badges";
import { useMe } from "@/hooks/use-me";
import { formatLongDateFr } from "@/lib/hr";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-5" />
            <p className="hidden text-sm capitalize text-muted-foreground sm:block">{formatLongDateFr(new Date())}</p>
            <div className="ml-auto flex items-center gap-3">
              <span className="relative hidden items-center gap-2 text-xs font-medium text-muted-foreground md:flex">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-signal rounded-full bg-signal" />
                  <span className="relative inline-flex size-2 rounded-full bg-signal" />
                </span>
                Données synchronisées
              </span>
              {me?.role && <RoleBadge role={me.role} />}
            </div>
          </header>
          <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-8">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}


===== FICHIER : leonida-hr/src/components/hr/app-sidebar.tsx =====
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CalendarClock,
  FileUp,
  LayoutDashboard,
  LogOut,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LeonidaLogo } from "@/components/hr/leonida-logo";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/use-me";
import { ROLE_LABELS, fullName, initials } from "@/lib/hr";

interface NavItem {
  title: string;
  icon: LucideIcon;
  to: "/tableau-de-bord" | "/collaborateurs" | "/absences" | "/recrutement" | "/import";
  params?: undefined;
  match: string;
  badge?: string;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: me } = useMe();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const role = me?.role;
  const myId = me?.collaborateur?.id_collaborateur;

  const isActive = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  const pilotage: NavItem[] = [
    { title: "Tableau de bord", icon: LayoutDashboard, to: "/tableau-de-bord", match: "/tableau-de-bord" },
  ];
  const modules: NavItem[] = [
    { title: "Temps & Absences", icon: CalendarClock, to: "/absences", match: "/absences", badge: "GTA" },
    { title: "Recrutement", icon: BriefcaseBusiness, to: "/recrutement", match: "/recrutement", badge: "Bientôt" },
  ];

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <Link to="/tableau-de-bord" className="text-sidebar-accent-foreground">
          <LeonidaLogo compact={collapsed} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Pilotage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pilotage.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.match)} tooltip={item.title}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Core RH</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {role === "COLLABORATEUR" ? (
                myId ? (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/collaborateurs")} tooltip="Ma fiche">
                      <Link to="/collaborateurs/$id" params={{ id: String(myId) }}>
                        <UserRound />
                        <span>Ma fiche</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ) : null
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive("/collaborateurs")}
                    tooltip={role === "MANAGER" ? "Mon équipe" : "Collaborateurs"}
                  >
                    <Link to="/collaborateurs">
                      <Users />
                      <span>{role === "MANAGER" ? "Mon équipe" : "Collaborateurs"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.match)} tooltip={item.title}>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.badge && !collapsed && (
                    <SidebarMenuBadge className="rounded bg-sidebar-accent px-1.5 text-[10px] font-bold uppercase tracking-wider text-signal">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "RH_ADMIN" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/import")} tooltip="Import CSV">
                    <Link to="/import">
                      <FileUp />
                      <span>Import CSV</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {me?.collaborateur && !collapsed && (
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-sidebar-accent p-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-gradient-signal text-xs font-bold text-primary-foreground">
              {initials(me.collaborateur)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
                {fullName(me.collaborateur)}
              </p>
              <p className="truncate text-xs text-signal">{role ? ROLE_LABELS[role] : "—"}</p>
            </div>
          </div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Se déconnecter">
              <LogOut />
              <span>Se déconnecter</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}


===== FICHIER : leonida-hr/src/components/hr/badges.tsx =====
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, type AppRole } from "@/lib/hr";

const CONTRACT_VARIANT = {
  CDI: "cdi",
  CDD: "cdd",
  Alternance: "alternance",
  Stage: "stage",
  Freelance: "freelance",
} as const;

export function ContractBadge({ type }: { type: string }) {
  const variant = CONTRACT_VARIANT[type as keyof typeof CONTRACT_VARIANT] ?? "outline";
  return <Badge variant={variant}>{type}</Badge>;
}

const ROLE_VARIANT = {
  RH_ADMIN: "role-admin",
  MANAGER: "role-manager",
  COLLABORATEUR: "role-collab",
} as const;

export function RoleBadge({ role }: { role: string }) {
  const variant = ROLE_VARIANT[role as AppRole] ?? "outline";
  return <Badge variant={variant}>{ROLE_LABELS[role as AppRole] ?? role}</Badge>;
}


===== FICHIER : leonida-hr/src/components/hr/forbidden.tsx =====
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


===== FICHIER : leonida-hr/src/components/hr/leonida-logo.tsx =====
import { useId } from "react";
import { cn } from "@/lib/utils";

/** Leonida mark: a network signal wave emitting from a node. */
export function LeonidaMark({ className }: { className?: string }) {
  const gid = useId();
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} role="img" aria-label="Leonida">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--primary)" }} />
          <stop offset="1" style={{ stopColor: "var(--signal)" }} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gid})`} />
      <g className="text-primary-foreground" fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M7 24c2.6 0 3.2-9 5.8-9s3.2 13 5.8 13 3.2-17 5.8-17" strokeWidth="2.6" />
        <path d="M28.5 13.2a5 5 0 0 1 0 7.6" strokeWidth="2.2" opacity="0.85" />
        <path d="M31.8 10a9.5 9.5 0 0 1 0 14" strokeWidth="2.2" opacity="0.5" />
      </g>
      <circle cx="24.4" cy="11" r="2.4" className="fill-primary-foreground" />
    </svg>
  );
}

export function LeonidaLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LeonidaMark className="size-9 shrink-0" />
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-semibold tracking-tight">Leonida</div>
          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-signal">HR · SIRH</div>
        </div>
      )}
    </div>
  );
}


===== FICHIER : leonida-hr/src/components/hr/page-header.tsx =====
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon && <div className="grid size-8 place-items-center rounded-lg bg-accent text-primary">{icon}</div>}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}


===== FICHIER : leonida-hr/src/components/ui/accordion.tsx =====
import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 text-sm font-medium cursor-pointer transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };


===== FICHIER : leonida-hr/src/components/ui/alert-dialog.tsx =====
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className,
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
AlertDialogHeader.displayName = "AlertDialogHeader";

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
AlertDialogFooter.displayName = "AlertDialogFooter";

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants(), className)} {...props} />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: "outline" }), "mt-2 sm:mt-0", className)}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};


===== FICHIER : leonida-hr/src/components/ui/alert.tsx =====
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };


===== FICHIER : leonida-hr/src/components/ui/aspect-ratio.tsx =====
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

const AspectRatio = AspectRatioPrimitive.Root;

export { AspectRatio };


===== FICHIER : leonida-hr/src/components/ui/avatar.tsx =====
"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

export { Avatar, AvatarImage, AvatarFallback };


===== FICHIER : leonida-hr/src/components/ui/badge.tsx =====
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive/12 text-destructive",
        outline: "text-foreground",
        signal: "border-signal/30 bg-signal/12 text-contract-stage-foreground",
        success: "border-transparent bg-success/14 text-success",
        warning: "border-transparent bg-warning/18 text-warning-foreground",
        soon: "border-sidebar-border bg-sidebar-accent text-sidebar-foreground text-[10px] uppercase tracking-wider px-1.5",
        cdi: "border-contract-cdi/20 bg-contract-cdi/10 text-contract-cdi-foreground",
        cdd: "border-contract-cdd/30 bg-contract-cdd/15 text-contract-cdd-foreground",
        alternance: "border-contract-alternance/30 bg-contract-alternance/14 text-contract-alternance-foreground",
        stage: "border-contract-stage/30 bg-contract-stage/14 text-contract-stage-foreground",
        freelance: "border-contract-freelance/25 bg-contract-freelance/12 text-contract-freelance-foreground",
        "role-admin": "border-transparent bg-navy text-navy-foreground",
        "role-manager": "border-primary/25 bg-primary/10 text-accent-foreground",
        "role-collab": "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };


===== FICHIER : leonida-hr/src/components/ui/breadcrumb.tsx =====
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode;
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />);
Breadcrumb.displayName = "Breadcrumb";

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<"ol">>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = "BreadcrumbList";

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("inline-flex items-center gap-1.5", className)} {...props} />
  ),
);
BreadcrumbItem.displayName = "BreadcrumbItem";

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean;
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<"span">>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = "BreadcrumbPage";

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis";

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};


===== FICHIER : leonida-hr/src/components/ui/button.tsx =====
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };


===== FICHIER : leonida-hr/src/components/ui/calendar.tsx =====
"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label,
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number,
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day,
        ),
        range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today,
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside,
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />;
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className={cn("size-4", className)} {...props} />;
          }

          if (orientation === "right") {
            return <ChevronRightIcon className={cn("size-4", className)} {...props} />;
          }

          return <ChevronDownIcon className={cn("size-4", className)} {...props} />;
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers["focused"]) ref.current?.focus();
  }, [modifiers]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers["selected"] &&
        !modifiers["range_start"] &&
        !modifiers["range_end"] &&
        !modifiers["range_middle"]
      }
      data-range-start={modifiers["range_start"]}
      data-range-end={modifiers["range_end"]}
      data-range-middle={modifiers["range_middle"]}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };


===== FICHIER : leonida-hr/src/components/ui/card.tsx =====
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-xl border bg-card text-card-foreground shadow", className)}
      {...props}
    />
  ),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  ),
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };


===== FICHIER : leonida-hr/src/components/ui/carousel.tsx =====
import * as React from "react";
import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & CarouselProps
>(({ orientation = "horizontal", opts, setApi, plugins, className, children, ...props }, ref) => {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) {
      return;
    }

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (!api || !setApi) {
      return;
    }

    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);

    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation: orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        ref={ref}
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
});
Carousel.displayName = "Carousel";

const CarouselContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { carouselRef, orientation } = useCarousel();

    return (
      <div ref={carouselRef} className="overflow-hidden">
        <div
          ref={ref}
          className={cn(
            "flex",
            orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
CarouselContent.displayName = "CarouselContent";

const CarouselItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { orientation } = useCarousel();

    return (
      <div
        ref={ref}
        role="group"
        aria-roledescription="slide"
        className={cn(
          "min-w-0 shrink-0 grow-0 basis-full",
          orientation === "horizontal" ? "pl-4" : "pt-4",
          className,
        )}
        {...props}
      />
    );
  },
);
CarouselItem.displayName = "CarouselItem";

const CarouselPrevious = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollPrev, canScrollPrev } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute  h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-left-12 top-1/2 -translate-y-1/2"
            : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
          className,
        )}
        disabled={!canScrollPrev}
        onClick={scrollPrev}
        {...props}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="sr-only">Previous slide</span>
      </Button>
    );
  },
);
CarouselPrevious.displayName = "CarouselPrevious";

const CarouselNext = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, variant = "outline", size = "icon", ...props }, ref) => {
    const { orientation, scrollNext, canScrollNext } = useCarousel();

    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          "absolute h-8 w-8 rounded-full",
          orientation === "horizontal"
            ? "-right-12 top-1/2 -translate-y-1/2"
            : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
          className,
        )}
        disabled={!canScrollNext}
        onClick={scrollNext}
        {...props}
      >
        <ArrowRight className="h-4 w-4" />
        <span className="sr-only">Next slide</span>
      </Button>
    );
  },
);
CarouselNext.displayName = "CarouselNext";

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};


===== FICHIER : leonida-hr/src/components/ui/chart.tsx =====
import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }

  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>;
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload
            .filter((item) => item.type !== "none")
            .map((item, index) => {
              const key = `${nameKey || item.name || item.dataKey || "value"}`;
              const itemConfig = getPayloadConfigFromPayload(config, item, key);
              const indicatorColor = color || item.payload.fill || item.color;

              return (
                <div
                  key={item.dataKey}
                  className={cn(
                    "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                    indicator === "dot" && "items-center",
                  )}
                >
                  {formatter && item?.value !== undefined && item.name ? (
                    formatter(item.value, item.name, item, index, item.payload)
                  ) : (
                    <>
                      {itemConfig?.icon ? (
                        <itemConfig.icon />
                      ) : (
                        !hideIndicator && (
                          <div
                            className={cn(
                              "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                              {
                                "h-2.5 w-2.5": indicator === "dot",
                                "w-1": indicator === "line",
                                "w-0 border-[1.5px] border-dashed bg-transparent":
                                  indicator === "dashed",
                                "my-0.5": nestLabel && indicator === "dashed",
                              },
                            )}
                            style={
                              {
                                "--color-bg": indicatorColor,
                                "--color-border": indicatorColor,
                              } as React.CSSProperties
                            }
                          />
                        )
                      )}
                      <div
                        className={cn(
                          "flex flex-1 justify-between leading-none",
                          nestLabel ? "items-end" : "items-center",
                        )}
                      >
                        <div className="grid gap-1.5">
                          {nestLabel ? tooltipLabel : null}
                          <span className="text-muted-foreground">
                            {itemConfig?.label || item.name}
                          </span>
                        </div>
                        {item.value && (
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {item.value.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (key in payload && typeof payload[key as keyof typeof payload] === "string") {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[key as keyof typeof payloadPayload] as string;
  }

  return configLabelKey in config ? config[configLabelKey] : config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};


===== FICHIER : leonida-hr/src/components/ui/checkbox.tsx =====
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("grid place-content-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };


===== FICHIER : leonida-hr/src/components/ui/collapsible.tsx =====
"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent;

export { Collapsible, CollapsibleTrigger, CollapsibleContent };


===== FICHIER : leonida-hr/src/components/ui/command.tsx =====
"use client";

import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className,
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  </div>
));

CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));

CommandList.displayName = CommandPrimitive.List.displayName;

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty ref={ref} className="py-6 text-center text-sm" {...props} />
));

CommandEmpty.displayName = CommandPrimitive.Empty.displayName;

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className,
    )}
    {...props}
  />
));

CommandGroup.displayName = CommandPrimitive.Group.displayName;

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className,
    )}
    {...props}
  />
));

CommandItem.displayName = CommandPrimitive.Item.displayName;

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
};
CommandShortcut.displayName = "CommandShortcut";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};


===== FICHIER : leonida-hr/src/components/ui/context-menu.tsx =====
import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-context-menu-content-transform-origin)",
      className,
    )}
    {...props}
  />
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-context-menu-content-transform-origin)",
        className,
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-4 w-4 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold text-foreground", inset && "pl-8", className)}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
};
ContextMenuShortcut.displayName = "ContextMenuShortcut";

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};


===== FICHIER : leonida-hr/src/components/ui/dialog.tsx =====
"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};


===== FICHIER : leonida-hr/src/components/ui/drawer.tsx =====
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className,
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
));
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)} {...props} />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};


===== FICHIER : leonida-hr/src/components/ui/dropdown-menu.tsx =====
"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
      className,
    )}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-dropdown-menu-content-transform-origin)",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};


===== FICHIER : leonida-hr/src/components/ui/form.tsx =====
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  if (!itemContext) {
    throw new Error("useFormField should be used within <FormItem>");
  }

  const fieldState = getFieldState(fieldContext.name, formState);

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();

    return (
      <FormItemContext.Provider value={{ id }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};


===== FICHIER : leonida-hr/src/components/ui/hover-card.tsx =====
import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";

import { cn } from "@/lib/utils";

const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-hover-card-content-transform-origin)",
      className,
    )}
    {...props}
  />
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };


===== FICHIER : leonida-hr/src/components/ui/input-otp.tsx =====
import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { Minus } from "lucide-react";

import { cn } from "@/lib/utils";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index] ?? {
    char: null,
    hasFakeCaret: false,
    isActive: false,
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };


===== FICHIER : leonida-hr/src/components/ui/input.tsx =====
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };


===== FICHIER : leonida-hr/src/components/ui/label.tsx =====
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };


===== FICHIER : leonida-hr/src/components/ui/menubar.tsx =====
import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { Check, ChevronRight, Circle } from "lucide-react";

import { cn } from "@/lib/utils";

function MenubarMenu({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />;
}

function MenubarGroup({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />;
}

function MenubarPortal({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />;
}

function MenubarRadioGroup({ ...props }: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />;
}

function MenubarSub({ ...props }: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}

const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",
      className,
    )}
    {...props}
  />
));
Menubar.displayName = MenubarPrimitive.Root.displayName;

const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className,
    )}
    {...props}
  />
));
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName;

const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </MenubarPrimitive.SubTrigger>
));
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName;

const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-menubar-content-transform-origin)",
      className,
    )}
    {...props}
  />
));
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName;

const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(({ className, align = "start", alignOffset = -4, sideOffset = 8, ...props }, ref) => (
  <MenubarPrimitive.Portal>
    <MenubarPrimitive.Content
      ref={ref}
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-menubar-content-transform-origin)",
        className,
      )}
      {...props}
    />
  </MenubarPrimitive.Portal>
));
MenubarContent.displayName = MenubarPrimitive.Content.displayName;

const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
MenubarItem.displayName = MenubarPrimitive.Item.displayName;

const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
));
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName;

const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-4 w-4 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
));
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName;

const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
    {...props}
  />
));
MenubarLabel.displayName = MenubarPrimitive.Label.displayName;

const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName;

const MenubarShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest text-muted-foreground", className)}
      {...props}
    />
  );
};
MenubarShortcut.displayname = "MenubarShortcut";

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
};


===== FICHIER : leonida-hr/src/components/ui/navigation-menu.tsx =====
import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn("group flex flex-1 list-none items-center justify-center space-x-1", className)}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

const NavigationMenuItem = NavigationMenuPrimitive.Item;

const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent",
);

const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

const NavigationMenuLink = NavigationMenuPrimitive.Link;

const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className,
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};


===== FICHIER : leonida-hr/src/components/ui/pagination.tsx =====
import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { ButtonProps, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("flex flex-row items-center gap-1", className)} {...props} />
  ),
);
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn("", className)} {...props} />,
);
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

const PaginationLink = ({ className, isActive, size = "icon", ...props }: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className,
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({ className, ...props }: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

const PaginationEllipsis = ({ className, ...props }: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};


===== FICHIER : leonida-hr/src/components/ui/popover.tsx =====
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };


===== FICHIER : leonida-hr/src/components/ui/progress.tsx =====
"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };


===== FICHIER : leonida-hr/src/components/ui/radio-group.tsx =====
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";

import { cn } from "@/lib/utils";

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return <RadioGroupPrimitive.Root className={cn("grid gap-2", className)} {...props} ref={ref} />;
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-3.5 w-3.5 fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };


===== FICHIER : leonida-hr/src/components/ui/resizable.tsx =====
import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof Group>) => (
  <Group
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
);

const ResizablePanel = Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) => (
  <Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };


===== FICHIER : leonida-hr/src/components/ui/scroll-area.tsx =====
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "@/lib/utils";

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };


===== FICHIER : leonida-hr/src/components/ui/select.tsx =====
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};


===== FICHIER : leonida-hr/src/components/ui/separator.tsx =====
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className,
    )}
    {...props}
  />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };


===== FICHIER : leonida-hr/src/components/ui/skeleton.tsx =====
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };


===== FICHIER : leonida-hr/src/components/ui/slider.tsx =====
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };


===== FICHIER : leonida-hr/src/components/ui/sonner.tsx =====
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };


===== FICHIER : leonida-hr/src/components/ui/textarea.tsx =====
import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };


===== FICHIER : leonida-hr/src/components/ui/sheet.tsx =====
"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content ref={ref} className={cn(sheetVariants({ side }), className)} {...props}>
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};


===== FICHIER : leonida-hr/src/components/ui/sidebar.tsx =====
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref,
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    // This is the internal state of the sidebar.
    // We use openProp and setOpenProp for control from outside the component.
    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === "function" ? value(open) : value;
        if (setOpenProp) {
          setOpenProp(openState);
        } else {
          _setOpen(openState);
        }

        // This sets the cookie to keep the sidebar state.
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setOpenProp, open],
    );

    // Helper to toggle the sidebar.
    const toggleSidebar = React.useCallback(() => {
      return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
    }, [isMobile, setOpen, setOpenMobile]);

    // Adds a keyboard shortcut to toggle the sidebar.
    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          toggleSidebar();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [toggleSidebar]);

    // We add a state so that we can do data-state="expanded" or "collapsed".
    // This makes it easier to style the sidebar with Tailwind classes.
    const state = open ? "expanded" : "collapsed";

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({
        state,
        open,
        setOpen,
        isMobile,
        openMobile,
        setOpenMobile,
        toggleSidebar,
      }),
      [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              "group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar",
              className,
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  },
);
SidebarProvider.displayName = "SidebarProvider";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(
  (
    {
      side = "left",
      variant = "sidebar",
      collapsible = "offcanvas",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    if (collapsible === "none") {
      return (
        <div
          className={cn(
            "flex h-full w-(--sidebar-width) flex-col bg-sidebar text-sidebar-foreground",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
              } as React.CSSProperties
            }
            side={side}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Sidebar</SheetTitle>
              <SheetDescription>Displays the mobile sidebar.</SheetDescription>
            </SheetHeader>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        ref={ref}
        className="group peer hidden text-sidebar-foreground md:block"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
      >
        {/* This is what handles the sidebar gap on desktop */}
        <div
          className={cn(
            "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          )}
        />
        <div
          className={cn(
            "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
            side === "left"
              ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
              : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
            // Adjust the padding for floating and inset variants.
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className,
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    );
  },
);
Sidebar.displayName = "Sidebar";

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar();

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className={cn(
          "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex",
          "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
          "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
          "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar",
          "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
          "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarRail.displayName = "SidebarRail";

const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"main">>(
  ({ className, ...props }, ref) => {
    return (
      <main
        ref={ref}
        className={cn(
          "relative flex w-full flex-1 flex-col bg-background",
          "md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarInset.displayName = "SidebarInset";

const SidebarInput = React.forwardRef<
  React.ElementRef<typeof Input>,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => {
  return (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        className,
      )}
      {...props}
    />
  );
});
SidebarInput.displayName = "SidebarInput";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="header"
        className={cn("flex flex-col gap-2 p-2", className)}
        {...props}
      />
    );
  },
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="footer"
        className={cn("flex flex-col gap-2 p-2", className)}
        {...props}
      />
    );
  },
);
SidebarFooter.displayName = "SidebarFooter";

const SidebarSeparator = React.forwardRef<
  React.ElementRef<typeof Separator>,
  React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => {
  return (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-2 w-auto bg-sidebar-border", className)}
      {...props}
    />
  );
});
SidebarSeparator.displayName = "SidebarSeparator";

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="content"
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarContent.displayName = "SidebarContent";

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="group"
        className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
        {...props}
      />
    );
  },
);
SidebarGroup.displayName = "SidebarGroup";

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-none ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = "SidebarGroupLabel";

const SidebarGroupAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="group-action"
      className={cn(
        "absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarGroupAction.displayName = "SidebarGroupAction";

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  ),
);
SidebarGroupContent.displayName = "SidebarGroupContent";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  ),
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  ),
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring cursor-pointer transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_var(--sidebar-border)] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_var(--sidebar-accent)]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:!p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(
  (
    {
      asChild = false,
      isActive = false,
      variant = "default",
      size = "default",
      tooltip,
      className,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const { isMobile, state } = useSidebar();

    const button = (
      <Comp
        ref={ref}
        data-sidebar="menu-button"
        data-size={size}
        data-active={isActive}
        className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
        {...props}
      />
    );

    if (!tooltip) {
      return button;
    }

    if (typeof tooltip === "string") {
      tooltip = {
        children: tooltip,
      };
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent
          side="right"
          align="center"
          hidden={state !== "collapsed" || isMobile}
          {...tooltip}
        />
      </Tooltip>
    );
  },
);
SidebarMenuButton.displayName = "SidebarMenuButton";

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    showOnHover?: boolean;
  }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 after:md:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "SidebarMenuAction";

const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  ),
);
SidebarMenuBadge.displayName = "SidebarMenuBadge";

const SidebarMenuSkeleton = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    showIcon?: boolean;
  }
>(({ className, showIcon = false, ...props }, ref) => {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      ref={ref}
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && <Skeleton className="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
});
SidebarMenuSkeleton.displayName = "SidebarMenuSkeleton";

const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  ),
);
SidebarMenuSub.displayName = "SidebarMenuSub";

const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(
  ({ ...props }, ref) => <li ref={ref} {...props} />,
);
SidebarMenuSubItem.displayName = "SidebarMenuSubItem";

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & {
    asChild?: boolean;
    size?: "sm" | "md";
    isActive?: boolean;
  }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground outline-none ring-sidebar-ring cursor-pointer hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "SidebarMenuSubButton";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};


===== FICHIER : leonida-hr/src/components/ui/switch.tsx =====
import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };


===== FICHIER : leonida-hr/src/components/ui/table.tsx =====
import * as React from "react";

import { cn } from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
));
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };


===== FICHIER : leonida-hr/src/components/ui/tabs.tsx =====
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };


===== FICHIER : leonida-hr/src/components/ui/toggle-group.tsx =====
"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  size: "default",
  variant: "default",
});

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

export { ToggleGroup, ToggleGroupItem };


===== FICHIER : leonida-hr/src/components/ui/toggle.tsx =====
import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
));

Toggle.displayName = TogglePrimitive.Root.displayName;

export { Toggle, toggleVariants };


===== FICHIER : leonida-hr/src/components/ui/tooltip.tsx =====
"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/utils";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-tooltip-content-transform-origin)",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };


===== FICHIER : leonida-hr/src/hooks/use-me.ts =====
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Collaborateur } from "@/lib/hr";

export interface Me {
  userId: string;
  email: string;
  role: AppRole | null;
  collaborateur: Collaborateur | null;
}

export const meQueryKey = ["me"] as const;

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    staleTime: 60_000,
    queryFn: async (): Promise<Me | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const [roles, collab] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("collaborateurs").select("*").eq("user_id", user.id).maybeSingle(),
      ]);
      return {
        userId: user.id,
        email: user.email ?? "",
        role: (roles.data?.[0]?.role as AppRole | undefined) ?? null,
        collaborateur: collab.data ?? null,
      };
    },
  });
}


===== FICHIER : leonida-hr/src/hooks/use-mobile.tsx =====
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}


===== FICHIER : leonida-hr/src/integrations/supabase/auth-attacher.ts =====
// This file is automatically generated. Do not edit it directly.
import { createMiddleware } from '@tanstack/react-start'
import { supabase } from './client'

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
)


===== FICHIER : leonida-hr/src/integrations/supabase/auth-middleware.ts =====
// This file is automatically generated. Do not edit it directly.
import { createMiddleware } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'




function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    
    const SUPABASE_URL = process.env['SUPABASE_URL'];
    const SUPABASE_PUBLISHABLE_KEY = process.env['SUPABASE_PUBLISHABLE_KEY'];

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      const missing = [
        ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
        ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
      ];
      const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
      console.error(`[Supabase] ${message}`);
      throw new Error(message);
    }
    
    const request = getRequest();

    if (!request?.headers) {
      throw new Error('Unauthorized: No request headers available');
    }


    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header provided');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Only Bearer tokens are supported');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('Unauthorized: No token provided');
    }

    if (token.split('.').length !== 3) {
      throw new Error('Unauthorized: Invalid token');
    }

    const supabase = createClient<Database>(
      SUPABASE_URL!,
      SUPABASE_PUBLISHABLE_KEY!,
      {
        global: {
          fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY!),
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data, error } = await supabase.auth.getClaims(token);
    if (error || !data?.claims) {
      throw new Error('Unauthorized: Invalid token');
    }

    if (!data.claims.sub) {
      throw new Error('Unauthorized: No user ID found in token');
    }

    return next({
      context: {
        supabase,
        userId: data.claims.sub,
        claims: data.claims,
      },
    });
  },
);


===== FICHIER : leonida-hr/src/integrations/supabase/client.server.ts =====
// This file is automatically generated. Do not edit it directly.
// Server-side Supabase client with service role key - bypasses RLS.
// Use this for admin operations in server functions and server routes only.
// For user-authenticated queries (with RLS), use the auth middleware instead.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env['SUPABASE_URL'];
  const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_SERVICE_ROLE_KEY ? ['SUPABASE_SERVICE_ROLE_KEY'] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY),
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client with service role - bypasses RLS
// SECURITY: Only use this for trusted server-side operations, never expose to client code
// Load inside server handlers: const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
// Top-level import is safe only in other .server.ts modules - route files and *.functions.ts ship to the client bundle.
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});


===== FICHIER : leonida-hr/src/integrations/supabase/client.ts =====
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { brokeredPreviewStorage } from './previewAuthStorage';

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith('sb_publishable_') || value.startsWith('sb_secret_');
}

// The public URL can be reachable only from the browser, so server requests go to the runtime URL of the same backend.
function serverSupabaseUrl(publicUrl: string, supabaseKey: string): string | undefined {
  if (typeof window !== 'undefined' || typeof process === 'undefined') return undefined;
  const serverUrl = process.env['SUPABASE_URL']?.replace(/\/+$/, '');
  if (!serverUrl || serverUrl === publicUrl || process.env['SUPABASE_PUBLISHABLE_KEY'] !== supabaseKey) return undefined;
  return serverUrl;
}

function createSupabaseFetch(supabaseUrl: string, supabaseKey: string): typeof fetch {
  const publicUrl = supabaseUrl.replace(/\/+$/, '');
  const serverUrl = serverSupabaseUrl(publicUrl, supabaseKey);
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (isNewSupabaseApiKey(supabaseKey) && headers.get('Authorization') === `Bearer ${supabaseKey}`) {
      headers.delete('Authorization');
    }

    headers.set('apikey', supabaseKey);
    if (serverUrl) {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (url.startsWith(`${publicUrl}/`)) {
        const target = serverUrl + url.slice(publicUrl.length);
        const request = typeof input === 'string' || input instanceof URL ? target : new Request(target, input);
        return fetch(request, { ...init, headers });
      }
    }
    return fetch(input, { ...init, headers });
  };
}


function createSupabaseClient() {
  // Use import.meta.env for client-side (Vite build-time replacement)
  // Fall back to process.env for SSR (server-side rendering)
  const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] || process.env['SUPABASE_URL'];
  const SUPABASE_PUBLISHABLE_KEY = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ['SUPABASE_URL'] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ['SUPABASE_PUBLISHABLE_KEY'] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(', ')}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});



===== FICHIER : leonida-hr/src/integrations/supabase/cron-auth.ts =====
// This file is automatically generated. Do not edit it directly.
export async function authenticateCronRequest(
  request: Request,
): Promise<Response | null> {
  const currentSecret = process.env['LOVABLE_CRON_SECRET']
  const previousSecret = process.env['LOVABLE_CRON_SECRET_PREVIOUS']

  if (!currentSecret) {
    return new Response('Server configuration error', { status: 500 })
  }

  const match = /^Bearer ([^\s,]+)$/.exec(
    request.headers.get('authorization') ?? '',
  )
  const token = match?.[1]
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { createHash, timingSafeEqual } = await import('node:crypto')
  const digest = (value: string) =>
    createHash('sha256').update(value, 'utf8').digest()
  const providedDigest = digest(token)
  const currentMatches = timingSafeEqual(providedDigest, digest(currentSecret))
  const previousMatches = timingSafeEqual(
    providedDigest,
    digest(previousSecret ?? currentSecret),
  )

  if (!currentMatches && !previousMatches) {
    return new Response('Unauthorized', { status: 401 })
  }

  return null
}


===== FICHIER : leonida-hr/src/integrations/supabase/previewAuthStorage.ts =====
// This file is automatically generated. Do not edit it directly.

/** Storage accepted by Supabase's `auth.storage` option; `localStorage` and the editor broker both satisfy it. */
export interface PreviewAuthStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

type BrokerRequestType = 'lovable-preview-auth:get' | 'lovable-preview-auth:set' | 'lovable-preview-auth:remove';

interface BrokerRequest {
  type: BrokerRequestType;
  requestId: string;
  projectId: string;
  key: string;
  value?: string;
}

interface BrokerReply {
  ok: boolean;
  value: string | null;
}

const RESULT = 'lovable-preview-auth:result';

function readBrokerReply(data: unknown, requestId: string): BrokerReply | null {
  if (typeof data !== 'object' || data === null) return null;
  if (!('type' in data) || data.type !== RESULT) return null;
  if (!('requestId' in data) || data.requestId !== requestId) return null;
  return {
    ok: 'ok' in data && Boolean(data.ok),
    value: 'value' in data && typeof data.value === 'string' ? data.value : null,
  };
}

/**
 * On a Lovable preview surface, broker the auth session to the editor over
 * postMessage so the project's preview surfaces share one login; else localStorage.
 */
export function brokeredPreviewStorage(): PreviewAuthStorage | undefined {
  if (typeof window === 'undefined') return undefined;
  const host = location.hostname;
  const PREVIEW_ZONES = ['lovableproject.com', 'lovableproject-dev.com', 'lovable.app', 'gpt-eng.com', 'gptengineer.run'];
  const onPreviewZone = PREVIEW_ZONES.some((z) => host === z || host.endsWith('.' + z));
  // Read the id only from non-user-controlled host positions, so a user-named
  // preview--<name> host can't smuggle another project's id.
  const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  const projectId = onPreviewZone
    ? (new RegExp('^(?:id-preview(?:-[a-z0-9]+)?|project)--(' + UUID + ')(?:-dev)?(?=\\.|$)', 'i').exec(host)?.[1]
        ?? new RegExp('^live--(' + UUID + ')(?:-thr_[a-z0-9]+)?(?=\\.|$)', 'i').exec(host)?.[1]
        ?? new RegExp('^(' + UUID + ')(?=[.-])', 'i').exec(host)?.[1])
    : undefined;
  // lib.dom types window.parent and location.ancestorOrigins as always set, but a
  // detached frame has no parent and not every browser implements ancestorOrigins.
  const parentWindow = window.parent as Window | null;
  const framed = parentWindow !== null && parentWindow !== window;
  if (!projectId || !framed) return localStorage;

  // Post only to the real editor ancestor, validated as a Lovable origin, so the
  // session token can never reach an untrusted embedder.
  const dev = host.endsWith('.lovableproject-dev.com') || host.endsWith('.gpt-eng.com');
  const EDITOR = dev
    ? /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/
    : /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;
  const ancestorOrigins = location.ancestorOrigins as DOMStringList | undefined;
  const ancestor = ancestorOrigins?.[0] ?? (document.referrer ? new URL(document.referrer).origin : '');
  const editorOrigins = ancestor && EDITOR.test(ancestor)
    ? [ancestor]
    : (dev ? ['https://lovable.dev', 'http://localhost:3000'] : ['https://lovable.dev']);
  const TIMEOUT = 2000;
  const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const request = (type: BrokerRequestType, key: string, value?: string): Promise<BrokerReply | null> =>
    new Promise((resolve) => {
      const requestId = newId();
      let done = false;
      const finish = (reply: BrokerReply | null) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        resolve(reply);
      };
      const onMessage = (e: MessageEvent<unknown>) => {
        if (!editorOrigins.includes(e.origin)) return;
        const reply = readBrokerReply(e.data, requestId);
        if (reply) finish(reply);
      };
      window.addEventListener('message', onMessage);
      const timer = setTimeout(() => { finish(null); }, TIMEOUT);
      const msg: BrokerRequest = { type, requestId, projectId, key };
      if (value !== undefined) msg.value = value;
      // targetOrigin per trusted editor origin, so a session token never reaches an arbitrary embedder.
      for (const origin of editorOrigins) window.parent.postMessage(msg, origin);
    });

  // The editor may not be listening yet at the first getItem, so retry once.
  let firstGet = true;
  const RETRY_DELAY = 250;
  // Blocked third-party storage throws here; seeding must not break broker reads.
  const readLocal = (key: string): string | null | undefined => { try { return localStorage.getItem(key); } catch { return undefined; } };

  return {
    getItem: async (key) => {
      // Sent with GET and REMOVE so an editor that never cached this session can check or revoke it.
      const local = readLocal(key);
      let res = await request('lovable-preview-auth:get', key, local ?? undefined);
      if (!res && firstGet) {
        await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY));
        res = await request('lovable-preview-auth:get', key, local ?? undefined);
      }
      firstGet = false;
      // '' is the logout tombstone: clear the local copy too so it can't resurrect if
      // the broker later goes silent. A null value means never-synced -> keep local.
      if (res?.ok && res.value !== null) {
        if (res.value === '') {
          if (local !== undefined && readLocal(key) === local) localStorage.removeItem(key);
          return null;
        }
        // Seed this origin so a new tab, whose editor holds no session, stays signed in.
        if (local === null && readLocal(key) === null) {
          try { localStorage.setItem(key, res.value); } catch { /* storage full: still return the editor's session */ }
        }
        return res.value;
      }
      return localStorage.getItem(key);
    },
    setItem: (key, value) => {
      localStorage.setItem(key, value);
      return request('lovable-preview-auth:set', key, value).then((res) => {
        if (res?.ok && res.value !== null && localStorage.getItem(key) === value) {
          if (res.value === '') localStorage.removeItem(key);
          else localStorage.setItem(key, res.value);
        }
      });
    },
    removeItem: (key) => {
      const local = readLocal(key);
      localStorage.removeItem(key);
      return request('lovable-preview-auth:remove', key, local ?? undefined).then(() => {});
    },
  };
}


===== FICHIER : leonida-hr/src/integrations/supabase/types.ts =====
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      collaborateurs: {
        Row: {
          code_service: string
          competences_cles: string[]
          created_at: string
          date_embauche: string
          date_fin_contrat: string | null
          date_naissance: string
          email: string
          id_collaborateur: number
          id_manager: number | null
          intitule_poste: string
          niveau_classification: string
          niveau_formation: string | null
          nom: string
          prenom: string
          profil_acces: string
          salaire_brut_mensuel: number
          solde_cp: number
          solde_rtt: number
          taux_temps_travail: number
          type_contrat: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code_service: string
          competences_cles?: string[]
          created_at?: string
          date_embauche: string
          date_fin_contrat?: string | null
          date_naissance: string
          email: string
          id_collaborateur: number
          id_manager?: number | null
          intitule_poste: string
          niveau_classification: string
          niveau_formation?: string | null
          nom: string
          prenom: string
          profil_acces: string
          salaire_brut_mensuel: number
          solde_cp?: number
          solde_rtt?: number
          taux_temps_travail: number
          type_contrat: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code_service?: string
          competences_cles?: string[]
          created_at?: string
          date_embauche?: string
          date_fin_contrat?: string | null
          date_naissance?: string
          email?: string
          id_collaborateur?: number
          id_manager?: number | null
          intitule_poste?: string
          niveau_classification?: string
          niveau_formation?: string | null
          nom?: string
          prenom?: string
          profil_acces?: string
          salaire_brut_mensuel?: number
          solde_cp?: number
          solde_rtt?: number
          taux_temps_travail?: number
          type_contrat?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          author_name: string | null
          author_user_id: string
          created_at: string
          created_count: number
          encoding: string | null
          file_name: string | null
          id: string
          rejected_count: number
          report: Json
          total_rows: number
          updated_count: number
          warning_count: number
        }
        Insert: {
          author_name?: string | null
          author_user_id?: string
          created_at?: string
          created_count?: number
          encoding?: string | null
          file_name?: string | null
          id?: string
          rejected_count?: number
          report?: Json
          total_rows?: number
          updated_count?: number
          warning_count?: number
        }
        Update: {
          author_name?: string | null
          author_user_id?: string
          created_at?: string
          created_count?: number
          encoding?: string | null
          file_name?: string | null
          id?: string
          rejected_count?: number
          report?: Json
          total_rows?: number
          updated_count?: number
          warning_count?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_collaborateur: { Args: { _id: number }; Returns: boolean }
      collaborateur_access: { Args: { _id: number }; Returns: string }
      current_collaborateur_id: { Args: never; Returns: number }
      get_manager_of: {
        Args: { _id: number }
        Returns: {
          can_open: boolean
          code_service: string
          id_collaborateur: number
          intitule_poste: string
          nom: string
          prenom: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "RH_ADMIN" | "MANAGER" | "COLLABORATEUR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["RH_ADMIN", "MANAGER", "COLLABORATEUR"],
    },
  },
} as const


===== FICHIER : leonida-hr/src/lib/auth.functions.ts =====
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { DEMO_PASSWORD } from "./demo";

const activateSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(128),
});

/**
 * Lazily creates the login account of a collaborator listed in the HR file.
 * Public on purpose (it runs before sign-in): it only acts when the email exists in
 * `collaborateurs`, no account is linked yet, and the shared demo password is used.
 */
export const activateCollaboratorAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => activateSchema.parse(input))
  .handler(async ({ data }) => {
    if (data.password !== DEMO_PASSWORD) return { status: "invalid" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: collab, error } = await supabaseAdmin
      .from("collaborateurs")
      .select("id_collaborateur, user_id")
      .eq("email", data.email)
      .maybeSingle();
    if (error) {
      console.error("[activate] lookup failed", error);
      return { status: "error" as const };
    }
    if (!collab) return { status: "unknown" as const };
    if (collab.user_id) return { status: "already_active" as const };

    let userId: string | undefined;
    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { id_collaborateur: collab.id_collaborateur },
    });

    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      // Account may already exist (e.g. the fiche was deleted then re-imported): relink it.
      for (let page = 1; page <= 10 && !userId; page++) {
        const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
        const found = list?.users.find((u) => u.email?.toLowerCase() === data.email);
        if (found) userId = found.id;
        if (!list || list.users.length < 200) break;
      }
    }
    if (!userId) {
      console.error("[activate] could not create account", created.error);
      return { status: "error" as const };
    }

    const { error: linkError } = await supabaseAdmin
      .from("collaborateurs")
      .update({ user_id: userId })
      .eq("id_collaborateur", collab.id_collaborateur);
    if (linkError) {
      console.error("[activate] link failed", linkError);
      return { status: "error" as const };
    }
    return { status: "activated" as const };
  });


===== FICHIER : leonida-hr/src/lib/csv-import.test.ts =====
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


===== FICHIER : leonida-hr/src/lib/csv-import.ts =====
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


===== FICHIER : leonida-hr/src/lib/demo.ts =====
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


===== FICHIER : leonida-hr/src/lib/error-capture.ts =====
// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// h3's HTTPError serializes to {"status":500,"unhandled":true,"message":"HTTPError"} —
// no stack, no cause — so a plain console.error(error) reaches the log pipeline with
// the failure detail stripped. Expand Error-like args into a string that keeps the
// message, stack, and the full cause chain.
const CAUSE_DEPTH_LIMIT = 5;
const DESCRIPTION_LENGTH_LIMIT = 8_000;

export function describeError(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (!(current instanceof Error)) {
      parts.push(typeof current === "string" ? current : safeStringify(current));
      break;
    }
    const label = depth === 0 ? "" : "caused by: ";
    const status = describeStatus(current);
    parts.push(`${label}${current.stack ?? `${current.name}: ${current.message}`}${status}`);
    current = current.cause;
  }
  return parts.join("\n").slice(0, DESCRIPTION_LENGTH_LIMIT);
}

function describeStatus(error: Error): string {
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const value = status ?? statusCode;
  return typeof value === "number" ? ` (status ${value})` : "";
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

function isErrorLike(value: unknown): value is Error {
  return value instanceof Error;
}

// Wrap console.error so errors logged by any layer — including h3's internal
// unhandled-error logging, which this file cannot hook directly — are both
// recorded for consumeLastCapturedError and expanded before serialization.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const expanded = args.map((arg) => {
    if (!isErrorLike(arg)) return arg;
    record(arg);
    return describeError(arg);
  });
  originalConsoleError(...expanded);
};

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}


===== FICHIER : leonida-hr/src/lib/error-page.ts =====
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}


===== FICHIER : leonida-hr/src/lib/hr.test.ts =====
import { describe, expect, it } from "vitest";
import { computeAge, computeSeniority, formatSeniority } from "./hr";

const today = new Date(2026, 10, 17); // 17/11/2026

describe("calculs RH", () => {
  it("computes age in full years (birthday not yet reached)", () => {
    expect(computeAge("1981-11-24", today)).toBe(44);
  });

  it("computes age in full years (birthday passed)", () => {
    expect(computeAge("1991-06-09", today)).toBe(35);
  });

  it("computes seniority in years and months since hire date", () => {
    expect(computeSeniority("2022-02-01", today)).toEqual({ years: 4, months: 9 });
    expect(formatSeniority({ years: 4, months: 9 })).toBe("4 ans et 9 mois");
  });
});


===== FICHIER : leonida-hr/src/lib/hr.ts =====
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


===== FICHIER : leonida-hr/src/lib/import.functions.ts =====
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


===== FICHIER : leonida-hr/src/lib/lovable-error-reporting.ts =====
type LovableErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

type LovableEvents = {
  track?: (event: string, properties?: Record<string, unknown>) => string | null;
  captureException?: (
    error: unknown,
    context?: Record<string, unknown>,
    options?: LovableErrorOptions,
  ) => void;
};

declare global {
  interface Window {
    __lovableEvents?: LovableEvents;
    __lovableReportRuntimeError?: (payload: {
      message: string;
      stack?: string;
      filename?: string;
    }) => void;
  }
}

export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context,
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error",
    },
  );
  // Prod React does not rethrow boundary-caught errors to window.onerror, so the
  // editor's telemetry never sees them. Forward to lovable.js's reporting hook,
  // which is present only inside the editor preview.
  const stack = error instanceof Error ? error.stack : undefined;
  window.__lovableReportRuntimeError?.({
    message: describeThrown(error),
    ...(stack !== undefined && { stack }),
    filename: window.location.pathname,
  });
}

const MAX_SERIALIZED_LENGTH = 2000;

// Loaders and server fns throw raw Responses and plain objects (a Supabase
// `{ message, code, details }`), which String() reduces to "[object ...]".
function describeThrown(error: unknown): string {
  if (error instanceof Response) {
    return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  const { message } = (error ?? {}) as { message?: unknown };
  if (typeof message === "string" && message.length > 0) return message;
  try {
    return JSON.stringify(error)?.slice(0, MAX_SERIALIZED_LENGTH) ?? String(error);
  } catch {
    return String(error);
  }
}


===== FICHIER : leonida-hr/src/lib/utils.ts =====
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


===== FICHIER : leonida-hr/src/routes/README.md =====
# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dynamic — bare `$`, no curly braces) |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment) |
| `files/$.tsx` | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx` | layout route (renders children via `<Outlet />`) |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.


===== FICHIER : leonida-hr/src/routes/__root.tsx =====
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu se charger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue. Réessayez ou revenez à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    // Each content route sets its own head(). Never add og:image or twitter:image here.
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Leonida HR — SIRH interne" },
      { name: "description", content: "Leonida HR, le SIRH interne de Leonida : collaborateurs, temps & absences, imports RH." },
      { name: "author", content: "Leonida" },
      { property: "og:title", content: "Leonida HR — SIRH interne" },
      { property: "og:description", content: "Le SIRH interne de Leonida, opérateur réseaux, fibre et cloud télécom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}


===== FICHIER : leonida-hr/src/routes/auth.tsx =====
import { useState, type FormEvent } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Lock, Mail, ShieldCheck, UserCog, UserRound, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeonidaLogo } from "@/components/hr/leonida-logo";
import { supabase } from "@/integrations/supabase/client";
import { activateCollaboratorAccount } from "@/lib/auth.functions";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo";
import { cn } from "@/lib/utils";
import fibreHero from "@/assets/fibre-hero.jpg";

type AuthSearch = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>): AuthSearch => ({
    redirect:
      typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//")
        ? s["redirect"]
        : undefined,
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/tableau-de-bord" });
  },
  head: () => ({
    meta: [
      { title: "Connexion — Leonida HR" },
      { name: "description", content: "Connectez-vous au SIRH interne de Leonida avec votre email professionnel." },
      { property: "og:title", content: "Connexion — Leonida HR" },
      { property: "og:description", content: "Accès sécurisé au SIRH Leonida : RH, managers et collaborateurs." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const DEMO_ICONS = { RH_ADMIN: UserCog, MANAGER: Users, COLLABORATEUR: UserRound } as const;
const DEMO_LABELS = { RH_ADMIN: "RH_ADMIN", MANAGER: "MANAGER", COLLABORATEUR: "COLLABORATEUR" } as const;

function AuthPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const activate = useServerFn(activateCollaboratorAccount);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function signIn(rawEmail: string, pwd: string, key: string) {
    const mail = rawEmail.trim().toLowerCase();
    setPending(key);
    try {
      let { error } = await supabase.auth.signInWithPassword({ email: mail, password: pwd });
      if (error && /invalid login credentials/i.test(error.message)) {
        // First sign-in of a collaborator from the HR file: create the account, then retry.
        const res = await activate({ data: { email: mail, password: pwd } });
        if (res.status === "activated") {
          ({ error } = await supabase.auth.signInWithPassword({ email: mail, password: pwd }));
        } else if (res.status === "unknown") {
          toast.error("Aucun collaborateur ne correspond à cet email.");
          return;
        } else if (res.status === "error") {
          toast.error("Activation du compte impossible. Réessayez dans un instant.");
          return;
        }
      }
      if (error) {
        toast.error("Email ou mot de passe incorrect.");
        return;
      }
      toast.success("Connexion réussie");
      if (search.redirect) navigate({ href: search.redirect, replace: true });
      else navigate({ to: "/tableau-de-bord", replace: true });
    } catch {
      toast.error("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setPending(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    void signIn(email, password, "form");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-navy text-navy-foreground lg:flex lg:flex-col">
        <img
          src={fibreHero}
          alt=""
          width={1024}
          height={1536}
          className="absolute inset-0 size-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-navy opacity-80" />
        <div className="absolute inset-0 bg-grid-signal opacity-40" />
        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          <LeonidaLogo className="text-navy-foreground" />
          <div className="max-w-md">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-signal">SIRH interne</p>
            <h1 className="text-4xl font-semibold leading-tight xl:text-5xl">
              Les talents qui font tourner <span className="text-gradient-signal">le réseau</span>.
            </h1>
            <p className="mt-5 text-base text-navy-muted">
              Réseaux, fibre et cloud télécom : un seul espace pour gérer les collaborateurs, les temps et les absences
              de Leonida.
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-navy-muted">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-signal" /> Droits contrôlés côté serveur
            </span>
            <span>100 collaborateurs · 9 services</span>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <LeonidaLogo className="mb-10 lg:hidden" />
          <h2 className="text-3xl font-semibold">Connexion</h2>
          <p className="mt-2 text-sm text-muted-foreground">Utilisez votre email professionnel Leonida.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email professionnel</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="prenom.nom@leonida.fr"
                  className="h-11 pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" size="lg" className="h-11 w-full shadow-glow" disabled={pending !== null}>
              {pending === "form" ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              Se connecter
            </Button>
          </form>

          <div className="mt-10">
            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Accès rapide démo
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="mt-4 grid gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const Icon = DEMO_ICONS[acc.role];
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={pending !== null}
                    onClick={() => signIn(acc.email, DEMO_PASSWORD, acc.role)}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-card transition",
                      "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lift disabled:opacity-60",
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-primary group-hover:bg-gradient-signal group-hover:text-primary-foreground">
                      {pending === acc.role ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        {acc.name}{" "}
                        <span className="ml-1 font-mono text-[10px] font-bold tracking-wider text-primary">
                          {DEMO_LABELS[acc.role]}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">{acc.title}</span>
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Mot de passe de démo commun à tous les comptes :{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{DEMO_PASSWORD}</code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


===== FICHIER : leonida-hr/src/routes/index.tsx =====
import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

// Session-aware entry point: signed-in users land on the dashboard, others on the sign-in page.
export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Leonida HR — Accueil" },
      { name: "description", content: "Accès au SIRH interne de Leonida : connexion et tableau de bord RH." },
      { property: "og:title", content: "Leonida HR — Accueil" },
      { property: "og:description", content: "Le SIRH interne de Leonida, réseaux, fibre et cloud télécom." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/tableau-de-bord" });
    throw redirect({ to: "/auth", search: { redirect: undefined } });
  },
  component: () => null,
});


===== FICHIER : leonida-hr/src/routes/_authenticated/absences.tsx =====
import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/hr/page-header";

export const Route = createFileRoute("/_authenticated/absences")({
  head: () => ({
    meta: [
      { title: "Temps & Absences — Leonida HR" },
      { name: "description", content: "Module GTA de Leonida HR : demandes de congés, validation manager et soldes." },
      { property: "og:title", content: "Temps & Absences — Leonida HR" },
      { property: "og:description", content: "Gestion des temps et absences des collaborateurs Leonida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Module GTA"
      title="Temps & Absences"
      text="Demandes de CP, RTT et absences, calcul en jours ouvrés, validation par le manager et décompte automatique des soldes."
    />
  ),
});

export function ModulePlaceholder({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div>
      <PageHeader eyebrow={eyebrow} title={title} />
      <div className="rounded-2xl border border-dashed bg-card p-10 text-center shadow-card">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-accent text-primary">
          <CalendarClock className="size-6" />
        </div>
        <p className="font-semibold">Module en préparation</p>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}


===== FICHIER : leonida-hr/src/routes/_authenticated/collaborateurs.$id.tsx =====
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


===== FICHIER : leonida-hr/src/routes/_authenticated/collaborateurs.index.tsx =====
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


===== FICHIER : leonida-hr/src/routes/_authenticated/import.tsx =====
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


===== FICHIER : leonida-hr/src/routes/_authenticated/recrutement.tsx =====
import { createFileRoute } from "@tanstack/react-router";
import { ModulePlaceholder } from "./absences";

export const Route = createFileRoute("/_authenticated/recrutement")({
  head: () => ({
    meta: [
      { title: "Recrutement — Leonida HR" },
      { name: "description", content: "Futur module Recrutement de Leonida HR : offres, pipeline candidats, onboarding." },
      { property: "og:title", content: "Recrutement — Leonida HR" },
      { property: "og:description", content: "Offres d'emploi, pipeline candidats et onboarding chez Leonida." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ModulePlaceholder
      eyebrow="Bientôt"
      title="Recrutement"
      text="Offres d'emploi, pipeline candidats en Kanban, planification des entretiens et onboarding."
    />
  ),
});


===== FICHIER : leonida-hr/src/routes/_authenticated/route.tsx =====
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/hr/app-shell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}


===== FICHIER : leonida-hr/src/routes/_authenticated/tableau-de-bord.tsx =====
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


===== FICHIER : leonida-hr/src/test/app-routing.test.tsx =====
import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});


===== FICHIER : leonida-hr/src/test/setup.ts =====
import "@testing-library/jest-dom/vitest";

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});



===== FICHIER : leonida-hr/supabase/config.toml =====
project_id = "ksjmchshexpnxkeqqpaa"
