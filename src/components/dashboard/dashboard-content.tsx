import type { ComponentType } from "react";
import { CreditCard, Globe2, RefreshCcw, Users } from "lucide-react";

interface MetricPlaceholderProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

const placeholders: MetricPlaceholderProps[] = [
  { title: "Clientes ativos", description: "Base de clientes", icon: Users },
  { title: "Sites online", description: "Projetos publicados", icon: Globe2 },
  { title: "Receita recorrente", description: "Assinaturas ativas", icon: CreditCard },
  { title: "Manutenção", description: "Serviços em andamento", icon: RefreshCcw },
];

function MetricPlaceholder({ title, description, icon: Icon }: MetricPlaceholderProps) {
  return (
    <article className="rounded-xl border border-glass-border bg-surface-glass p-5 shadow-soft backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-foreground" aria-label="Valor ainda não disponível">—</p>
      <p className="mt-1 text-xs text-subtle">{description}</p>
    </article>
  );
}

export function DashboardContent() {
  return (
    <main id="main-content" className="flex-1 px-5 py-8 sm:px-7 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Painel de controle</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">Visão geral da operação</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Sua central para organizar clientes, websites e serviços digitais.
          </p>
        </div>

        <section aria-label="Indicadores preparados" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {placeholders.map((item) => <MetricPlaceholder key={item.title} {...item} />)}
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
          <div className="min-h-72 rounded-xl border border-glass-border bg-surface-glass p-6 shadow-soft backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold text-foreground">Atividade recente</h2>
                <p className="mt-1 text-sm text-muted-foreground">As movimentações aparecerão aqui.</p>
              </div>
            </div>
            <div className="mt-10 flex min-h-36 items-center justify-center rounded-lg border border-dashed border-border bg-surface-soft px-6 text-center">
              <div>
                <p className="text-sm font-medium text-foreground">Nenhuma atividade registrada</p>
                <p className="mt-1 text-xs text-muted-foreground">Este espaço será atualizado quando os módulos estiverem conectados.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-glass-border bg-surface-glass p-6 shadow-soft backdrop-blur-xl">
            <h2 className="font-display text-lg font-bold text-foreground">Módulos</h2>
            <p className="mt-1 text-sm text-muted-foreground">Estrutura pronta para evolução.</p>
            <div className="mt-6 space-y-3">
              {["Gestão comercial", "Serviços digitais", "Financeiro"].map((label) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface-soft px-4 py-3">
                  <span className="size-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">Preparado</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-subtle">WEZA HUB · Estrutura inicial</p>
      </div>
    </main>
  );
}