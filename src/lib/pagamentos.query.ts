import { supabase } from "@/integrations/supabase/client";

export type PagamentoStatus = "pendente" | "pago" | "atrasado" | "cancelado";
export type Pagamento = {
  id: string; cliente_id: string; assinatura_id: string | null; faturamento_id: string | null; valor: number;
  data_vencimento: string; data_pagamento: string | null; status: PagamentoStatus;
  metodo_pagamento: string | null; referencia: string | null; observacoes: string | null;
  created_at: string; updated_at: string;
};
export type PagamentoListItem = Pagamento & {
  cliente: { nome: string; empresa: string | null } | null;
  assinatura: { id: string; status: string } | null;
};
export type PagamentoInput = Omit<Pagamento, "id" | "created_at" | "updated_at">;
export type PagamentoClienteOption = { id: string; nome: string; empresa: string | null; status: string };
export type PagamentoAssinaturaOption = {
  id: string; cliente_id: string; status: string; valor: number; proximo_vencimento: string;
};
export type PagamentoFaturamentoOption = {
  id: string; cliente_id: string; assinatura_id: string | null; competencia: string;
  valor: number; data_vencimento: string; status: string;
};
export const pagamentosQueryKey = ["pagamentos"] as const;
const db = supabase as any;

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

function throwQueryError(context: string, error: any): never {
  console.error(`[WEZA HUB] ${context}`, { code: error?.code, message: error?.message, hint: error?.hint });
  throw new Error(context);
}

async function validatePagamentoInput(input: PagamentoInput) {
  if (!input.cliente_id) throw new Error("Selecione um cliente.");
  if (!Number.isFinite(Number(input.valor)) || Number(input.valor) < 0) throw new Error("Informe um valor válido.");
  if (input.status === "pago" && !input.data_pagamento) throw new Error("Informe a data do pagamento.");
  if (input.status !== "pago" && input.data_pagamento) throw new Error("A data de pagamento só pode ser informada para pagamentos pagos.");
  if (input.assinatura_id) {
    const { data, error } = await db.from("assinaturas").select("id, cliente_id").eq("id", input.assinatura_id).maybeSingle();
    if (error) throwQueryError("Não foi possível validar a assinatura selecionada.", error);
    if (!data || data.cliente_id !== input.cliente_id) throw new Error("A assinatura selecionada não pertence ao cliente informado.");
  }
  if (input.faturamento_id) {
    const { data, error } = await db.from("faturamentos")
      .select("id, cliente_id, assinatura_id, valor")
      .eq("id", input.faturamento_id).maybeSingle();
    if (error) throwQueryError("Não foi possível validar o faturamento selecionado.", error);
    if (!data || data.cliente_id !== input.cliente_id) throw new Error("O faturamento selecionado não pertence ao cliente informado.");
    if (input.assinatura_id && data.assinatura_id !== input.assinatura_id) {
      throw new Error("A assinatura do pagamento deve corresponder à assinatura do faturamento.");
    }
    if (Number(input.valor) !== Number(data.valor)) {
      throw new Error("Para vincular este pagamento, o valor deve ser igual ao valor integral do faturamento. Pagamentos parciais ainda não são suportados.");
    }
  }
}

export async function listarPagamentos(): Promise<PagamentoListItem[]> {
  await requireAdminSession();
  const { data, error } = await db.from("pagamentos")
    .select("*, cliente:clientes!pagamentos_cliente_id_fkey(nome, empresa), assinatura:assinaturas!pagamentos_assinatura_id_fkey(id, status)")
    .order("data_vencimento", { ascending: false }).order("created_at", { ascending: false });
  if (error) throwQueryError("Não foi possível carregar os pagamentos.", error);
  return (data ?? []) as PagamentoListItem[];
}

export async function listarClientesPagamento(): Promise<PagamentoClienteOption[]> {
  await requireAdminSession();
  const { data, error } = await db.from("clientes").select("id, nome, empresa, status")
    .eq("status", "ativo").order("nome", { ascending: true });
  if (error) throwQueryError("Não foi possível carregar os clientes.", error);
  return (data ?? []) as PagamentoClienteOption[];
}

export async function listarAssinaturasPagamento(clienteId?: string): Promise<PagamentoAssinaturaOption[]> {
  await requireAdminSession();
  let query = db.from("assinaturas").select("id, cliente_id, status, valor, proximo_vencimento")
    .order("proximo_vencimento", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throwQueryError("Não foi possível carregar as assinaturas.", error);
  return (data ?? []) as PagamentoAssinaturaOption[];
}

export async function listarFaturamentosPagamento(clienteId?: string): Promise<PagamentoFaturamentoOption[]> {
  await requireAdminSession();
  let query = db.from("faturamentos")
    .select("id, cliente_id, assinatura_id, competencia, valor, data_vencimento, status")
    .neq("status", "cancelado")
    .order("data_vencimento", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throwQueryError("Não foi possível carregar os faturamentos para vinculação.", error);
  return (data ?? []) as PagamentoFaturamentoOption[];
}

export async function criarPagamento(input: PagamentoInput): Promise<Pagamento> {
  await requireAdminSession();
  await validatePagamentoInput(input);
  const { data, error } = await db.from("pagamentos").insert(input).select().single();
  if (error || !data) throwQueryError("Não foi possível registrar o pagamento.", error);
  return data as Pagamento;
}

export async function atualizarPagamento(id: string, input: PagamentoInput): Promise<Pagamento> {
  await requireAdminSession();
  await validatePagamentoInput(input);
  const { data, error } = await db.from("pagamentos").update(input).eq("id", id).select().single();
  if (error || !data) throwQueryError("Não foi possível atualizar o pagamento.", error);
  return data as Pagamento;
}
