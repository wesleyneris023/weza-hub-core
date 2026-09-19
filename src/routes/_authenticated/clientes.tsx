import { createFileRoute } from "@tanstack/react-router";

import { ClientesPage } from "@/components/clientes/clientes-page";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — WEZA HUB" },
      { name: "description", content: "Gestão administrativa de clientes e projetos no WEZA HUB." },
      { property: "og:title", content: "Clientes — WEZA HUB" },
      {
        property: "og:description",
        content: "Gestão administrativa de clientes e projetos no WEZA HUB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientesPage />
    </AppShell>
  ),
});
