import { supabase } from "@/integrations/supabase/client";

export interface DashboardMetrics {
  clientesAtivos: number;
  sitesAtivos: number;
  assinaturasAtivas: number;
  receitaMensal: number;
  manutencoesAbertas: number;
  pagamentosPendentes: number;
  pagamentosPendentesValor: number;
  pagamentosRecebidos: number;
  pagamentosRecebidosValor: number;
  pagamentosAtrasados: number;
  faturamentoMes: number;
  mrr: number;
  inadimplencia: number;
  sitesSuspensos: number;
  assinaturasVencendo30Dias: number;
}

interface AmountRow {
  valor: number | string;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthRange(): { start: string; endExclusive: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: formatLocalDate(start), endExclusive: formatLocalDate(end) };
}

function dateFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function sumAmounts(rows: AmountRow[] | null): number {
  return (rows ?? []).reduce((sum, item) => sum + Number(item.valor || 0), 0);
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Sua sessão expirou. Entre novamente para carregar o painel.");
  }

  const { start: monthStart, endExclusive: nextMonthStart } = monthRange();
  const today = formatLocalDate(new Date());
  const in30Days = dateFromNow(30);

  const [clientes, sites, assinaturas, manutencoes, naoPagos, recebidos, faturamento, suspensos, vencendo] =
    await Promise.all([
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("websites").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("assinaturas").select("valor, planos(periodo_cobranca)").eq("status", "ativa"),
      supabase.from("manutencoes").select("id", { count: "exact", head: true }).in("status", ["aberta", "em_andamento"]),
      supabase.from("pagamentos").select("valor, data_vencimento, status").in("status", ["pendente", "atrasado"]),
      supabase.from("pagamentos").select("valor").eq("status", "pago"),
      supabase.from("faturamentos").select("valor").gte("competencia", monthStart)
        .lt("competencia", nextMonthStart).neq("status", "cancelado"),
      supabase.from("websites").select("id", { count: "exact", head: true }).eq("status", "suspenso"),
      supabase.from("assinaturas").select("id", { count: "exact", head: true })
        .eq("status", "ativa").gte("proximo_vencimento", today).lte("proximo_vencimento", in30Days),
    ]);

  const queryError = [clientes, sites, assinaturas, manutencoes, naoPagos, recebidos, faturamento, suspensos, vencendo]
    .map((result) => result.error)
    .find((error) => error !== null);
  if (queryError) {
    throw new Error(`Não foi possível carregar os indicadores: ${queryError.message}`);
  }

  const activeSubscriptions = (assinaturas.data ?? []) as Array<{
    valor: number | string;
    planos: { periodo_cobranca: "mensal" | "anual" } | null;
  }>;
  // Normaliza cobranças anuais para equivalência mensal (MRR).
  const receitaMensal = activeSubscriptions.reduce((total, item) => {
    const amount = Number(item.valor || 0);
    return total + (item.planos?.periodo_cobranca === "anual" ? amount / 12 : amount);
  }, 0);

  const paymentRows = (naoPagos.data ?? []) as Array<AmountRow & {
    data_vencimento: string;
    status: "pendente" | "atrasado";
  }>;
  const overdueRows = paymentRows.filter((payment) => payment.status === "atrasado" || payment.data_vencimento < today);
  const openRows = paymentRows.filter((payment) => payment.status === "pendente" && payment.data_vencimento >= today);
  const receivedRows = (recebidos.data ?? []) as AmountRow[];
  const invoiceRows = (faturamento.data ?? []) as AmountRow[];

  return {
    clientesAtivos: clientes.count ?? 0,
    sitesAtivos: sites.count ?? 0,
    assinaturasAtivas: activeSubscriptions.length,
    receitaMensal,
    manutencoesAbertas: manutencoes.count ?? 0,
    pagamentosPendentes: openRows.length,
    pagamentosPendentesValor: sumAmounts(openRows),
    pagamentosRecebidos: receivedRows.length,
    pagamentosRecebidosValor: sumAmounts(receivedRows),
    pagamentosAtrasados: overdueRows.length,
    faturamentoMes: sumAmounts(invoiceRows),
    mrr: receitaMensal,
    inadimplencia: sumAmounts(overdueRows),
    sitesSuspensos: suspensos.count ?? 0,
    assinaturasVencendo30Dias: vencendo.count ?? 0,
  };
}
