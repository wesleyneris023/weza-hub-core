import { supabase } from "@/integrations/supabase/client";

export interface DashboardMetrics {
  clientesAtivos: number;
  sitesAtivos: number;
  assinaturasAtivas: number;
  receitaMensal: number;
  manutencoesAbertas: number;
  pagamentosPendentes: number;
  pagamentosAtrasados: number;
  faturamentoMes: number;
  mrr: number;
  inadimplencia: number;
  sitesSuspensos: number;
}

interface AmountRow {
  valor: number;
}

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

function sumAmounts(rows: AmountRow[] | null): number {
  return (rows ?? []).reduce((sum, item) => sum + Number(item.valor), 0);
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    throw new Error("Sua sessão expirou. Entre novamente para carregar o painel.");
  }

  const monthStart = firstDayOfMonth();
  const [clientes, sites, assinaturas, manutencoes, pendentes, atrasados, faturamento, suspensos] =
    await Promise.all([
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("websites").select("id", { count: "exact", head: true }).eq("status", "ativo"),
      supabase.from("assinaturas").select("valor").eq("status", "ativa"),
      supabase.from("manutencoes").select("id", { count: "exact", head: true }).in("status", ["aberta", "em_andamento"]),
      supabase.from("pagamentos").select("id", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("pagamentos").select("valor").eq("status", "atrasado"),
      supabase.from("faturamentos").select("valor").gte("competencia", monthStart).neq("status", "cancelado"),
      supabase.from("websites").select("id", { count: "exact", head: true }).eq("status", "suspenso"),
    ]);

  const queryError = [clientes, sites, assinaturas, manutencoes, pendentes, atrasados, faturamento, suspensos]
    .map((result) => result.error)
    .find((error) => error !== null);
  if (queryError) {
    throw new Error(`Não foi possível carregar os indicadores: ${queryError.message}`);
  }

  const receitaMensal = sumAmounts(assinaturas.data);
  const inadimplencia = sumAmounts(atrasados.data);

  return {
    clientesAtivos: clientes.count ?? 0,
    sitesAtivos: sites.count ?? 0,
    assinaturasAtivas: assinaturas.data?.length ?? 0,
    receitaMensal,
    manutencoesAbertas: manutencoes.count ?? 0,
    pagamentosPendentes: pendentes.count ?? 0,
    pagamentosAtrasados: atrasados.data?.length ?? 0,
    faturamentoMes: sumAmounts(faturamento.data),
    mrr: receitaMensal,
    inadimplencia,
    sitesSuspensos: suspensos.count ?? 0,
  };
}