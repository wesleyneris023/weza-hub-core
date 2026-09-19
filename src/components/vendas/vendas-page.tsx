import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeDollarSign, CalendarDays, CircleCheck, Plus, Search, ShoppingBag, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { criarVenda, atualizarVenda, listarVendas, listarClientesVenda, listarWebsitesVenda, vendasQueryKey, type Venda, type VendaInput, type VendaStatus } from "@/lib/vendas.query";

const statuses: { value: VendaStatus | "todas"; label: string }[] = [
  { value: "todas", label: "Todos os status" }, { value: "proposta", label: "Proposta" },
  { value: "negociacao", label: "Em negociação" }, { value: "fechada", label: "Fechada" },
  { value: "perdida", label: "Perdida" }, { value: "cancelada", label: "Cancelada" },
];
const money = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
const today = () => new Date().toISOString().slice(0, 10);
const blank = { cliente_id: "", website_id: "", titulo: "", tipo_servico: "Criação de website", valor: "", forma_pagamento: "", data_venda: today(), previsao_fechamento: "", status: "proposta" as VendaStatus, observacoes: "" };

export function VendasPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<VendaStatus | "todas">("todas");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Venda | null>(null);
  const [form, setForm] = useState(blank);
  const vendasQ = useQuery({ queryKey: vendasQueryKey, queryFn: listarVendas, retry: false });
  const clientesQ = useQuery({ queryKey: ["vendas-clientes"], queryFn: listarClientesVenda, retry: false });
  const websitesQ = useQuery({ queryKey: ["vendas-websites", form.cliente_id], queryFn: () => listarWebsitesVenda(form.cliente_id || undefined), enabled: open, retry: false });
  const rows = useMemo(() => (vendasQ.data ?? []).filter(v => (filter === "todas" || v.status === filter) && `${v.titulo} ${v.tipo_servico} ${v.cliente?.nome ?? ""} ${v.website?.nome ?? ""}`.toLowerCase().includes(search.toLowerCase().trim())), [vendasQ.data, filter, search]);
  const closedTotal = (vendasQ.data ?? []).filter(v => v.status === "fechada").reduce((sum, v) => sum + Number(v.valor), 0);
  const mutation = useMutation({
    mutationFn: (input: VendaInput) => editing ? atualizarVenda(editing.id, input) : criarVenda(input),
    onSuccess: async () => { setOpen(false); setEditing(null); await qc.invalidateQueries({ queryKey: vendasQueryKey }); toast.success(editing ? "Venda atualizada." : "Venda registrada."); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Não foi possível salvar a venda."),
  });
  const startCreate = () => { setEditing(null); setForm({ ...blank }); setOpen(true); };
  const startEdit = (v: Venda) => { setEditing(v); setForm({ cliente_id: v.cliente_id, website_id: v.website_id ?? "", titulo: v.titulo, tipo_servico: v.tipo_servico, valor: String(v.valor), forma_pagamento: v.forma_pagamento ?? "", data_venda: v.data_venda, previsao_fechamento: v.previsao_fechamento ?? "", status: v.status, observacoes: v.observacoes ?? "" }); setOpen(true); };
  const set = (key: keyof typeof blank, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.titulo.trim() || !form.tipo_servico.trim() || Number(form.valor) < 0 || !form.data_venda) { toast.error("Preencha cliente, título, serviço, valor válido e data da venda."); return; }
    mutation.mutate({ cliente_id: form.cliente_id, website_id: form.website_id || null, titulo: form.titulo.trim(), tipo_servico: form.tipo_servico.trim(), valor: Number(form.valor || 0), forma_pagamento: form.forma_pagamento.trim() || null, data_venda: form.data_venda, previsao_fechamento: form.previsao_fechamento || null, status: form.status, observacoes: form.observacoes.trim() || null });
  };

  return <main id="main-content" className="flex-1 px-5 py-8 sm:px-7 lg:px-8 lg:py-10"><div className="mx-auto max-w-7xl">
    <div className="sm:flex sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Comercial</p><h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Vendas</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Acompanhe propostas, negociações e negócios fechados pela WEZA.</p></div><Button className="mt-5 sm:mt-0" onClick={startCreate}><Plus />Nova venda</Button></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-3">
      <Metric icon={<ShoppingBag className="size-4 text-primary"/>} label="Vendas registradas" value={String(vendasQ.data?.length ?? 0)} hint="Total de oportunidades"/>
      <Metric icon={<CircleCheck className="size-4 text-emerald-500"/>} label="Negócios fechados" value={String((vendasQ.data ?? []).filter(v=>v.status==="fechada").length)} hint="Vendas com status fechada"/>
      <Metric icon={<BadgeDollarSign className="size-4 text-primary"/>} label="Receita fechada" value={money(closedTotal)} hint="Soma das vendas fechadas"/>
    </div>
    <section className="mt-7 overflow-hidden rounded-xl border border-glass-border bg-surface-glass shadow-soft">
      <div className="grid gap-3 border-b border-glass-border p-4 sm:grid-cols-[minmax(0,1fr)_12rem]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="bg-surface-soft pl-9" placeholder="Buscar venda, cliente ou serviço..." value={search} onChange={e=>setSearch(e.target.value)} aria-label="Buscar vendas"/></div><select className="h-10 rounded-md border border-input bg-surface-soft px-3 text-sm" value={filter} onChange={e=>setFilter(e.target.value as VendaStatus | "todas")} aria-label="Filtrar vendas por status">{statuses.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
      {vendasQ.isError ? <div className="p-10 text-center" role="alert"><p>Não foi possível carregar as vendas.</p><Button variant="outline" className="mt-4" onClick={()=>vendasQ.refetch()}>Tentar novamente</Button></div> : vendasQ.isLoading ? <div className="p-12 text-center text-sm text-muted-foreground">Carregando vendas...</div> : rows.length === 0 ? <div className="grid min-h-80 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary/10 text-primary"><ShoppingBag/></span><h2 className="mt-4 font-display text-lg font-bold">{(vendasQ.data?.length ?? 0) === 0 ? "Nenhuma venda cadastrada" : "Nenhuma venda encontrada"}</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{(vendasQ.data?.length ?? 0) === 0 ? "Quando a WEZA começar a receber oportunidades comerciais, você poderá registrar propostas e acompanhar cada negociação aqui." : "Tente alterar a busca ou o filtro selecionado."}</p><Button className="mt-5" onClick={startCreate}><Plus/>Nova venda</Button></div></div> : <div className="divide-y divide-glass-border">{rows.map(v=><article key={v.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{v.titulo}</h3><Status status={v.status}/></div><p className="mt-1 text-sm text-muted-foreground">{v.cliente?.nome ?? "Cliente"}{v.website?.nome ? ` · ${v.website.nome}` : ""} · {v.tipo_servico}</p><p className="mt-1 text-xs text-muted-foreground"><CalendarDays className="mr-1 inline size-3"/>{new Date(`${v.data_venda}T12:00:00`).toLocaleDateString("pt-BR")}{v.previsao_fechamento ? ` · Previsão ${new Date(`${v.previsao_fechamento}T12:00:00`).toLocaleDateString("pt-BR")}` : ""}</p></div><div className="flex items-center justify-between gap-4 sm:justify-end"><strong className="font-display text-lg">{money(Number(v.valor))}</strong><Button variant="outline" size="sm" onClick={()=>startEdit(v)}><Pencil className="mr-1 size-3.5"/>Editar</Button></div></article>)}</div>}
    </section>
  </div>
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto border-glass-border bg-background sm:max-w-xl"><SheetHeader><SheetTitle className="font-display">{editing ? "Editar venda" : "Nova venda"}</SheetTitle><SheetDescription>Registre uma oportunidade comercial vinculada a um cliente existente.</SheetDescription></SheetHeader>
    <form onSubmit={submit} className="mt-6 space-y-4"><Field label="Cliente *"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.cliente_id} onChange={e=>{set("cliente_id",e.target.value);set("website_id","")}} disabled={clientesQ.isLoading || !(clientesQ.data?.length)}><option value="">Selecione um cliente</option>{(clientesQ.data ?? []).map(c=><option key={c.id} value={c.id}>{c.nome}{c.empresa ? ` · ${c.empresa}` : ""}</option>)}</select>{!clientesQ.isLoading && !clientesQ.data?.length && <p className="text-xs text-amber-500">Cadastre um cliente ativo no módulo Clientes antes de registrar uma venda.</p>}</Field>
    <Field label="Título da venda *"><Input value={form.titulo} onChange={e=>set("titulo",e.target.value)} placeholder="Ex.: Desenvolvimento de site institucional"/></Field>
    <Field label="Tipo de serviço *"><Input value={form.tipo_servico} onChange={e=>set("tipo_servico",e.target.value)} placeholder="Criação de website, manutenção..."/></Field>
    <Field label="Website relacionado"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.website_id} onChange={e=>set("website_id",e.target.value)} disabled={!form.cliente_id}><option value="">Nenhum / ainda não cadastrado</option>{(websitesQ.data ?? []).map(w=><option key={w.id} value={w.id}>{w.nome}</option>)}</select></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Valor (R$) *"><Input type="number" min="0" step="0.01" value={form.valor} onChange={e=>set("valor",e.target.value)} placeholder="0,00"/></Field><Field label="Forma de pagamento"><Input value={form.forma_pagamento} onChange={e=>set("forma_pagamento",e.target.value)} placeholder="Pix, cartão, parcelado..."/></Field><Field label="Data da venda *"><Input type="date" value={form.data_venda} onChange={e=>set("data_venda",e.target.value)}/></Field><Field label="Previsão de fechamento"><Input type="date" min={form.data_venda} value={form.previsao_fechamento} onChange={e=>set("previsao_fechamento",e.target.value)}/></Field></div>
    <Field label="Status"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={e=>set("status",e.target.value)}>{statuses.filter(s=>s.value!=="todas").map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></Field>
    <Field label="Observações"><Textarea rows={3} value={form.observacoes} onChange={e=>set("observacoes",e.target.value)} placeholder="Detalhes comerciais, condições negociadas..."/></Field>
    <SheetFooter className="gap-2 pt-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={mutation.isPending}>Cancelar</Button><Button type="submit" disabled={mutation.isPending || !clientesQ.data?.length}>{mutation.isPending ? "Salvando..." : "Salvar venda"}</Button></SheetFooter></form>
  </SheetContent></Sheet></main>;
}
function Metric({icon,label,value,hint}:{icon:React.ReactNode;label:string;value:string;hint:string}) { return <div className="rounded-xl border border-glass-border bg-surface-glass p-5 shadow-soft"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p>{icon}</div><p className="mt-3 font-display text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></div>; }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="block space-y-1.5 text-sm font-medium">{label}{children}</label>; }
function Status({status}:{status:VendaStatus}) { const label=statuses.find(s=>s.value===status)?.label ?? status; const cls:Record<VendaStatus,string>={proposta:"bg-blue-500/10 text-blue-500",negociacao:"bg-amber-500/10 text-amber-500",fechada:"bg-emerald-500/10 text-emerald-500",perdida:"bg-destructive/10 text-destructive",cancelada:"bg-muted text-muted-foreground"}; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls[status]}`}>{label}</span>; }
