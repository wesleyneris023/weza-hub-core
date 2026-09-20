import { useDeferredValue, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, differenceInCalendarDays, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Globe2, Plus, Search, Pencil, ExternalLink, CalendarClock, Layers3, CircleCheck, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  atualizarWebsite,
  criarWebsite,
  listarClientesParaWebsite,
  listarWebsites,
  websitesQueryKey,
  type WebsiteInput,
  type WebsiteListItem,
  type WebsiteStatus,
} from "@/lib/websites.query";

const statusOptions: { value: WebsiteStatus; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "pendente", label: "Pendente" },
  { value: "vencido", label: "Vencido" },
  { value: "suspenso", label: "Suspenso" },
];

const schema = z.object({
  cliente_id: z.string().min(1, "Selecione um cliente."),
  nome: z.string().trim().min(1, "Informe o nome do website."),
  dominio: z.string().trim(),
  descricao: z.string(),
  status: z.enum(["ativo", "pendente", "vencido", "suspenso"]),
  plataforma: z.string(),
  hospedagem: z.string(),
  data_inicio: z.string(),
  data_expiracao: z.string(),
  observacoes: z.string(),
});

type FormValues = z.infer<typeof schema>;
const emptyValues: FormValues = {
  cliente_id: "", nome: "", dominio: "", descricao: "", status: "ativo", plataforma: "", hospedagem: "",
  data_inicio: "", data_expiracao: "", observacoes: "",
};

function toFormValues(website?: WebsiteListItem): FormValues {
  if (!website) return emptyValues;
  return {
    cliente_id: website.cliente_id,
    nome: website.nome,
    dominio: website.dominio ?? "",
    descricao: website.descricao ?? "",
    status: statusOptions.some((item) => item.value === website.status) ? (website.status as WebsiteStatus) : "pendente",
    plataforma: website.plataforma ?? "",
    hospedagem: website.hospedagem ?? "",
    data_inicio: website.data_inicio ?? "",
    data_expiracao: website.data_expiracao ?? "",
    observacoes: website.observacoes ?? "",
  };
}

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeDomain(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Não definida";
  const date = parseISO(value);
  return isValid(date) ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Não definida";
}

function expiryLabel(value: string | null): { text: string; tone: string } {
  if (!value) return { text: "Sem vencimento", tone: "text-muted-foreground" };
  const days = differenceInCalendarDays(parseISO(value), new Date());
  if (days < 0) return { text: `Vencido há ${Math.abs(days)} dia(s)`, tone: "text-destructive" };
  if (days === 0) return { text: "Vence hoje", tone: "text-destructive" };
  if (days <= 30) return { text: `Vence em ${days} dia(s)`, tone: "text-amber-500" };
  return { text: `Vence em ${days} dia(s)`, tone: "text-muted-foreground" };
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ativo: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
    pendente: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
    vencido: "bg-destructive/10 text-destructive ring-destructive/20",
    suspenso: "bg-muted text-muted-foreground ring-border",
  };
  const label = statusOptions.find((item) => item.value === status)?.label ?? status;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] ?? styles["pendente"]}`}>{label}</span>;
}

function WebsiteFormSheet({
  open, website, clients, clientsLoading, isSaving, onOpenChange, onSubmit,
}: {
  open: boolean;
  website: WebsiteListItem | undefined;
  clients: Awaited<ReturnType<typeof listarClientesParaWebsite>>;
  clientsLoading: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: WebsiteInput) => Promise<void>;
}) {
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues, mode: "onChange" });
  useEffect(() => { if (open) form.reset(toFormValues(website)); }, [website, form, open]);

  const submit = form.handleSubmit(async (values) => {
    await onSubmit({
      cliente_id: values.cliente_id,
      nome: values.nome.trim(),
      dominio: optional(values.dominio),
      descricao: optional(values.descricao),
      status: values.status,
      plataforma: optional(values.plataforma),
      hospedagem: optional(values.hospedagem),
      data_inicio: optional(values.data_inicio),
      data_expiracao: optional(values.data_expiracao),
      observacoes: optional(values.observacoes),
    });
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto border-glass-border bg-background sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-display">{website ? "Editar website" : "Novo website"}</SheetTitle>
          <SheetDescription>{website ? "Atualize os dados e o ciclo de vida do projeto." : "Vincule um website a um cliente cadastrado no WEZA HUB."}</SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
            <FormField control={form.control} name="cliente_id" render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={clientsLoading || clients.length === 0}>
                  <FormControl><SelectTrigger><SelectValue placeholder={clientsLoading ? "Carregando clientes..." : "Selecione o cliente"} /></SelectTrigger></FormControl>
                  <SelectContent>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.nome}{client.empresa ? ` · ${client.empresa}` : ""}</SelectItem>)}</SelectContent>
                </Select>
                {clients.length === 0 && !clientsLoading && <p className="text-xs text-amber-500">Cadastre um cliente ativo antes de criar um website.</p>}
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem><FormLabel>Nome do website *</FormLabel><FormControl><Input placeholder="Ex.: Site institucional Lilhão" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dominio" render={({ field }) => (
              <FormItem><FormLabel>Domínio</FormLabel><FormControl><Input placeholder="www.empresa.com.br" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="descricao" render={({ field }) => (
              <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={3} placeholder="Escopo ou finalidade do website" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem><FormLabel>Status *</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{statusOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="plataforma" render={({ field }) => (
                <FormItem><FormLabel>Plataforma</FormLabel><FormControl><Input placeholder="Lovable, Wix, WordPress..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="hospedagem" render={({ field }) => (
                <FormItem><FormLabel>Hospedagem</FormLabel><FormControl><Input placeholder="Provedor / plano" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="data_inicio" render={({ field }) => (
                <FormItem><FormLabel>Data de início</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="data_expiracao" render={({ field }) => (
                <FormItem><FormLabel>Data de vencimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="observacoes" render={({ field }) => (
              <FormItem><FormLabel>Observações internas</FormLabel><FormControl><Textarea rows={4} placeholder="Informações administrativas" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <SheetFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancelar</Button>
              <Button type="submit" disabled={!form.formState.isValid || isSaving || clients.length === 0}>{isSaving ? "Salvando..." : "Salvar website"}</Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export function WebsitesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | WebsiteStatus>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteListItem>();
  const deferredSearch = useDeferredValue(search);

  const listQuery = useQuery({
    queryKey: [...websitesQueryKey, page, deferredSearch, status],
    queryFn: () => listarWebsites({ page, search: deferredSearch, status }),
    retry: false,
  });
  const clientsQuery = useQuery({ queryKey: ["website-client-options"], queryFn: listarClientesParaWebsite, retry: false });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: websitesQueryKey }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
      queryClient.invalidateQueries({ queryKey: ["clientes"] }),
    ]);
  };
  const saveMutation = useMutation({
    mutationFn: (input: WebsiteInput) => editing ? atualizarWebsite({ id: editing.id, input }) : criarWebsite(input),
    onSuccess: async () => {
      const wasEditing = Boolean(editing);
      setFormOpen(false);
      setEditing(undefined);
      await refresh();
      toast.success(wasEditing ? "Website atualizado com sucesso." : "Website cadastrado com sucesso.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar o website."),
  });

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (listQuery.data?.pageSize ?? 10)));
  const activeCount = items.filter((item) => item.status === "ativo").length;
  const expiringCount = items.filter((item) => {
    if (!item.data_expiracao || item.status !== "ativo") return false;
    const days = differenceInCalendarDays(parseISO(item.data_expiracao), new Date());
    return days >= 0 && days <= 30;
  }).length;

  const openCreate = () => { setEditing(undefined); setFormOpen(true); };
  const openEdit = (website: WebsiteListItem) => { setEditing(website); setFormOpen(true); };

  return (
    <main id="main-content" className="flex-1 px-5 py-8 sm:px-7 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="animate-rise sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Gestão</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Websites</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">Gerencie os projetos digitais, domínios e vencimentos dos seus clientes.</p>
          </div>
          <Button className="mt-5 sm:mt-0" onClick={openCreate}><Plus />Novo website</Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-glass-border bg-surface-glass p-5 shadow-soft">
            <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Websites cadastrados</p><Layers3 className="size-4 text-primary" /></div>
            <p className="mt-3 font-display text-3xl font-bold">{listQuery.isLoading ? "—" : total}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total conforme os filtros aplicados</p>
          </div>
          <div className="rounded-xl border border-glass-border bg-surface-glass p-5 shadow-soft">
            <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Ativos nesta página</p><CircleCheck className="size-4 text-emerald-500" /></div>
            <p className="mt-3 font-display text-3xl font-bold">{listQuery.isLoading ? "—" : activeCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Projetos com status ativo</p>
          </div>
          <div className="rounded-xl border border-glass-border bg-surface-glass p-5 shadow-soft">
            <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">Vencimentos próximos</p><CalendarClock className="size-4 text-amber-500" /></div>
            <p className="mt-3 font-display text-3xl font-bold">{listQuery.isLoading ? "—" : expiringCount}</p>
            <p className="mt-1 text-xs text-muted-foreground">Ativos que vencem em até 30 dias, nesta página</p>
          </div>
        </div>

        <section className="mt-7 overflow-hidden rounded-xl border border-glass-border bg-surface-glass shadow-soft backdrop-blur-xl" aria-label="Lista de websites">
          <div className="grid gap-3 border-b border-glass-border p-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="bg-surface-soft pl-9" placeholder="Buscar por nome ou domínio..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} aria-label="Buscar websites" /></div>
            <Select value={status} onValueChange={(value: "todos" | WebsiteStatus) => { setStatus(value); setPage(1); }}>
              <SelectTrigger className="bg-surface-soft" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="todos">Todos os status</SelectItem>{statusOptions.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {listQuery.isError ? (
            <div className="p-10 text-center" role="alert"><p className="font-medium">Não foi possível carregar os websites.</p><Button variant="outline" className="mt-4" onClick={() => listQuery.refetch()}>Tentar novamente</Button></div>
          ) : !listQuery.isLoading && items.length === 0 ? (
            <div className="grid min-h-80 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary/10 text-primary"><Globe2 /></span><h2 className="mt-4 font-display text-lg font-bold">Nenhum website cadastrado</h2><p className="mt-2 max-w-md text-sm text-muted-foreground">Cadastre o primeiro website e vincule-o a um cliente ativo para começar a acompanhar domínio, plataforma e vencimento.</p><Button className="mt-5" onClick={openCreate}><Plus />Novo website</Button></div></div>
          ) : (
            <div className="divide-y divide-glass-border">
              {listQuery.isLoading ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse bg-surface-soft/40" />) : items.map((website) => {
                const expiry = expiryLabel(website.data_expiracao);
                const domain = website.dominio ? normalizeDomain(website.dominio) : "";
                return (
                  <article key={website.id} className="flex flex-col gap-4 p-4 transition-colors hover:bg-surface-soft/40 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Globe2 className="size-5" /></div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{website.nome}</h2><StatusBadge status={website.status} /></div>
                        <p className="mt-1 text-sm text-muted-foreground">{website.cliente?.nome ?? "Cliente não identificado"}{website.cliente?.empresa ? ` · ${website.cliente.empresa}` : ""}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {website.dominio && <a href={domain} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline" onClick={(event) => event.stopPropagation()}>{website.dominio}<ExternalLink className="size-3" /></a>}
                          {website.plataforma && <span>{website.plataforma}</span>}
                          <span>Início: {formatDate(website.data_inicio)}</span>
                          <span className={`inline-flex items-center gap-1 ${expiry.tone}`}><Clock3 className="size-3" />{expiry.text}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 self-start sm:self-center" onClick={() => openEdit(website)}><Pencil className="size-3.5" />Editar</Button>
                  </article>
                );
              })}
            </div>
          )}

          {!listQuery.isLoading && total > 0 && <div className="flex flex-col items-center justify-between gap-3 border-t border-glass-border px-4 py-3 text-sm text-muted-foreground sm:flex-row"><p>{total} {total === 1 ? "website" : "websites"}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span>Página {page} de {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Próxima</Button></div></div>}
        </section>
      </div>
      <WebsiteFormSheet
        open={formOpen}
        website={editing}
        clients={clientsQuery.data ?? []}
        clientsLoading={clientsQuery.isLoading}
        isSaving={saveMutation.isPending}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditing(undefined); }}
        onSubmit={async (input) => { await saveMutation.mutateAsync(input); }}
      />
    </main>
  );
}
