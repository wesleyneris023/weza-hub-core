import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, CalendarClock, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

type ClientRow = { id: string; nome: string; empresa: string | null; status: string; created_at: string };
type BillingRow = { id: string; valor: number | string; data_vencimento: string; status: string; clientes: { nome: string } | { nome: string }[] | null };

function localDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) return "—";
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function StatusPill({ status }: { status: string }) {
  const overdue = status === "atrasado";
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold ${overdue ? "bg-rose-500/15 text-rose-400" : status === "pago" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-300"}`}>{status.replaceAll("_", " ")}</span>;
}

const panel = "overflow-hidden rounded-xl border border-glass-border bg-surface-glass shadow-soft backdrop-blur-xl";
const th = "px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";
const td = "px-3 py-3 text-xs text-foreground";

export function DashboardLiveTables() {
  const clientsQuery = useQuery({
    queryKey: ["dashboard-recent-clients"],
    queryFn: async () => {
      const { data, error } = await db.from("clientes").select("id,nome,empresa,status,created_at").order("created_at", { ascending: false }).limit(5);
      if (error) throw error;
      return (data ?? []) as ClientRow[];
    }, staleTime: 60_000, retry: false,
  });
  const billingQuery = useQuery({
    queryKey: ["dashboard-upcoming-billing"],
    queryFn: async () => {
      const { data, error } = await db.from("faturamentos").select("id,valor,data_vencimento,status,clientes(nome)").in("status", ["pendente", "atrasado"]).order("data_vencimento", { ascending: true }).limit(5);
      if (error) throw error;
      return (data ?? []) as BillingRow[];
    }, staleTime: 60_000, retry: false,
  });

  return (
    <section className="mt-5 grid gap-5 xl:grid-cols-2" aria-label="Clientes recentes e próximos vencimentos">
      <article className={panel}>
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
          <div className="flex items-center gap-2"><Users className="size-4 text-primary" /><h2 className="font-display text-sm font-bold text-foreground">Últimos clientes</h2></div>
          <Link to="/clientes" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Ver todos <ArrowUpRight className="size-3.5" /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse"><thead className="bg-surface-soft"><tr><th className={th}>Cliente</th><th className={th}>Empresa</th><th className={th}>Status</th><th className={th}>Cadastro</th></tr></thead>
            <tbody>{clientsQuery.isLoading ? <tr><td colSpan={4} className={`${td} py-8 text-center text-muted-foreground`}>Carregando clientes…</td></tr> : clientsQuery.isError ? <tr><td colSpan={4} className={`${td} py-8 text-center text-muted-foreground`}>Não foi possível carregar os clientes.</td></tr> : clientsQuery.data?.length ? clientsQuery.data.map((client) => <tr key={client.id} className="border-t border-glass-border/70 hover:bg-surface-soft/60"><td className={`${td} font-medium`}>{client.nome}</td><td className={`${td} text-muted-foreground`}>{client.empresa || "—"}</td><td className={td}><StatusPill status={client.status} /></td><td className={`${td} whitespace-nowrap text-muted-foreground`}>{localDate(client.created_at)}</td></tr>) : <tr><td colSpan={4} className={`${td} py-8 text-center text-muted-foreground`}>Nenhum cliente cadastrado.</td></tr>}</tbody>
          </table>
        </div>
      </article>
      <article className={panel}>
        <div className="flex items-center justify-between border-b border-glass-border px-5 py-4">
          <div className="flex items-center gap-2"><CalendarClock className="size-4 text-primary" /><h2 className="font-display text-sm font-bold text-foreground">Próximos vencimentos</h2></div>
          <Link to="/faturamento" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">Ver todos <ArrowUpRight className="size-3.5" /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px] border-collapse"><thead className="bg-surface-soft"><tr><th className={th}>Cliente</th><th className={th}>Valor</th><th className={th}>Vencimento</th><th className={th}>Status</th></tr></thead>
            <tbody>{billingQuery.isLoading ? <tr><td colSpan={4} className={`${td} py-8 text-center text-muted-foreground`}>Carregando vencimentos…</td></tr> : billingQuery.isError ? <tr><td colSpan={4} className={`${td} py-8 text-center text-muted-foreground`}>Não foi possível carregar os vencimentos.</td></tr> : billingQuery.data?.length ? billingQuery.data.map((item) => { const customer = Array.isArray(item.clientes) ? item.clientes[0] : item.clientes; return <tr key={item.id} className="border-t border-glass-border/70 hover:bg-surface-soft/60"><td className={`${td} font-medium`}>{customer?.nome ?? "Cliente"}</td><td className={`${td} whitespace-nowrap`}>{currency.format(Number(item.valor) || 0)}</td><td className={`${td} whitespace-nowrap text-muted-foreground`}>{localDate(item.data_vencimento)}</td><td className={td}><StatusPill status={item.status} /></td></tr>; }) : <tr><td colSpan={4} className={`${td} py-8 text-center text-muted-foreground`}>Nenhum vencimento em aberto.</td></tr>}</tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
