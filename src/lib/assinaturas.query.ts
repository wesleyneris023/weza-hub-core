import { supabase } from "@/integrations/supabase/client";

export type Plano = {
  id: string; nome: string; descricao: string | null; valor_mensal: number; valor_anual: number;
  periodo_cobranca: "mensal" | "anual"; ativo: boolean; created_at: string; updated_at: string;
};
export type AssinaturaStatus = "ativa" | "pendente" | "atrasada" | "cancelada" | "suspensa";
export type Assinatura = {
  id: string; cliente_id: string; website_id: string; plano_id: string; valor: number;
  data_inicio: string; proximo_vencimento: string; status: AssinaturaStatus;
  observacoes: string | null; created_at: string; updated_at: string;
};
export type AssinaturaListItem = Assinatura & {
  cliente: { nome: string; empresa: string | null } | null;
  website: { nome: string } | null;
  plano: { nome: string; periodo_cobranca: "mensal" | "anual" } | null;
};
export type PlanoInput = Pick<Plano, "nome" | "descricao" | "valor_mensal" | "valor_anual" | "periodo_cobranca" | "ativo">;
export type AssinaturaInput = Pick<Assinatura, "cliente_id" | "website_id" | "plano_id" | "valor" | "data_inicio" | "proximo_vencimento" | "status" | "observacoes">;
export const assinaturasQueryKey = ["assinaturas"] as const;
export const planosQueryKey = ["planos"] as const;
const db = supabase as any;

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

export async function listarAssinaturas(): Promise<AssinaturaListItem[]> {
  await requireAdminSession();
  const { data, error } = await db.from("assinaturas")
    .select("*, clientes(nome, empresa), websites(nome), planos(nome, periodo_cobranca)")
    .order("proximo_vencimento", { ascending: true }).order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar as assinaturas.");
  return (data ?? []).map((row: any) => ({ ...row, plano: row.planos ?? null, planos: undefined })) as AssinaturaListItem[];
}

export async function listarPlanos(): Promise<Plano[]> {
  await requireAdminSession();
  const { data, error } = await db.from("planos").select("*").order("nome", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os planos.");
  return (data ?? []) as Plano[];
}

export async function listarClientesAssinatura() {
  await requireAdminSession();
  const { data, error } = await db.from("clientes").select("id, nome, empresa, status")
    .eq("status", "ativo").order("nome", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os clientes.");
  return data ?? [];
}

export async function listarWebsitesAssinatura(clienteId?: string) {
  await requireAdminSession();
  let query = db.from("websites").select("id, nome, cliente_id").order("nome", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar os websites.");
  return data ?? [];
}

export async function criarPlano(input: PlanoInput): Promise<Plano> {
  await requireAdminSession();
  const { data, error } = await db.from("planos").insert(input).select().single();
  if (error || !data) throw new Error("Não foi possível criar o plano.");
  return data as Plano;
}
export async function atualizarPlano(id: string, input: PlanoInput): Promise<Plano> {
  await requireAdminSession();
  const { data, error } = await db.from("planos").update(input).eq("id", id).select().single();
  if (error || !data) throw new Error("Não foi possível atualizar o plano.");
  return data as Plano;
}
export async function criarAssinatura(input: AssinaturaInput): Promise<Assinatura> {
  await requireAdminSession();
  const { data, error } = await db.from("assinaturas").insert(input).select().single();
  if (error || !data) throw new Error("Não foi possível criar a assinatura.");
  return data as Assinatura;
}
export async function atualizarAssinatura(id: string, input: AssinaturaInput): Promise<Assinatura> {
  await requireAdminSession();
  const { data, error } = await db.from("assinaturas").update(input).eq("id", id).select().single();
  if (error || !data) throw new Error("Não foi possível atualizar a assinatura.");
  return data as Assinatura;
}
