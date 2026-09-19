import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const WEBSITES_PAGE_SIZE = 10;
export const websitesQueryKey = ["websites"] as const;

export type Website = Tables<"websites">;
export type WebsiteStatus = "ativo" | "pendente" | "vencido" | "suspenso";
export type WebsiteInput = Pick<
  TablesInsert<"websites">,
  | "cliente_id"
  | "nome"
  | "dominio"
  | "descricao"
  | "status"
  | "plataforma"
  | "hospedagem"
  | "data_inicio"
  | "data_expiracao"
  | "observacoes"
>;

export interface WebsiteListItem extends Website {
  cliente: { nome: string; empresa: string | null } | null;
}

export interface WebsiteListResult {
  items: WebsiteListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WebsiteListParams {
  page: number;
  search: string;
  status: "todos" | WebsiteStatus;
}

async function requireAuthenticatedUser(): Promise<void> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

function safeSearch(value: string): string {
  return value.trim().replace(/[%_,()]/g, " ").replace(/\s+/g, " ");
}

export async function listarWebsites(params: WebsiteListParams): Promise<WebsiteListResult> {
  await requireAuthenticatedUser();
  const page = Math.max(1, params.page);
  const from = (page - 1) * WEBSITES_PAGE_SIZE;
  const to = from + WEBSITES_PAGE_SIZE - 1;
  let query = supabase
    .from("websites")
    .select("*, clientes(nome, empresa)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (params.status !== "todos") query = query.eq("status", params.status);
  const search = safeSearch(params.search);
  if (search) query = query.or(`nome.ilike.%${search}%,dominio.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) throw new Error("Não foi possível carregar os websites.");

  return {
    items: (data ?? []) as unknown as WebsiteListItem[],
    total: count ?? 0,
    page,
    pageSize: WEBSITES_PAGE_SIZE,
  };
}

export async function listarClientesParaWebsite(): Promise<
  Pick<Tables<"clientes">, "id" | "nome" | "empresa" | "status">[]
> {
  await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nome, empresa, status")
    .order("nome", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os clientes.");
  return data ?? [];
}

export async function criarWebsite(input: WebsiteInput): Promise<Website> {
  await requireAuthenticatedUser();
  const { data, error } = await supabase.from("websites").insert(input).select().single();
  if (error || !data) throw new Error("Não foi possível cadastrar o website.");
  return data;
}

export async function atualizarWebsite({
  id,
  input,
}: {
  id: string;
  input: TablesUpdate<"websites">;
}): Promise<Website> {
  await requireAuthenticatedUser();
  const { data, error } = await supabase
    .from("websites")
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) throw new Error("Não foi possível atualizar o website.");
  return data;
}
