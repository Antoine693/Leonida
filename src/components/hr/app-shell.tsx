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
