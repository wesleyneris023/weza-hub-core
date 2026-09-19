import { supabase } from "@/integrations/supabase/client";

export type FaturamentoStatus = "aberto" | "pago" | "atrasado" | "cancelado";
export type Faturamento = {
  id: string; cliente_id: string; assinatura_id: string | null; competencia: string;
  valor: number; data_vencimento: string; data_pagamento: string | null;
  status: FaturamentoStatus; observacoes: string | null; created_at: string; updated_at: string;
};
export type FaturamentoListItem = Faturamento & {
  cliente: { nome: string; empresa: string | null } | null;
  assinatura: { id: string; status: string; valor: number } | null;
};
export type FaturamentoInput = Omit<Faturamento, "id" | "created_at" | "updated_at">;
export const faturamentosQueryKey = ["faturamentos"] as const;
const db = supabase as any;

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

export async function listarFaturamentos(): Promise<FaturamentoListItem[]> {
  await requireAdminSession();
  const { data, error } = await db.from("faturamentos")
    .select("*, cliente:clientes(nome, empresa), assinatura:assinaturas(id, status, valor)")
    .order("competencia", { ascending: false }).order("data_vencimento", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os faturamentos.");
  return (data ?? []) as FaturamentoListItem[];
}

export async function listarClientesFaturamento() {
  await requireAdminSession();
  const { data, error } = await db.from("clientes").select("id, nome, empresa, status")
    .eq("status", "ativo").order("nome", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os clientes.");
  return data ?? [];
}

export async function listarAssinaturasFaturamento(clienteId?: string) {
  await requireAdminSession();
  let query = db.from("assinaturas").select("id, cliente_id, status, valor, proximo_vencimento")
    .order("proximo_vencimento", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar as assinaturas.");
  return data ?? [];
}

export async function criarFaturamento(input: FaturamentoInput): Promise<Faturamento> {
  await requireAdminSession();
  const { data, error } = await db.from("faturamentos").insert(input).select().single();
  if (error || !data) throw new Error("Não foi possível registrar o faturamento.");
  return data as Faturamento;
}

export async function atualizarFaturamento(id: string, input: FaturamentoInput): Promise<Faturamento> {
  await requireAdminSession();
  const { data, error } = await db.from("faturamentos").update(input).eq("id", id).select().single();
  if (error || !data) throw new Error("Não foi possível atualizar o faturamento.");
  return data as Faturamento;
}
