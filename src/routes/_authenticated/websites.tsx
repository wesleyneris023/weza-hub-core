import { createFileRoute } from "@tanstack/react-router";

import { WebsitesPage } from "@/components/websites/websites-page";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated/websites")({
  head: () => ({
    meta: [
      { title: "Websites — WEZA HUB" },
      { name: "description", content: "Gestão de websites, domínios e vencimentos no WEZA HUB." },
      { property: "og:title", content: "Websites — WEZA HUB" },
      { property: "og:description", content: "Gestão de websites, domínios e vencimentos no WEZA HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <WebsitesPage />
    </AppShell>
  ),
});
