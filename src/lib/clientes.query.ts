import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const CLIENTES_PAGE_SIZE = 10;
export const clientesQueryKey = ["clientes"] as const;

export type Cliente = Tables<"clientes">;
export type ClienteStatus = "ativo" | "inativo";
export type ClienteInput = Pick<
  TablesInsert<"clientes">,
  "nome" | "empresa" | "email" | "telefone" | "documento" | "status" | "observacoes"
>;

export interface ClienteListItem extends Cliente {
  websitesCount: number;
  assinaturasCount: number;
}

export interface ClienteListResult {
  items: ClienteListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClienteRelatedCounts {
  websites: number;
  assinaturas: number;
  pagamentos: number;
  manutencoes: number;
  faturamentos: number;
}

export interface ClienteDetail extends Cliente {
  related: ClienteRelatedCounts;
}

export interface ClienteListParams {
  page: number;
  search: string;
  status: "todos" | ClienteStatus;
}

interface CountRelation {
  count: number;
}

interface ClienteListRow extends Cliente {
  websites: CountRelation[] | null;
  assinaturas: CountRelation[] | null;
}

async function requireAuthenticatedUser(): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

function safeSearch(value: string): string {
  return value.trim().replace(/[%_,()]/g, " ").replace(/\s+/g, " ");
}

function countRelation(value: CountRelation[] | null): number {
  return value?.[0]?.count ?? 0;
}

export async function listarClientes(params: ClienteListParams): Promise<ClienteListResult> {
  await requireAuthenticatedUser();
  const page = Math.max(1, params.page);
  const from = (page - 1) * CLIENTES_PAGE_SIZE;
  const to = from + CLIENTES_PAGE_SIZE - 1;
  let query = supabase
    .from("clientes")
    .select("*, websites(count), assinaturas(count)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status !== "todos") query = query.eq("status", params.status);
  const search = safeSearch(params.search);
  if (search) {
    query = query.or(
      `nome.ilike.%${search}%,empresa.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) throw new Error("Não foi possível carregar os clientes.");

  const rows = (data ?? []) as ClienteListRow[];
  return {
    items: rows.map(({ websites, assinaturas, ...cliente }) => ({
      ...cliente,
      websitesCount: countRelation(websites),
      assinaturasCount: countRelation(assinaturas),
    })),
    total: count ?? 0,
    page,
    pageSize: CLIENTES_PAGE_SIZE,
  };
}

async function countRelated(table: "websites" | "assinaturas" | "pagamentos" | "manutencoes" | "faturamentos", clienteId: string): Promise<number> {
  const { count, error } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("cliente_id", clienteId);
  if (error) throw new Error("Não foi possível verificar os vínculos do cliente.");
  return count ?? 0;
}

export async function verificarVinculos(clienteId: string): Promise<ClienteRelatedCounts> {
  await requireAuthenticatedUser();
  const [websites, assinaturas, pagamentos, manutencoes, faturamentos] = await Promise.all([
    countRelated("websites", clienteId),
    countRelated("assinaturas", clienteId),
    countRelated("pagamentos", clienteId),
    countRelated("manutencoes", clienteId),
    countRelated("faturamentos", clienteId),
  ]);
  return { websites, assinaturas, pagamentos, manutencoes, faturamentos };
}

export async function obterCliente(clienteId: string): Promise<ClienteDetail> {
  await requireAuthenticatedUser();
  const [{ data, error }, related] = await Promise.all([
    supabase.from("clientes").select("*").eq("id", clienteId).single(),
    verificarVinculos(clienteId),
  ]);
  if (error || !data) throw new Error("Não foi possível carregar os dados do cliente.");
  return { ...data, related };
}

export async function criarCliente(input: ClienteInput): Promise<Cliente> {
  await requireAuthenticatedUser();
  const { data, error } = await supabase.from("clientes").insert(input).select().single();
  if (error || !data) throw new Error("Não foi possível salvar o cliente.");
  return data;
}

export async function atualizarCliente({ id, input }: { id: string; input: TablesUpdate<"clientes"> }): Promise<Cliente> {
  await requireAuthenticatedUser();
  const { data, error } = await supabase.from("clientes").update(input).eq("id", id).select().single();
  if (error || !data) throw new Error("Não foi possível atualizar o cliente.");
  return data;
}

export async function excluirCliente(clienteId: string): Promise<void> {
  await requireAuthenticatedUser();
  const related = await verificarVinculos(clienteId);
  if (Object.values(related).some((count) => count > 0)) {
    throw new Error("Este cliente possui registros vinculados. Trate os vínculos antes de excluir.");
  }
  const { error } = await supabase.from("clientes").delete().eq("id", clienteId);
  if (error) throw new Error("Não foi possível excluir. Verifique se o cliente possui registros vinculados.");
}