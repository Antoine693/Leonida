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
