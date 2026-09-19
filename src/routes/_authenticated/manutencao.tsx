import { createFileRoute } from "@tanstack/react-router";
import { ManutencoesPage } from "@/components/manutencoes/manutencoes-page";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/manutencao")({
  head: () => ({ meta: [
    { title: "Manutenção — WEZA HUB" },
    { name: "description", content: "Gestão de solicitações e serviços de manutenção dos websites no WEZA HUB." },
  ] }),
  component: () => <AppShell><ManutencoesPage /></AppShell>,
});
