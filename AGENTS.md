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
