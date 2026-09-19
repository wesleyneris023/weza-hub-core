CREATE TABLE public.vendas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  website_id uuid REFERENCES public.websites(id) ON DELETE SET NULL,
  titulo text NOT NULL CHECK (length(btrim(titulo)) > 0),
  tipo_servico text NOT NULL CHECK (length(btrim(tipo_servico)) > 0),
  valor numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
  forma_pagamento text,
  data_venda date NOT NULL DEFAULT CURRENT_DATE,
  previsao_fechamento date,
  status text NOT NULL DEFAULT 'proposta' CHECK (status IN ('proposta', 'negociacao', 'fechada', 'perdida', 'cancelada')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (previsao_fechamento IS NULL OR previsao_fechamento >= data_venda)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas TO authenticated;
GRANT ALL ON public.vendas TO service_role;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage vendas" ON public.vendas FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'))
WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE INDEX vendas_cliente_id_idx ON public.vendas(cliente_id);
CREATE INDEX vendas_website_id_idx ON public.vendas(website_id);
CREATE INDEX vendas_status_idx ON public.vendas(status);
CREATE INDEX vendas_data_venda_idx ON public.vendas(data_venda);
CREATE TRIGGER set_vendas_updated_at BEFORE UPDATE ON public.vendas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();