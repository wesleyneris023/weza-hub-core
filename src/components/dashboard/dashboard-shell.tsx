import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AppSidebar } from "./app-sidebar";
import { DashboardContent } from "./dashboard-content";
import { fetchDashboardMetrics } from "@/lib/dashboard.query";

export function DashboardShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const metricsQuery = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
    staleTime: 60_000,
    retry: false,
  });

  return (
    <div className="app-background relative min-h-screen overflow-hidden bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Pular para o conteúdo
      </a>
      <div className="relative z-10 flex min-h-screen">
        <AppSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-glass-border bg-header-glass px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)} aria-label="Abrir menu" className="lg:hidden">
              <Menu />
            </Button>
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="grid size-8 place-items-center rounded-lg bg-brand-gradient font-display font-bold text-brand-foreground">W</div>
              <span className="font-display font-bold">WEZA HUB</span>
            </div>
            <div className="hidden max-w-md flex-1 items-center gap-2 rounded-lg border border-glass-border bg-surface-soft px-3 py-2 text-muted-foreground sm:flex">
              <Search className="size-4" />
              <span className="text-sm">Buscar no WEZA HUB</span>
              <span className="ml-auto text-[10px] text-subtle">Em breve</span>
            </div>
            <div className="ml-auto grid size-9 place-items-center rounded-full border border-glass-border bg-surface-strong font-display text-sm font-semibold text-foreground shadow-soft" aria-label="Perfil do usuário">
              W
            </div>
          </header>
          <DashboardContent metrics={metricsQuery.data} isLoading={metricsQuery.isLoading} hasError={metricsQuery.isError} />
        </div>
      </div>
    </div>
  );
}