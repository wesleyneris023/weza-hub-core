import { supabase } from "@/integrations/supabase/client";

export type PagamentoStatus = "pendente" | "pago" | "atrasado" | "cancelado";
export type Pagamento = {
  id: string; cliente_id: string; assinatura_id: string | null; valor: number;
  data_vencimento: string; data_pagamento: string | null; status: PagamentoStatus;
  metodo_pagamento: string | null; referencia: string | null; observacoes: string | null;
  created_at: string; updated_at: string;
};
export type PagamentoListItem = Pagamento & {
  cliente: { nome: string; empresa: string | null } | null;
  assinatura: { id: string; status: string } | null;
};
export type PagamentoInput = Omit<Pagamento, "id" | "created_at" | "updated_at">;
export const pagamentosQueryKey = ["pagamentos"] as const;
const db = supabase as any;

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

export async function listarPagamentos(): Promise<PagamentoListItem[]> {
  await requireAdminSession();
  const { data, error } = await db.from("pagamentos")
    .select("*, clientes(nome, empresa), assinaturas(id, status)")
    .order("data_vencimento", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar os pagamentos.");
  return (data ?? []) as PagamentoListItem[];
}

export async function listarClientesPagamento() {
  await requireAdminSession();
  const { data, error } = await db.from("clientes").select("id, nome, empresa, status")
    .eq("status", "ativo").order("nome", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os clientes.");
  return data ?? [];
}

export async function listarAssinaturasPagamento(clienteId?: string) {
  await requireAdminSession();
  let query = db.from("assinaturas").select("id, cliente_id, status, valor, proximo_vencimento")
    .order("proximo_vencimento", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar as assinaturas.");
  return data ?? [];
}

export async function criarPagamento(input: PagamentoInput): Promise<Pagamento> {
  await requireAdminSession();
  const { data, error } = await db.from("pagamentos").insert(input).select().single();
  if (error || !data) throw new Error("Não foi possível registrar o pagamento.");
  return data as Pagamento;
}

export async function atualizarPagamento(id: string, input: PagamentoInput): Promise<Pagamento> {
  await requireAdminSession();
  const { data, error } = await db.from("pagamentos").update(input).eq("id", id).select().single();
  if (error || !data) throw new Error("Não foi possível atualizar o pagamento.");
  return data as Pagamento;
}
