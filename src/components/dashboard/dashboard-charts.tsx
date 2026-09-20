import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BarChart3, CreditCard } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { fetchDashboardCharts } from "@/lib/dashboard-charts.query";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const colors: Record<string, string> = { pago: "#22c55e", pendente: "#3b82f6", atrasado: "#f59e0b" };
const cardClass = "rounded-xl border border-glass-border bg-surface-glass p-5 shadow-soft backdrop-blur-xl";

function EmptyChart({ message }: { message: string }) {
  return <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">{message}</div>;
}

export function DashboardCharts() {
  const query = useQuery({
    queryKey: ["dashboard-charts"],
    queryFn: fetchDashboardCharts,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  const data = query.data;
  const hasMonthlyData = Boolean(data?.monthly.some((item) => item.faturamento > 0 || item.vendas > 0));
  const hasPaymentData = Boolean(data?.payments.some((item) => item.value > 0));

  return (
    <main className="flex-1 px-5 pb-8 sm:px-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="size-5 text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">Análise financeira</h2>
          <span className="ml-auto text-xs text-muted-foreground">Últimos 6 meses · dados do sistema</span>
        </div>
        {query.isError ? (
          <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Não foi possível carregar os gráficos. Verifique sua sessão e tente novamente.</p>
        ) : null}
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,1fr)]">
          <article className={cardClass}>
            <div className="mb-4">
              <h3 className="font-display font-semibold text-foreground">Faturamento × Vendas</h3>
              <p className="mt-1 text-xs text-muted-foreground">Valores registrados por mês (R$)</p>
            </div>
            {query.isLoading ? <div className="h-64 animate-pulse rounded-lg bg-surface-strong" /> : !hasMonthlyData ? <EmptyChart message="Ainda não há faturamento ou vendas registrados neste período." /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data?.monthly ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(value: number) => `R$${value}`} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={58} />
                  <Tooltip formatter={(value) => currency.format(Number(value ?? 0))} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 10, color: "hsl(var(--popover-foreground))" }} />
                  <Legend />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="vendas" name="Vendas registradas" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </article>

          <article className={cardClass}>
            <div className="mb-4 flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <div>
                <h3 className="font-display font-semibold text-foreground">Status dos pagamentos</h3>
                <p className="mt-1 text-xs text-muted-foreground">Distribuição por valor (R$)</p>
              </div>
            </div>
            {query.isLoading ? <div className="h-64 animate-pulse rounded-lg bg-surface-strong" /> : !hasPaymentData ? <EmptyChart message="Nenhum pagamento registrado para exibir." /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data?.payments ?? []} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={3} stroke="none">
                    {(data?.payments ?? []).map((entry) => <Cell key={entry.key} fill={colors[entry.key] ?? "#64748b"} />)}
                  </Pie>
                  <Tooltip formatter={(value) => currency.format(Number(value ?? 0))} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 10, color: "hsl(var(--popover-foreground))" }} />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </article>
        </section>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><AlertCircle className="size-3.5" /> Vendas e faturamento são séries distintas; não devem ser somados como receita consolidada.</p>
      </div>
    </main>
  );
}
