import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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

function firstDayOfMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export const getDashboardMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardMetrics> => {
    const monthStart = firstDayOfMonth();
    const [clientes, sites, assinaturas, manutencoes, pendentes, atrasados, faturamento] =
      await Promise.all([
        context.supabase.from("clientes").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        context.supabase.from("websites").select("id", { count: "exact", head: true }).eq("status", "ativo"),
        context.supabase.from("assinaturas").select("valor").eq("status", "ativa"),
        context.supabase.from("manutencoes").select("id", { count: "exact", head: true }).in("status", ["aberta", "em_andamento"]),
        context.supabase.from("pagamentos").select("id", { count: "exact", head: true }).eq("status", "pendente"),
        context.supabase.from("pagamentos").select("valor").eq("status", "atrasado"),
        context.supabase.from("faturamentos").select("valor").gte("competencia", monthStart).neq("status", "cancelado"),
      ]);

    const error = [clientes, sites, assinaturas, manutencoes, pendentes, atrasados, faturamento]
      .map((result) => result.error)
      .find(Boolean);
    if (error) throw new Error(`Não foi possível carregar os indicadores: ${error.message}`);

    const receitaMensal = (assinaturas.data ?? []).reduce((sum, item) => sum + Number(item.valor), 0);
    const inadimplencia = (atrasados.data ?? []).reduce((sum, item) => sum + Number(item.valor), 0);
    const faturamentoMes = (faturamento.data ?? []).reduce((sum, item) => sum + Number(item.valor), 0);
    const { count: sitesSuspensos, error: sitesSuspensosError } = await context.supabase
      .from("websites")
      .select("id", { count: "exact", head: true })
      .eq("status", "suspenso");
    if (sitesSuspensosError) throw new Error(`Não foi possível carregar os indicadores: ${sitesSuspensosError.message}`);

    return {
      clientesAtivos: clientes.count ?? 0,
      sitesAtivos: sites.count ?? 0,
      assinaturasAtivas: assinaturas.data?.length ?? 0,
      receitaMensal,
      manutencoesAbertas: manutencoes.count ?? 0,
      pagamentosPendentes: pendentes.count ?? 0,
      pagamentosAtrasados: atrasados.data?.length ?? 0,
      faturamentoMes,
      mrr: receitaMensal,
      inadimplencia,
      sitesSuspensos: sitesSuspensos ?? 0,
    };
  });
