import { supabase } from "@/integrations/supabase/client";

export type ManutencaoStatus = "aberta" | "em_andamento" | "concluida";
export type ManutencaoPrioridade = "baixa" | "media" | "alta" | "urgente";

export type Manutencao = {
  id: string;
  cliente_id: string;
  website_id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  status: ManutencaoStatus;
  prioridade: ManutencaoPrioridade;
  data_abertura: string;
  data_conclusao: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type ManutencaoListItem = Manutencao & {
  cliente: { nome: string; empresa: string | null } | null;
  website: { nome: string; dominio: string | null } | null;
};

export type ManutencaoInput = Pick<Manutencao,
  "cliente_id" | "website_id" | "titulo" | "descricao" | "tipo" | "status" | "prioridade" | "data_conclusao" | "observacoes"
>;

export const manutencoesQueryKey = ["manutencoes"] as const;
const db = supabase as any;

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

export async function listarManutencoes(): Promise<ManutencaoListItem[]> {
  await requireAdminSession();
  const { data, error } = await db.from("manutencoes")
    .select("*, clientes(nome, empresa), websites(nome, dominio)")
    .order("data_abertura", { ascending: false });
  if (error) throw new Error("Não foi possível carregar as manutenções.");
  return (data ?? []) as ManutencaoListItem[];
}

export async function listarClientesManutencao() {
  await requireAdminSession();
  const { data, error } = await db.from("clientes").select("id, nome, empresa, status")
    .eq("status", "ativo").order("nome", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os clientes.");
  return data ?? [];
}

export async function listarWebsitesManutencao(clienteId?: string) {
  await requireAdminSession();
  let query = db.from("websites").select("id, cliente_id, nome, dominio, status")
    .order("nome", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar os websites.");
  return data ?? [];
}

export async function criarManutencao(input: ManutencaoInput): Promise<Manutencao> {
  await requireAdminSession();
  const { data, error } = await db.from("manutencoes").insert(input).select().single();
  if (error || !data) throw new Error("Não foi possível registrar a manutenção.");
  return data as Manutencao;
}

export async function atualizarManutencao(id: string, input: ManutencaoInput): Promise<Manutencao> {
  await requireAdminSession();
  const { data, error } = await db.from("manutencoes").update(input).eq("id", id).select().single();
  if (error || !data) throw new Error("Não foi possível atualizar a manutenção.");
  return data as Manutencao;
}
