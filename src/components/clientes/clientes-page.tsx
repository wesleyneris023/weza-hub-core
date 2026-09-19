import { useDeferredValue, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { ClienteDetailsSheet } from "./cliente-details-sheet";
import { ClienteFormSheet } from "./cliente-form-sheet";
import { ClientesList } from "./clientes-list";
import { DeleteClienteDialog } from "./delete-cliente-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  criarCliente,
  atualizarCliente,
  clientesQueryKey,
  excluirCliente,
  listarClientes,
  obterCliente,
  verificarVinculos,
  type ClienteInput,
  type ClienteListItem,
} from "@/lib/clientes.query";

type FormState = { mode: "create" } | { mode: "edit"; cliente: ClienteListItem } | null;

export function ClientesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | "ativo" | "inativo">("todos");
  const [formState, setFormState] = useState<FormState>(null);
  const [detailId, setDetailId] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<ClienteListItem>();
  const deferredSearch = useDeferredValue(search);
  const listQuery = useQuery({
    queryKey: [...clientesQueryKey, page, deferredSearch, status],
    queryFn: () => listarClientes({ page, search: deferredSearch, status }),
    retry: false,
  });
  const detailQuery = useQuery({
    queryKey: [...clientesQueryKey, "detail", detailId],
    queryFn: () => obterCliente(detailId ?? ""),
    enabled: Boolean(detailId),
    retry: false,
  });
  const linksQuery = useQuery({
    queryKey: [...clientesQueryKey, "links", deleteTarget?.id],
    queryFn: () => verificarVinculos(deleteTarget?.id ?? ""),
    enabled: Boolean(deleteTarget),
    retry: false,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: clientesQueryKey }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }),
    ]);
  };
  const saveMutation = useMutation({
    mutationFn: async (input: ClienteInput) =>
      formState?.mode === "edit"
        ? atualizarCliente({ id: formState.cliente.id, input })
        : criarCliente(input),
    onSuccess: async () => {
      const editing = formState?.mode === "edit";
      setFormState(null);
      await refresh();
      toast.success(editing ? "Cliente atualizado com sucesso." : "Cliente salvo com sucesso.");
    },
    onError: () => toast.error("Não foi possível salvar o cliente."),
  });
  const deleteMutation = useMutation({
    mutationFn: excluirCliente,
    onSuccess: async () => {
      setDeleteTarget(undefined);
      await refresh();
      toast.success("Cliente excluído com sucesso.");
    },
    onError: (error) => toast.error(error.message),
  });
  const totalPages = Math.max(
    1,
    Math.ceil((listQuery.data?.total ?? 0) / (listQuery.data?.pageSize ?? 10)),
  );
  const openNew = () => setFormState({ mode: "create" });

  return (
    <main id="main-content" className="flex-1 px-5 py-8 sm:px-7 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="animate-rise sm:flex sm:items-end sm:justify-between sm:gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Gestão</p>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Clientes</h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Gerencie seus clientes e acompanhe seus projetos.
            </p>
          </div>
          <Button className="mt-5 sm:mt-0" onClick={openNew}>
            <Plus />
            Novo cliente
          </Button>
        </div>
        <section
          className="mt-7 overflow-hidden rounded-xl border border-glass-border bg-surface-glass shadow-soft backdrop-blur-xl"
          aria-label="Lista de clientes"
        >
          <div className="grid gap-3 border-b border-glass-border p-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="bg-surface-soft pl-9"
                placeholder="Buscar clientes..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                aria-label="Buscar clientes"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value: "todos" | "ativo" | "inativo") => {
                setStatus(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-surface-soft" aria-label="Filtrar por status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {listQuery.isError ? (
            <div className="p-10 text-center" role="alert">
              <p className="font-medium">Não foi possível carregar os clientes.</p>
              <Button variant="outline" className="mt-4" onClick={() => listQuery.refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : !listQuery.isLoading && !listQuery.data?.items.length ? (
            <div className="grid min-h-80 place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Users />
                </span>
                <h2 className="mt-4 font-display text-lg font-bold">Nenhum cliente cadastrado</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Cadastre seu primeiro cliente para começar a organizar sua operação.
                </p>
                <Button className="mt-5" onClick={openNew}>
                  <Plus />
                  Novo cliente
                </Button>
              </div>
            </div>
          ) : (
            <ClientesList
              items={listQuery.data?.items ?? []}
              isLoading={listQuery.isLoading}
              onView={(cliente) => setDetailId(cliente.id)}
              onEdit={(cliente) => setFormState({ mode: "edit", cliente })}
              onDelete={setDeleteTarget}
            />
          )}
          {!listQuery.isLoading && (listQuery.data?.total ?? 0) > 0 ? (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-glass-border px-4 py-3 text-sm text-muted-foreground sm:flex-row">
              <p>
                {listQuery.data?.total} {listQuery.data?.total === 1 ? "cliente" : "clientes"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Página anterior"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  <ChevronLeft />
                </Button>
                <span>
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Próxima página"
                  disabled={page >= totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          ) : null}
        </section>
        <ClienteFormSheet
          open={Boolean(formState)}
          cliente={formState?.mode === "edit" ? formState.cliente : undefined}
          isSaving={saveMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setFormState(null);
          }}
          onSubmit={async (input) => {
            await saveMutation.mutateAsync(input);
          }}
        />
        <ClienteDetailsSheet
          open={Boolean(detailId)}
          cliente={detailQuery.data}
          isLoading={detailQuery.isLoading}
          onOpenChange={(open) => {
            if (!open) setDetailId(undefined);
          }}
        />
        <DeleteClienteDialog
          cliente={deleteTarget}
          related={linksQuery.data}
          checking={linksQuery.isLoading}
          deleting={deleteMutation.isPending}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(undefined);
          }}
          onConfirm={() => {
            if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          }}
        />
      </div>
    </main>
  );
}
