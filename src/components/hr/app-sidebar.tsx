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
