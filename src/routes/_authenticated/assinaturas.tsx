import { createFileRoute } from "@tanstack/react-router";
import { AssinaturasPage } from "@/components/assinaturas/assinaturas-page";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/assinaturas")({
  head: () => ({ meta: [
    { title: "Assinaturas — WEZA HUB" },
    { name: "description", content: "Gestão de planos, assinaturas e vencimentos no WEZA HUB." },
  ] }),
  component: () => <AppShell><AssinaturasPage /></AppShell>,
});
