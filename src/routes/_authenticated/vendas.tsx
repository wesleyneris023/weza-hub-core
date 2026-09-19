import { createFileRoute } from "@tanstack/react-router";
import { VendasPage } from "@/components/vendas/vendas-page";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/vendas")({
  head: () => ({ meta: [
    { title: "Vendas — WEZA HUB" },
    { name: "description", content: "Gestão comercial de vendas e propostas no WEZA HUB." },
  ] }),
  component: () => <AppShell><VendasPage /></AppShell>,
});
