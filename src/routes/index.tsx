import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WEZA HUB" },
      { name: "description", content: "Central de gestão de clientes, websites e serviços digitais do WEZA HUB." },
      { property: "og:title", content: "Dashboard — WEZA HUB" },
      { property: "og:description", content: "Central de gestão de clientes, websites e serviços digitais do WEZA HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <DashboardShell />;
}
