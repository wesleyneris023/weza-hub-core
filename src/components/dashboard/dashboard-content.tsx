import type { ComponentType } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe2,
  RefreshCcw,
  Users,
  Wrench,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/dashboard.query";

interface MetricCardProps {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  value: string;
  isLoading: boolean;
}

function MetricCard({ title, description, icon: Icon, value, isLoading }: MetricCardProps) {
  return (
    <article className="rounded-xl border border-glass-border bg-surface-glass p-5 shadow-soft backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 min-h-9 font-display text-2xl font-bold text-foreground sm:text-3xl" aria-live="polite">
        {isLoading ? <span className="inline-block h-8 w-16 animate-pulse rounded-md bg-surface-strong" aria-label="Carregando indicador" /> : value}
      </p>
      <p className="mt-1 text-xs text-subtle">{description}</p>
    </article>
  );
}

interface DashboardContentProps {
  metrics: DashboardMetrics | undefined;
  isLoading: boolean;
  hasError: boolean;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const count = (value?: number) => String(value ?? 0);
const money = (value?: number) => currency.format(value ?? 0);

export function DashboardContent({ metrics, isLoading, hasError }: DashboardContentProps) {
  const cards: MetricCardProps[] = [
    { title: "Clientes ativos", description: "Base de clientes", icon: Users, value: count(metrics?.clientesAtivos), isLoading },
    { title: "Sites ativos", description: "Websites cadastrados como ativos", icon: Globe2, value: count(metrics?.sitesAtivos), isLoading },
    { title: "Assinaturas ativas", description: "Contratos recorrentes em andamento", icon: RefreshCcw, value: count(metrics?.assinaturasAtivas), isLoading },
    { title: "Valor das assinaturas", description: "Soma dos valores contratados ativos", icon: CreditCard, value: money(metrics?.receitaMensal), isLoading },
    { title: "Pagamentos recebidos", description: `${count(metrics?.pagamentosRecebidos)} registros com status pago`, icon: CheckCircle2, value: money(metrics?.pagamentosRecebidosValor), isLoading },
    { title: "Pagamentos pendentes", description: `${count(metrics?.pagamentosPendentes)} registros aguardando pagamento`, icon: CalendarClock, value: money(metrics?.pagamentosPendentesValor), isLoading },
    { title: "Pagamentos atrasados", description: `${count(metrics?.pagamentosAtrasados)} registros em atraso`, icon: AlertCircle, value: money(metrics?.inadimplencia), isLoading },
    { title: "Faturamento do mês", description: "Lançamentos da competência atual, exceto cancelados", icon: FileText, value: money(metrics?.faturamentoMes), isLoading },
    { title: "Manutenções em aberto", description: "Solicitações abertas ou em andamento", icon: Wrench, value: count(metrics?.manutencoesAbertas), isLoading },
  ];

  const attentionItems = [
    { label: "Pagamentos em atraso", value: metrics?.pagamentosAtrasados ?? 0, detail: money(metrics?.inadimplencia) },
    { label: "Assinaturas vencendo em até 30 dias", value: metrics?.assinaturasVencendo30Dias ?? 0, detail: "Verifique os próximos vencimentos" },
    { label: "Websites suspensos", value: metrics?.sitesSuspensos ?? 0, detail: "Confira o status dos projetos" },
    { label: "Manutenções em aberto", value: metrics?.manutencoesAbertas ?? 0, detail: "Abertas ou em atendimento" },
  ].filter((item) => item.value > 0);

  return (
    <main id="main-content" className="flex-1 px-5 py-8 sm:px-7 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 animate-rise">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Painel de controle</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground sm:text-4xl">Visão geral da operação</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Acompanhe clientes, websites, serviços e indicadores financeiros da WEZA em um só lugar.
          </p>
        </div>

        <section aria-label="Indicadores da operação" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((item) => <MetricCard key={item.title} {...item} />)}
        </section>
        {hasError ? <p role="alert" className="mt-3 text-sm text-destructive">Não foi possível carregar os indicadores. Verifique sua sessão e tente novamente.</p> : null}

        <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
          <div className="rounded-xl border border-glass-border bg-surface-glass p-6 shadow-soft backdrop-blur-xl">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Pontos de atenção</h2>
              <p className="mt-1 text-sm text-muted-foreground">Pendências identificadas nos registros atuais.</p>
            </div>
            {isLoading ? (
              <div className="mt-5 space-y-3" aria-label="Carregando pendências">
                <div className="h-14 animate-pulse rounded-lg bg-surface-strong" />
                <div className="h-14 animate-pulse rounded-lg bg-surface-strong" />
              </div>
            ) : attentionItems.length ? (
              <div className="mt-5 space-y-3">
                {attentionItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-lg border border-glass-border bg-surface-soft px-4 py-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600">
                      <AlertCircle className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.detail}</p>
                    </div>
                    <span className="ml-auto font-display text-lg font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 flex min-h-28 items-center justify-center rounded-lg border border-dashed border-border bg-surface-soft px-5 text-center">
                <div>
                  <CheckCircle2 className="mx-auto size-6 text-emerald-500" />
                  <p className="mt-2 text-sm font-medium text-foreground">Nenhuma pendência identificada</p>
                  <p className="mt-1 text-xs text-muted-foreground">Não há ocorrências nos indicadores monitorados.</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-glass-border bg-surface-glass p-6 shadow-soft backdrop-blur-xl">
            <h2 className="font-display text-lg font-bold text-foreground">Resumo do WEZA HUB</h2>
            <p className="mt-1 text-sm text-muted-foreground">Visão consolidada dos módulos conectados.</p>
            <div className="mt-5 space-y-3">
              {[
                { label: "Gestão comercial", detail: "Clientes e websites", status: "Conectado" },
                { label: "Serviços digitais", detail: "Assinaturas e manutenção", status: "Conectado" },
                { label: "Financeiro", detail: "Pagamentos e faturamento", status: "Conectado" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-glass-border bg-surface-soft px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-xs font-medium text-emerald-600">{item.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="mt-6 text-center text-xs text-subtle">WEZA HUB · Indicadores atualizados a partir dos registros do sistema</p>
      </div>
    </main>
  );
}
