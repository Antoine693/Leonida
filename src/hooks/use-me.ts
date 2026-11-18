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
