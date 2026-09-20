import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { fetchDashboardMetrics } from "@/lib/dashboard.query";
import { DashboardCharts } from "./dashboard-charts";
import { DashboardContent } from "./dashboard-content";
import { DashboardLiveTables } from "./dashboard-live-tables";

export function DashboardShell() {
  const metricsQuery = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: fetchDashboardMetrics,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });

  return (
    <AppShell>
      <DashboardContent
        metrics={metricsQuery.data}
        isLoading={metricsQuery.isLoading}
        hasError={metricsQuery.isError}
      />
      <DashboardCharts />
      <div className="flex-1 px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <DashboardLiveTables />
          <p className="mt-6 text-center text-[11px] text-subtle">WEZA HUB · Informações carregadas dos registros do sistema</p>
        </div>
      </div>
    </AppShell>
  );
}
