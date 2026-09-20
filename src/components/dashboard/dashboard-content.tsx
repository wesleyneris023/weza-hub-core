import type { ComponentType } from "react";
import { CalendarDays, CreditCard, Globe2, Users, Wrench } from "lucide-react";
import type { DashboardMetrics } from "@/lib/dashboard.query";

interface MetricCardProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  value: string;
  isLoading: boolean;
  accent: string;
}

function MetricCard({ title, description, icon: Icon, value, isLoading, accent }: MetricCardProps) {
  return (
    <article className={`group flex min-h-[112px] items-center gap-4 rounded-xl border border-glass-border bg-surface-glass p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:p-5`}>
      <span className={`grid size-14 shrink-0 place-items-center rounded-xl ${accent}`}><Icon className="size-6" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground sm:text-sm">{title}</p>
        <p className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl" aria-live="polite">
          {isLoading ? <span className="inline-block h-8 w-20 animate-pulse rounded-md bg-surface-strong" aria-label="Carregando indicador" /> : value}
        </p>
        <p className="mt-1 truncate text-[11px] text-subtle sm:text-xs">{description}</p>
      </div>
    </article>
  );
}

interface DashboardContentProps {
  metrics: DashboardMetrics | undefined;
  isLoading: boolean;
  hasError: boolean;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const count = (value?: number) => String(value ?? 0);
const money = (value?: number) => currency.format(value ?? 0);

export function DashboardContent({ metrics, isLoading, hasError }: DashboardContentProps) {
  const today = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }).format(new Date());
  const cards: MetricCardProps[] = [
    { title: "Clientes", description: "Clientes ativos", icon: Users, value: count(metrics?.clientesAtivos), isLoading, accent: "bg-blue-500/15 text-blue-400" },
    { title: "Websites", description: "Sites ativos na carteira", icon: Globe2, value: count(metrics?.sitesAtivos), isLoading, accent: "bg-indigo-500/15 text-indigo-400" },
    { title: "Receita recorrente", description: "Equivalência mensal das assinaturas ativas", icon: CreditCard, value: money(metrics?.receitaMensal), isLoading, accent: "bg-emerald-500/15 text-emerald-400" },
    { title: "Manutenções", description: `${count(metrics?.manutencoesAbertas)} em aberto ou em andamento`, icon: Wrench, value: count(metrics?.manutencoesAbertas), isLoading, accent: "bg-violet-500/15 text-violet-400" },
  ];

  return (
    <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Painel de controle · WEZA HUB</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Olá, seja bem-vindo! <span aria-hidden="true">👋</span></h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">Aqui está um resumo da operação do seu negócio.</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg border border-glass-border bg-surface-glass px-3 py-2 text-xs text-muted-foreground xl:self-auto">
            <CalendarDays className="size-4 text-primary" /><span className="capitalize">{today}</span>
          </div>
        </div>

        <section aria-label="Indicadores principais" className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {cards.map((item) => <MetricCard key={item.title} {...item} />)}
        </section>
        {hasError ? <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Não foi possível carregar os indicadores. Verifique sua sessão e tente novamente.</p> : null}
      </div>
    </main>
  );
}
