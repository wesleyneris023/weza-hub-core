import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, Search, UserRound, X } from "lucide-react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export interface AppShellProps {
  children: ReactNode;
}

const searchablePages = [
  { label: "Dashboard", description: "Visão geral do WEZA HUB", to: "/dashboard" },
  { label: "Clientes", description: "Cadastro e relacionamento com clientes", to: "/clientes" },
  { label: "Websites", description: "Projetos, domínios e vencimentos", to: "/websites" },
  { label: "Vendas", description: "Vendas e serviços comercializados", to: "/vendas" },
  { label: "Assinaturas", description: "Planos, recorrências e vencimentos", to: "/assinaturas" },
  { label: "Pagamentos", description: "Recebimentos e pagamentos", to: "/pagamentos" },
  { label: "Manutenção", description: "Solicitações e atendimentos", to: "/manutencao" },
  { label: "Faturamento", description: "Competências e valores faturados", to: "/faturamento" },
] as const;

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("Minha conta");
  const [profileEmail, setProfileEmail] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted || !data.user) return;
      const user = data.user;
      const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.name;
      setProfileName(typeof metadataName === "string" && metadataName.trim()
        ? metadataName
        : user.email?.split("@")[0] || "Minha conta");
      setProfileEmail(user.email ?? "");
    });
    return () => { mounted = false; };
  }, []);

  const filteredPages = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return searchablePages;
    return searchablePages.filter((page) =>
      `${page.label} ${page.description}`.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [search]);

  async function handleSignOut() {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);
    if (!error) window.location.assign("/Auth");
  }

  const profileInitial = profileName.trim().charAt(0).toLocaleUpperCase("pt-BR") || "W";

  return (
    <div className="app-background relative min-h-screen overflow-hidden bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <div className="relative z-10 flex min-h-screen">
        <AppSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-glass-border bg-header-glass px-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              className="lg:hidden"
            >
              <Menu />
            </Button>
            <div className="relative hidden max-w-md flex-1 sm:block">
              <div className="flex items-center gap-2.5 rounded-lg border border-glass-border bg-surface-soft px-3 py-2 text-muted-foreground focus-within:ring-2 focus-within:ring-primary/30">
                <Search className="size-4 shrink-0" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setSearchOpen(false);
                  }}
                  placeholder="Buscar módulos e páginas"
                  aria-label="Buscar módulos e páginas no WEZA HUB"
                  aria-expanded={searchOpen}
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(true);
                    }}
                    aria-label="Limpar busca"
                    className="rounded p-0.5 hover:bg-surface-strong"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
              {searchOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Fechar resultados da busca"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setSearchOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-glass-border bg-background p-1.5 shadow-xl">
                    <p className="px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {search.trim() ? "Resultados" : "Acesso rápido"}
                    </p>
                    {filteredPages.length ? filteredPages.map((page) => (
                      <Link
                        key={page.to}
                        to={page.to}
                        onClick={() => {
                          setSearchOpen(false);
                          setSearch("");
                        }}
                        className="block rounded-lg px-2.5 py-2.5 transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span className="block text-sm font-medium text-foreground">{page.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{page.description}</span>
                      </Link>
                    )) : (
                      <p className="px-2.5 py-4 text-sm text-muted-foreground">Nenhum módulo encontrado.</p>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2.5 lg:hidden">
              <div className="grid size-8 place-items-center rounded-lg bg-brand-gradient font-display font-bold text-brand-foreground">
                W
              </div>
              <span className="font-display font-bold">WEZA HUB</span>
            </div>

            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-label="Abrir opções do perfil"
                aria-expanded={profileOpen}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-primary/40 bg-brand-gradient font-display text-lg font-semibold text-brand-foreground shadow-soft">
                  {profileInitial}
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block max-w-36 truncate text-sm font-semibold text-foreground">{profileName}</span>
                  <span className="block text-xs text-muted-foreground">Minha conta</span>
                </span>
                <ChevronDown className={`hidden size-4 text-muted-foreground transition-transform sm:block ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Fechar menu do perfil"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-30 mt-2 w-72 overflow-hidden rounded-xl border border-glass-border bg-background shadow-xl">
                    <div className="border-b border-glass-border px-4 py-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <UserRound className="size-4 text-primary" />
                        Meu perfil
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{profileEmail || "Conta autenticada"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-surface-soft hover:text-foreground disabled:opacity-50"
                    >
                      <LogOut className="size-4" />
                      {signingOut ? "Saindo..." : "Sair da conta"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
