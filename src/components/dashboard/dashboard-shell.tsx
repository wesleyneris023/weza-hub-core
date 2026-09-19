import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardContent } from "./dashboard-content";
import { fetchDashboardMetrics } from "@/lib/dashboard.query";

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
    </AppShell>
  );
}
