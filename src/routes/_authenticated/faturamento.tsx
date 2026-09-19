import { createFileRoute } from "@tanstack/react-router";
import { FaturamentoPage } from "@/components/faturamento/faturamento-page";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/faturamento")({
  head: () => ({ meta: [
    { title: "Faturamento — WEZA HUB" },
    { name: "description", content: "Gestão de faturamentos e competências no WEZA HUB." },
  ] }),
  component: () => <AppShell><FaturamentoPage /></AppShell>,
});
