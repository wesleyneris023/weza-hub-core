import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

type Row = { valor: number | string; competencia?: string; data_venda?: string; status?: string; data_vencimento?: string };
export interface MonthlyChartPoint { month: string; faturamento: number; vendas: number }
export interface PaymentChartPoint { name: string; value: number; key: string }
export interface DashboardChartsData { monthly: MonthlyChartPoint[]; payments: PaymentChartPoint[] }

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function monthKey(date: Date): string { return dateKey(date).slice(0, 7); }
function money(value: number | string): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }

export async function fetchDashboardCharts(): Promise<DashboardChartsData> {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const start = dateKey(firstMonth);
  const end = dateKey(nextMonth);
  const today = dateKey(now);

  const [billingResult, salesResult, paymentResult] = await Promise.all([
    db.from("faturamentos").select("valor, competencia, status")
      .gte("competencia", start).lt("competencia", end).neq("status", "cancelado"),
    db.from("vendas").select("valor, data_venda")
      .gte("data_venda", start).lt("data_venda", end),
    db.from("pagamentos").select("valor, status, data_vencimento"),
  ]);
  const error = [billingResult, salesResult, paymentResult].find((result) => result.error)?.error;
  if (error) throw new Error(`Não foi possível carregar os gráficos: ${error.message}`);

  const monthly: MonthlyChartPoint[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = monthKey(date);
    return {
      month: new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date).replace(".", ""),
      faturamento: ((billingResult.data ?? []) as Row[]).filter((row) => row.competencia?.slice(0, 7) === key).reduce((sum, row) => sum + money(row.valor), 0),
      vendas: ((salesResult.data ?? []) as Row[]).filter((row) => row.data_venda?.slice(0, 7) === key).reduce((sum, row) => sum + money(row.valor), 0),
    };
  });

  const paymentRows = (paymentResult.data ?? []) as Row[];
  const paid = paymentRows.filter((row) => row.status === "pago");
  const overdue = paymentRows.filter((row) => row.status === "atrasado" || ((row.status === "pendente") && Boolean(row.data_vencimento) && row.data_vencimento! < today));
  const pending = paymentRows.filter((row) => row.status === "pendente" && (!row.data_vencimento || row.data_vencimento >= today));
  const payments: PaymentChartPoint[] = [
    { key: "pago", name: "Recebidos", value: paid.reduce((sum, row) => sum + money(row.valor), 0) },
    { key: "pendente", name: "Pendentes", value: pending.reduce((sum, row) => sum + money(row.valor), 0) },
    { key: "atrasado", name: "Atrasados", value: overdue.reduce((sum, row) => sum + money(row.valor), 0) },
  ];
  return { monthly, payments };
}
