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
