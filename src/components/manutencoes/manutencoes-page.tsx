import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CheckCircle2, Clock3, Pencil, Plus, Search, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { atualizarManutencao, criarManutencao, listarClientesManutencao, listarManutencoes, listarWebsitesManutencao, manutencoesQueryKey, type Manutencao, type ManutencaoInput, type ManutencaoPrioridade, type ManutencaoStatus } from "@/lib/manutencoes.query";

const statusOptions: { value: ManutencaoStatus | "todos"; label: string }[] = [
  { value: "todos", label: "Todos os status" }, { value: "aberta", label: "Aberta" },
  { value: "em_andamento", label: "Em andamento" }, { value: "concluida", label: "Concluída" },
];
const priorities: { value: ManutencaoPrioridade; label: string }[] = [
  { value: "baixa", label: "Baixa" }, { value: "media", label: "Média" },
  { value: "alta", label: "Alta" }, { value: "urgente", label: "Urgente" },
];
const serviceTypes = ["Correção de erro", "Atualização de conteúdo", "Atualização técnica", "Ajuste visual", "Domínio e hospedagem", "Backup e segurança", "Melhoria / nova funcionalidade", "Outro"];
const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dateOnly = (value?: string | null) => value ? localDate(new Date(value)) : localDate();
const dateTimeLocal = (value?: string | null) => value ? (() => { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; })() : "";
const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
const blank = { cliente_id: "", website_id: "", titulo: "", descricao: "", tipo: "", status: "aberta" as ManutencaoStatus, prioridade: "media" as ManutencaoPrioridade, data_abertura: localDate(), data_conclusao: "", observacoes: "" };
const toIsoAtLocalNoon = (date: string) => new Date(`${date}T12:00:00`).toISOString();

export function ManutencoesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ManutencaoStatus | "todos">("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Manutencao | null>(null);
  const [form, setForm] = useState(blank);
  const maintenanceQ = useQuery({ queryKey: manutencoesQueryKey, queryFn: listarManutencoes, retry: false });
  const clientsQ = useQuery({ queryKey: ["manutencoes-clientes"], queryFn: listarClientesManutencao, retry: false });
  const websitesQ = useQuery({ queryKey: ["manutencoes-websites", form.cliente_id], queryFn: () => listarWebsitesManutencao(form.cliente_id || undefined), enabled: open && !!form.cliente_id, retry: false });
  const rows = useMemo(() => (maintenanceQ.data ?? []).filter(m => (filter === "todos" || m.status === filter) && `${m.titulo} ${m.tipo} ${m.cliente?.nome ?? ""} ${m.website?.nome ?? ""} ${m.website?.dominio ?? ""}`.toLowerCase().includes(search.toLowerCase().trim())), [maintenanceQ.data, filter, search]);
  const all = maintenanceQ.data ?? [];
  const openCount = all.filter(m => m.status === "aberta").length;
  const inProgress = all.filter(m => m.status === "em_andamento").length;
  const completed = all.filter(m => m.status === "concluida").length;

  const mutation = useMutation({
    mutationFn: (input: ManutencaoInput) => editing ? atualizarManutencao(editing.id, input) : criarManutencao(input),
    onSuccess: async () => { setOpen(false); setEditing(null); await qc.invalidateQueries({ queryKey: manutencoesQueryKey }); toast.success(editing ? "Manutenção atualizada." : "Manutenção registrada."); },
    onError: e => toast.error(e instanceof Error ? e.message : "Não foi possível salvar a manutenção."),
  });
  const startCreate = () => { setEditing(null); setForm({ ...blank, data_abertura: localDate() }); setOpen(true); };
  const startEdit = (m: Manutencao) => { setEditing(m); setForm({ cliente_id: m.cliente_id, website_id: m.website_id, titulo: m.titulo, descricao: m.descricao ?? "", tipo: m.tipo, status: m.status, prioridade: m.prioridade, data_abertura: dateOnly(m.data_abertura), data_conclusao: dateTimeLocal(m.data_conclusao), observacoes: m.observacoes ?? "" }); setOpen(true); };
  const set = (key: keyof typeof blank, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const setStatus = (value: ManutencaoStatus) => {
    set("status", value);
    if (value === "concluida" && !form.data_conclusao) set("data_conclusao", dateTimeLocal(new Date().toISOString()));
    if (value !== "concluida") set("data_conclusao", "");
  };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.website_id || !form.titulo.trim() || !form.tipo.trim() || !form.data_abertura) { toast.error("Selecione cliente e website e informe título, tipo de serviço e data de abertura."); return; }
    if (!(websitesQ.data ?? []).some(w => w.id === form.website_id && w.cliente_id === form.cliente_id)) { toast.error("Selecione um website pertencente ao cliente informado."); return; }
    if (form.status === "concluida" && !form.data_conclusao) { toast.error("Informe a data e hora da conclusão."); return; }
    mutation.mutate({ cliente_id: form.cliente_id, website_id: form.website_id, titulo: form.titulo.trim(), descricao: form.descricao.trim() || null, tipo: form.tipo.trim(), status: form.status, prioridade: form.prioridade, data_abertura: toIsoAtLocalNoon(form.data_abertura), data_conclusao: form.status === "concluida" ? new Date(form.data_conclusao).toISOString() : null, observacoes: form.observacoes.trim() || null });
  };

  return <main id="main-content" className="flex-1 px-5 py-8 sm:px-7 lg:px-8 lg:py-10"><div className="mx-auto max-w-7xl">
    <div className="sm:flex sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Operação</p><h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Manutenção</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Organize solicitações, acompanhe atendimentos e mantenha os sites dos clientes em dia.</p></div><Button className="mt-5 sm:mt-0" onClick={startCreate}><Plus/>Nova manutenção</Button></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<Wrench className="size-4 text-primary"/>} label="Solicitações" value={String(all.length)} hint="Total de manutenções registradas"/><Metric icon={<AlertCircle className="size-4 text-amber-500"/>} label="Abertas" value={String(openCount)} hint="Aguardando início do atendimento"/><Metric icon={<Clock3 className="size-4 text-primary"/>} label="Em andamento" value={String(inProgress)} hint="Serviços em execução"/><Metric icon={<CheckCircle2 className="size-4 text-emerald-500"/>} label="Concluídas" value={String(completed)} hint="Atendimentos finalizados"/></div>
    <section className="mt-7 overflow-hidden rounded-xl border border-glass-border bg-surface-glass shadow-soft"><div className="grid gap-3 border-b border-glass-border p-4 sm:grid-cols-[minmax(0,1fr)_12rem]"><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input className="bg-surface-soft pl-9" placeholder="Buscar título, cliente, website ou serviço..." value={search} onChange={e=>setSearch(e.target.value)} aria-label="Buscar manutenções"/></div><select className="h-10 rounded-md border border-input bg-surface-soft px-3 text-sm" value={filter} onChange={e=>setFilter(e.target.value as ManutencaoStatus|"todos")} aria-label="Filtrar manutenções por status">{statusOptions.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
    {maintenanceQ.isError ? <div className="p-10 text-center" role="alert"><p>Não foi possível carregar as manutenções.</p><Button variant="outline" className="mt-4" onClick={()=>maintenanceQ.refetch()}>Tentar novamente</Button></div> : maintenanceQ.isLoading ? <div className="p-12 text-center text-sm text-muted-foreground">Carregando manutenções...</div> : rows.length===0 ? <div className="grid min-h-80 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary/10 text-primary"><Wrench/></span><h2 className="mt-4 font-display text-lg font-bold">{all.length===0?"Nenhuma manutenção cadastrada":"Nenhuma manutenção encontrada"}</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">{all.length===0?"Quando a WEZA iniciar os atendimentos, registre as solicitações aqui e acompanhe cada etapa.":"Tente alterar a busca ou o filtro selecionado."}</p><Button className="mt-5" onClick={startCreate}><Plus/>Nova manutenção</Button></div></div> : <div className="divide-y divide-glass-border">{rows.map(m=><article key={m.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{m.titulo}</h3><Status status={m.status}/><Priority priority={m.prioridade}/></div><p className="mt-1 text-sm text-muted-foreground">{m.cliente?.nome??"Cliente"} · {m.website?.nome??"Website"}{m.website?.dominio?` (${m.website.dominio})`:""} · {m.tipo}</p><p className="mt-1 text-xs text-muted-foreground">Aberta: {dateLabel(m.data_abertura)}{m.data_conclusao?` · Concluída: ${dateLabel(m.data_conclusao)}`:""}</p>{m.descricao&&<p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.descricao}</p>}</div><div className="flex items-center justify-end"><Button variant="outline" size="sm" onClick={()=>startEdit(m)}><Pencil className="mr-1 size-3.5"/>Editar</Button></div></article>)}</div>}</section>
  </div>
  <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto border-glass-border bg-background sm:max-w-xl"><SheetHeader><SheetTitle className="font-display">{editing?"Editar manutenção":"Nova manutenção"}</SheetTitle><SheetDescription>Registre e acompanhe uma solicitação vinculada a um cliente e website.</SheetDescription></SheetHeader>
    <form onSubmit={submit} className="mt-6 space-y-4"><Field label="Cliente *"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.cliente_id} onChange={e=>{set("cliente_id",e.target.value);set("website_id","")}} disabled={clientsQ.isLoading||!(clientsQ.data?.length)}><option value="">Selecione um cliente</option>{(clientsQ.data??[]).map(c=><option key={c.id} value={c.id}>{c.nome}{c.empresa?` · ${c.empresa}`:""}</option>)}</select>{!clientsQ.isLoading&&!clientsQ.data?.length&&<p className="text-xs text-amber-500">Cadastre um cliente ativo no módulo Clientes antes de registrar uma manutenção.</p>}</Field>
    <Field label="Website *"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.website_id} onChange={e=>set("website_id",e.target.value)} disabled={!form.cliente_id||websitesQ.isLoading||!(websitesQ.data?.length)}><option value="">Selecione um website</option>{(websitesQ.data??[]).map(w=><option key={w.id} value={w.id}>{w.nome}{w.dominio?` · ${w.dominio}`:""}</option>)}</select>{form.cliente_id&&!websitesQ.isLoading&&!websitesQ.data?.length&&<p className="text-xs text-amber-500">Esse cliente ainda não possui website cadastrado.</p>}</Field>
    <Field label="Título da solicitação *"><Input value={form.titulo} onChange={e=>set("titulo",e.target.value)} maxLength={160} placeholder="Ex.: Corrigir formulário de contato"/></Field>
    <Field label="Tipo de serviço *"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.tipo} onChange={e=>set("tipo",e.target.value)}><option value="">Selecione o tipo</option>{serviceTypes.map(t=><option key={t} value={t}>{t}</option>)}</select></Field>
    <Field label="Descrição do problema / serviço"><Textarea rows={3} value={form.descricao} onChange={e=>set("descricao",e.target.value)} maxLength={2000} placeholder="Descreva a solicitação, erro ou ajuste necessário..."/><p className="text-right text-xs text-muted-foreground">{form.descricao.length}/2000</p></Field>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Prioridade *"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.prioridade} onChange={e=>set("prioridade",e.target.value as ManutencaoPrioridade)}>{priorities.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}</select></Field><Field label="Status *"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={e=>setStatus(e.target.value as ManutencaoStatus)}>{statusOptions.filter(s=>s.value!=="todos").map(s=><option key={s.value} value={s.value}>{s.label}</option>)}</select></Field></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Data de abertura *"><Input type="date" value={form.data_abertura} max={localDate()} onChange={e=>set("data_abertura",e.target.value)} required/></Field>{form.status==="concluida"&&<Field label="Data e hora da conclusão *"><Input type="datetime-local" value={form.data_conclusao} min={form.data_abertura ? `${form.data_abertura}T00:00` : undefined} onChange={e=>set("data_conclusao",e.target.value)} required/></Field>}</div>
    <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">A data de abertura vem preenchida com hoje. Ao marcar a solicitação como concluída, a data e hora da conclusão são preenchidas automaticamente e podem ser ajustadas.</p>
    <Field label="Observações internas"><Textarea rows={3} value={form.observacoes} onChange={e=>set("observacoes",e.target.value)} maxLength={1000} placeholder="Anotações internas, retorno ao cliente, próximos passos..."/><p className="text-right text-xs text-muted-foreground">{form.observacoes.length}/1000</p></Field>
    <SheetFooter className="gap-2 pt-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)} disabled={mutation.isPending}>Cancelar</Button><Button type="submit" disabled={mutation.isPending||!clientsQ.data?.length}>{mutation.isPending?"Salvando...":"Salvar manutenção"}</Button></SheetFooter></form>
  </SheetContent></Sheet></main>;
}
function Metric({icon,label,value,hint}:{icon:React.ReactNode;label:string;value:string;hint:string}) { return <div className="rounded-xl border border-glass-border bg-surface-glass p-5 shadow-soft"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p>{icon}</div><p className="mt-3 font-display text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{hint}</p></div>; }
function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="block space-y-1.5 text-sm font-medium">{label}{children}</label>; }
function Status({status}:{status:ManutencaoStatus}) { const label=statusOptions.find(s=>s.value===status)?.label??status; const cls:Record<ManutencaoStatus,string>={aberta:"bg-amber-500/10 text-amber-500",em_andamento:"bg-primary/10 text-primary",concluida:"bg-emerald-500/10 text-emerald-500"}; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls[status]}`}>{label}</span>; }
function Priority({priority}:{priority:ManutencaoPrioridade}) { const label=priorities.find(p=>p.value===priority)?.label??priority; const cls:Record<ManutencaoPrioridade,string>={baixa:"bg-muted text-muted-foreground",media:"bg-sky-500/10 text-sky-600",alta:"bg-orange-500/10 text-orange-500",urgente:"bg-destructive/10 text-destructive"}; return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${cls[priority]}`}>{label}</span>; }