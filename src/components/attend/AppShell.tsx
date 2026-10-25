import type { ReactNode } from "react";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppHeader } from "@/components/attend/AppHeader";
import { InsightsPanel } from "@/components/attend/InsightsPanel";
import { SideNav } from "@/components/attend/SideNav";
import { useUi } from "@/lib/attend/ui";

export function AppShell({ children }: { children: ReactNode }) {
  const ui = useUi();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <AppHeader />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:block">
          <SideNav />
        </aside>

        <Sheet open={ui.navOpen} onOpenChange={ui.setNavOpen}>
          <SheetContent side="left" className="w-72 bg-sidebar p-0">
            <SideNav onNavigate={() => ui.setNavOpen(false)} />
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>

        {ui.panelOpen && (
          <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-sidebar xl:block">
            <InsightsPanel />
          </aside>
        )}
      </div>
    </div>
  );
}
