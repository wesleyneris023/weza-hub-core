import { supabase } from "@/integrations/supabase/client";

export type ManutencaoStatus = "aberta" | "em_andamento" | "concluida";
export type ManutencaoPrioridade = "baixa" | "media" | "alta" | "urgente";

export type Manutencao = {
  id: string; cliente_id: string; website_id: string; titulo: string;
  descricao: string | null; tipo: string; status: ManutencaoStatus;
  prioridade: ManutencaoPrioridade; data_abertura: string;
  data_conclusao: string | null; observacoes: string | null;
  created_at: string; updated_at: string;
};

export type ManutencaoListItem = Manutencao & {
  cliente: { nome: string; empresa: string | null } | null;
  website: { nome: string; dominio: string | null } | null;
};

export type ManutencaoInput = Pick<Manutencao,
  "cliente_id" | "website_id" | "titulo" | "descricao" | "tipo" | "status" | "prioridade" | "data_abertura" | "data_conclusao" | "observacoes"
>;
export type ManutencaoClienteOption = { id: string; nome: string; empresa: string | null; status: string };
export type ManutencaoWebsiteOption = {
  id: string; cliente_id: string; nome: string; dominio: string | null; status: string;
};

export const manutencoesQueryKey = ["manutencoes"] as const;
const db = supabase as any;

// The form captures only the opening DATE, not a time. Store it at local
// midnight so a same-day completion time (e.g. 03:23) cannot precede an
// artificial noon timestamp and violate the database CHECK constraint.
function normalizeDataAbertura(input: ManutencaoInput): ManutencaoInput {
  const parsed = new Date(input.data_abertura);
  if (Number.isNaN(parsed.getTime())) return input;

  const localMidnight = new Date(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    0, 0, 0, 0,
  );

  return { ...input, data_abertura: localMidnight.toISOString() };
}

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

function throwQueryError(context: string, error: any): never {
  console.error(`[WEZA HUB] ${context}`, { code: error?.code, message: error?.message, hint: error?.hint });
  throw new Error(context);
}

export async function listarManutencoes(): Promise<ManutencaoListItem[]> {
  await requireAdminSession();
  const { data, error } = await db.from("manutencoes")
    .select("*, cliente:clientes!manutencoes_cliente_id_fkey(nome, empresa), website:websites!manutencoes_website_id_fkey(nome, dominio)")
    .order("data_abertura", { ascending: false });
  if (error) throwQueryError("Não foi possível carregar as manutenções.", error);
  return (data ?? []) as ManutencaoListItem[];
}

export async function listarClientesManutencao(): Promise<ManutencaoClienteOption[]> {
  await requireAdminSession();
  const { data, error } = await db.from("clientes").select("id, nome, empresa, status")
    .eq("status", "ativo").order("nome", { ascending: true });
  if (error) throwQueryError("Não foi possível carregar os clientes.", error);
  return (data ?? []) as ManutencaoClienteOption[];
}

export async function listarWebsitesManutencao(clienteId?: string): Promise<ManutencaoWebsiteOption[]> {
  await requireAdminSession();
  let query = db.from("websites").select("id, cliente_id, nome, dominio, status").order("nome", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throwQueryError("Não foi possível carregar os websites.", error);
  return (data ?? []) as ManutencaoWebsiteOption[];
}

export async function criarManutencao(input: ManutencaoInput): Promise<Manutencao> {
  await requireAdminSession();
  const { data, error } = await db.from("manutencoes").insert(normalizeDataAbertura(input)).select().single();
  if (error || !data) throwQueryError("Não foi possível registrar a manutenção.", error);
  return data as Manutencao;
}

export async function atualizarManutencao(id: string, input: ManutencaoInput): Promise<Manutencao> {
  await requireAdminSession();
  const { data, error } = await db.from("manutencoes").update(normalizeDataAbertura(input)).eq("id", id).select().single();
  if (error || !data) throwQueryError("Não foi possível atualizar a manutenção.", error);
  return data as Manutencao;
}
