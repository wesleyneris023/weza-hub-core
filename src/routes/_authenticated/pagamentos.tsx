import { createFileRoute } from "@tanstack/react-router";
import { PagamentosPage } from "@/components/pagamentos/pagamentos-page";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/pagamentos")({
  head: () => ({ meta: [
    { title: "Pagamentos — WEZA HUB" },
    { name: "description", content: "Gestão de recebimentos e vencimentos no WEZA HUB." },
  ] }),
  component: () => <AppShell><PagamentosPage /></AppShell>,
});
