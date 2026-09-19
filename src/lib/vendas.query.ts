import { supabase } from "@/integrations/supabase/client";

export type VendaStatus = "proposta" | "negociacao" | "fechada" | "perdida" | "cancelada";
export type Venda = {
  id: string; cliente_id: string; website_id: string | null; titulo: string; tipo_servico: string;
  valor: number; forma_pagamento: string | null; data_venda: string; previsao_fechamento: string | null;
  status: VendaStatus; observacoes: string | null; created_at: string; updated_at: string;
};
export type VendaListItem = Venda & { cliente: { nome: string; empresa: string | null } | null; website: { nome: string } | null };
export type VendaInput = Omit<Venda, "id" | "created_at" | "updated_at">;
export const vendasQueryKey = ["vendas"] as const;
const db = supabase as any;

async function requireAdminSession() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sua sessão expirou. Entre novamente.");
}

export async function listarVendas(): Promise<VendaListItem[]> {
  await requireAdminSession();
  const { data, error } = await db.from("vendas")
    .select("*, clientes(nome, empresa), websites(nome)")
    .order("data_venda", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error("Não foi possível carregar as vendas.");
  return (data ?? []) as VendaListItem[];
}

export async function listarClientesVenda() {
  await requireAdminSession();
  const { data, error } = await db.from("clientes").select("id, nome, empresa, status")
    .eq("status", "ativo").order("nome", { ascending: true });
  if (error) throw new Error("Não foi possível carregar os clientes.");
  return data ?? [];
}

export async function listarWebsitesVenda(clienteId?: string) {
  await requireAdminSession();
  let query = db.from("websites").select("id, nome, cliente_id").order("nome", { ascending: true });
  if (clienteId) query = query.eq("cliente_id", clienteId);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível carregar os websites.");
  return data ?? [];
}

export async function criarVenda(input: VendaInput): Promise<Venda> {
  await requireAdminSession();
  const { data, error } = await db.from("vendas").insert(input).select().single();
  if (error || !data) throw new Error("Não foi possível registrar a venda.");
  return data as Venda;
}

export async function atualizarVenda(id: string, input: VendaInput): Promise<Venda> {
  await requireAdminSession();
  const { data, error } = await db.from("vendas").update(input).eq("id", id).select().single();
  if (error || !data) throw new Error("Não foi possível atualizar a venda.");
  return data as Venda;
}
