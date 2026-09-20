import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BarChart3, CreditCard, TrendingUp } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { fetchDashboardCharts } from "@/lib/dashboard-charts.query";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const compactCurrency = (value: number) => value >= 1000 ? `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : `R$ ${value}`;
const colors: Record<string, string> = { pago: "#10b981", pendente: "#2563eb", atrasado: "#f59e0b" };
const cardClass = "min-w-0 rounded-xl border border-blue-900/60 bg-[#081a31]/90 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] sm:p-5";
const chartGrid = "#17304e";
const axisStyle = { fill: "#9bb3d0", fontSize: 11 };
const tooltipStyle = { background: "#07162a", border: "1px solid #24466d", borderRadius: 10, color: "#e5efff" };

function EmptyChart({ message }: { message: string }) {
  return <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-blue-900/70 px-4 text-center text-sm text-slate-400">{message}</div>;
}

function ChartHeading({ icon: Icon, title, subtitle }: { icon: typeof BarChart3; title: string; subtitle?: string }) {
  return <div className="mb-3 flex items-center gap-2"><Icon className="size-4 shrink-0 text-blue-400" /><div><h3 className="text-sm font-semibold text-slate-100 sm:text-base">{title}</h3>{subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}</div></div>;
}

export function DashboardCharts() {
  const query = useQuery({ queryKey: ["dashboard-charts"], queryFn: fetchDashboardCharts, staleTime: 30_000, refetchInterval: 60_000, refetchOnWindowFocus: true, retry: false });
  const data = query.data;
  const hasMonthlyData = Boolean(data?.monthly.some((item) => item.faturamento > 0 || item.vendas > 0));
  const paymentTotal = data?.payments.reduce((sum, item) => sum + item.value, 0) ?? 0;
  const hasPaymentData = paymentTotal > 0;

  return (
    <section className="flex-1 px-4 pb-5 sm:px-6 lg:px-7" aria-label="Análises e gráficos do Dashboard">
      <div className="w-full">
        <div className="mb-3 flex items-center gap-2"><BarChart3 className="size-5 text-blue-400" /><h2 className="text-lg font-bold text-slate-100 sm:text-xl">Análise financeira</h2><span className="ml-auto hidden text-xs text-slate-400 sm:inline">Últimos 6 meses · dados do sistema</span></div>
        {query.isError && <p role="alert" className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">Não foi possível carregar os gráficos. Verifique sua sessão e tente novamente.</p>}
        <div className="grid min-w-0 gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)]">
          <article className={cardClass}>
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-100 sm:text-base">Receita nos últimos 6 meses</h3><p className="mt-0.5 text-xs text-slate-400">Faturamento e vendas registradas (R$)</p></div><span className="rounded-md border border-blue-900/70 px-2.5 py-1 text-[11px] text-blue-200">Últimos 6 meses</span></div>
            {query.isLoading ? <div className="h-56 animate-pulse rounded-lg bg-slate-800/70" /> : !hasMonthlyData ? <EmptyChart message="Ainda não há faturamento ou vendas registrados neste período." /> : (
              <ResponsiveContainer width="100%" height={245}>
                <ComposedChart data={data?.monthly ?? []} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                  <XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: "#315071" }} tickLine={false} />
                  <YAxis tickFormatter={compactCurrency} tick={axisStyle} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(value) => currency.format(Number(value ?? 0))} contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ color: "#c6d7ee", fontSize: 12 }} />
                  <Bar dataKey="faturamento" name="Faturamento" fill="#1769ed" radius={[3, 3, 0, 0]} maxBarSize={34} />
                  <Line dataKey="vendas" name="Vendas" type="monotone" stroke="#e5efff" strokeWidth={2} dot={{ r: 3, fill: "#e5efff" }} activeDot={{ r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </article>
          <article className={cardClass}>
            <ChartHeading icon={CreditCard} title="Status dos pagamentos" subtitle="Distribuição por valor (R$)" />
            {query.isLoading ? <div className="h-56 animate-pulse rounded-lg bg-slate-800/70" /> : !hasPaymentData ? <EmptyChart message="Nenhum pagamento registrado para exibir." /> : (
              <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(130px,0.9fr)_minmax(130px,1fr)]">
                <div className="relative min-w-0"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={data?.payments ?? []} dataKey="value" nameKey="name" innerRadius={53} outerRadius={78} paddingAngle={3} stroke="none">{(data?.payments ?? []).map((entry) => <Cell key={entry.key} fill={colors[entry.key] ?? "#64748b"} />)}</Pie><Tooltip formatter={(value) => currency.format(Number(value ?? 0))} contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-bold text-slate-100">{currency.format(paymentTotal)}</span><span className="text-[10px] text-slate-400">Total</span></div></div>
                <div className="space-y-3">{(data?.payments ?? []).map((item) => <div key={item.key} className="flex items-center gap-2 text-xs"><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[item.key] ?? "#64748b" }} /><span className="min-w-0 flex-1 text-slate-300">{item.name}</span><span className="font-semibold text-slate-100">{currency.format(item.value)}</span></div>)}</div>
              </div>
            )}
          </article>
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <article className={cardClass}>
            <div className="mb-2 flex items-center justify-between gap-2"><ChartHeading icon={TrendingUp} title="Vendas por mês" subtitle="Valores registrados em vendas (R$)" /><span className="rounded-md border border-blue-900/70 px-2.5 py-1 text-[11px] text-blue-200">6 meses</span></div>
            {query.isLoading ? <div className="h-48 animate-pulse rounded-lg bg-slate-800/70" /> : !data?.monthly.some((item) => item.vendas > 0) ? <EmptyChart message="Ainda não há vendas registradas neste período." /> : <ResponsiveContainer width="100%" height={205}><BarChart data={data?.monthly ?? []} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} /><XAxis dataKey="month" tick={axisStyle} axisLine={{ stroke: "#315071" }} tickLine={false} /><YAxis tickFormatter={compactCurrency} tick={axisStyle} axisLine={false} tickLine={false} width={70} /><Tooltip formatter={(value) => currency.format(Number(value ?? 0))} contentStyle={tooltipStyle} /><Bar dataKey="vendas" name="Vendas" fill="#1769ed" radius={[4, 4, 0, 0]} maxBarSize={42} /></BarChart></ResponsiveContainer>}
          </article>
          <article className={`${cardClass} flex flex-col justify-center`}>
            <ChartHeading icon={BarChart3} title="Visão do período" subtitle="Resumo dos últimos 6 meses" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-blue-900/60 bg-[#0b2340] p-4"><p className="text-xs text-slate-400">Faturamento no período</p><p className="mt-2 text-xl font-bold text-slate-100">{currency.format(data?.monthly.reduce((sum, item) => sum + item.faturamento, 0) ?? 0)}</p></div>
              <div className="rounded-lg border border-blue-900/60 bg-[#0b2340] p-4"><p className="text-xs text-slate-400">Vendas registradas no período</p><p className="mt-2 text-xl font-bold text-slate-100">{currency.format(data?.monthly.reduce((sum, item) => sum + item.vendas, 0) ?? 0)}</p></div>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">Faturamento e vendas são indicadores distintos. Os valores são exibidos separadamente para evitar dupla contagem de receita.</p>
          </article>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500"><AlertCircle className="size-3.5" /> Os gráficos usam registros existentes do Supabase; categorias sem dados não são preenchidas artificialmente.</p>
      </div>
    </section>
  );
}
