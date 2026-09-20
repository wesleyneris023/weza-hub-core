import type { Database } from "./types";

/** Narrow, schema-verified extension for the existing vendas table. */
type VendaTable = {
  Row: {
    id: string;
    cliente_id: string;
    website_id: string | null;
    titulo: string;
    tipo_servico: string;
    valor: number;
    forma_pagamento: string | null;
    data_venda: string;
    previsao_fechamento: string | null;
    status: string;
    observacoes: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    cliente_id: string;
    website_id?: string | null;
    titulo: string;
    tipo_servico: string;
    valor?: number;
    forma_pagamento?: string | null;
    data_venda?: string;
    previsao_fechamento?: string | null;
    status?: string;
    observacoes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    cliente_id?: string;
    website_id?: string | null;
    titulo?: string;
    tipo_servico?: string;
    valor?: number;
    forma_pagamento?: string | null;
    data_venda?: string;
    previsao_fechamento?: string | null;
    status?: string;
    observacoes?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [
    {
      foreignKeyName: "vendas_cliente_id_fkey";
      columns: ["cliente_id"];
      isOneToOne: false;
      referencedRelation: "clientes";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "vendas_website_id_fkey";
      columns: ["website_id"];
      isOneToOne: false;
      referencedRelation: "websites";
      referencedColumns: ["id"];
    },
    {
      foreignKeyName: "vendas_website_cliente_fkey";
      columns: ["website_id", "cliente_id"];
      isOneToOne: false;
      referencedRelation: "websites";
      referencedColumns: ["id", "cliente_id"];
    },
  ];
};

export type DatabaseWithVendas = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables"> & {
    Tables: Database["public"]["Tables"] & { vendas: VendaTable };
  };
};
