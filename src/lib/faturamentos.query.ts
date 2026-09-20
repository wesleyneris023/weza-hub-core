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
export type FaturamentoClienteOption = { id: string; nome: string; empresa: string | null; status: string };
export type FaturamentoAssinaturaOption = {
  id: string; cliente_id: string; status: string; valor: number; proximo_vencimento: string;
};
export const faturamentosQueryKey = ["faturamentos"] as const;
const db = supabase as any;

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

function throwQueryError(context: string, error: any): never {
  console.error(`[WEZA HUB] ${context}`, { code: error?.code, message: error?.message, hint: error?.hint });
  throw new Error(context);
}

async function validateFaturamentoInput(input: FaturamentoInput) {
  if (!input.cliente_id) throw new Error("Selecione um cliente.");
  if (!Number.isFinite(Number(input.valor)) || Number(input.valor) < 0) throw new Error("Informe um valor válido.");
  if (input.status === "pago" && !input.data_pagamento) throw new Error("Informe a data do pagamento.");
  if (input.status !== "pago" && input.data_pagamento) throw new Error("A data de pagamento só pode ser informada para faturamentos pagos.");
  if (input.assinatura_id) {
    const { data, error } = await db.from("assinaturas").select("id, cliente_id").eq("id", input.assinatura_id).maybeSingle();
    if (error) throwQueryError("Não foi possível validar a assinatura selecionada.", error);
    if (!data || data.cliente_id !== input.cliente_id) throw new Error("A assinatura selecionada não pertence ao cliente informado.");
  }
}

export async function listarFaturamentos(): Promise<FaturamentoListItem[]> {
  await requireAdminSession();
  const { data, error } = await db.from("faturamentos")
    .select("*, cliente:clientes!faturamentos_cliente_id_fkey(nome, empresa), assinatura:assinaturas!faturamentos_assinatura_id_fkey(id, status, valor)")
    .order("competencia", { ascending: false }).order("data_vencimento", { ascending: false });
  if (error) throwQueryError("Não foi possível carregar os faturamentos.", error);
  return (data ?? []) as FaturamentoListItem[];
}

export async function listarClientesFaturamento(): Promise<FaturamentoClienteOption[]> {
  await requireAdminSession();
  const { data, error } = await db.from("clientes").select("id, nome, empresa, status")
    .eq("status", "ativo").order("nome", { ascending: true });
  if (error) throwQueryError("Não foi possível carregar os clientes.", error);
  return (data ?? []) as FaturamentoClienteOption[];
}

export async function listarAssinaturasFaturamento(clienteId?: string): Promise<FaturamentoAssinaturaOption[]> {
  await requireAdminSession();
  let query = db.from("assinaturas").select("id, cliente_id, status, valor, proximo_vencimento")
    .order("proximo_vencimento", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throwQueryError("Não foi possível carregar as assinaturas.", error);
  return (data ?? []) as FaturamentoAssinaturaOption[];
}

export async function criarFaturamento(input: FaturamentoInput): Promise<Faturamento> {
  await requireAdminSession();
  await validateFaturamentoInput(input);
  const { data, error } = await db.from("faturamentos").insert(input).select().single();
  if (error || !data) throwQueryError("Não foi possível registrar o faturamento.", error);
  return data as Faturamento;
}

export async function atualizarFaturamento(id: string, input: FaturamentoInput): Promise<Faturamento> {
  await requireAdminSession();
  await validateFaturamentoInput(input);
  const { data, error } = await db.from("faturamentos").update(input).eq("id", id).select().single();
  if (error || !data) throwQueryError("Não foi possível atualizar o faturamento.", error);
  return data as Faturamento;
}
