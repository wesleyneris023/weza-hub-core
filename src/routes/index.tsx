import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "WEZA HUB — Área administrativa" },
      { name: "description", content: "Acesso à central de gestão do WEZA HUB." },
      { property: "og:title", content: "WEZA HUB — Área administrativa" },
      { property: "og:description", content: "Acesso à central de gestão do WEZA HUB." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});