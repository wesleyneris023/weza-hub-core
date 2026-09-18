CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
CREATE POLICY "Admins can view user roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (length(btrim(nome)) > 0),
  empresa text,
  email text,
  telefone text,
  documento text,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage clientes" ON public.clientes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.websites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  nome text NOT NULL CHECK (length(btrim(nome)) > 0),
  dominio text,
  descricao text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'vencido', 'suspenso')),
  plataforma text,
  hospedagem text,
  data_inicio date,
  data_expiracao date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data_expiracao IS NULL OR data_inicio IS NULL OR data_expiracao >= data_inicio)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.websites TO authenticated;
GRANT ALL ON public.websites TO service_role;
ALTER TABLE public.websites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage websites" ON public.websites FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (length(btrim(nome)) > 0),
  descricao text,
  valor_mensal numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_mensal >= 0),
  valor_anual numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_anual >= 0),
  periodo_cobranca text NOT NULL CHECK (periodo_cobranca IN ('mensal', 'anual')),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planos TO authenticated;
GRANT ALL ON public.planos TO service_role;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage planos" ON public.planos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  website_id uuid NOT NULL REFERENCES public.websites(id) ON DELETE RESTRICT,
  plano_id uuid NOT NULL REFERENCES public.planos(id) ON DELETE RESTRICT,
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  data_inicio date NOT NULL,
  proximo_vencimento date NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('ativa', 'pendente', 'atrasada', 'cancelada', 'suspensa')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assinaturas TO authenticated;
GRANT ALL ON public.assinaturas TO service_role;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage assinaturas" ON public.assinaturas FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  assinatura_id uuid REFERENCES public.assinaturas(id) ON DELETE RESTRICT,
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  data_vencimento date NOT NULL,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  metodo_pagamento text,
  referencia text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pagamentos TO authenticated;
GRANT ALL ON public.pagamentos TO service_role;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage pagamentos" ON public.pagamentos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  website_id uuid NOT NULL REFERENCES public.websites(id) ON DELETE RESTRICT,
  titulo text NOT NULL CHECK (length(btrim(titulo)) > 0),
  descricao text,
  tipo text NOT NULL CHECK (length(btrim(tipo)) > 0),
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'concluida')),
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  data_abertura timestamptz NOT NULL DEFAULT now(),
  data_conclusao timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (data_conclusao IS NULL OR data_conclusao >= data_abertura)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.manutencoes TO authenticated;
GRANT ALL ON public.manutencoes TO service_role;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage manutencoes" ON public.manutencoes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.faturamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
  assinatura_id uuid REFERENCES public.assinaturas(id) ON DELETE RESTRICT,
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  competencia date NOT NULL,
  data_vencimento date NOT NULL,
  data_pagamento date,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'pago', 'atrasado', 'cancelado')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faturamentos TO authenticated;
GRANT ALL ON public.faturamentos TO service_role;
ALTER TABLE public.faturamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage faturamentos" ON public.faturamentos FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE UNIQUE INDEX clientes_email_unique_idx ON public.clientes (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX websites_dominio_unique_idx ON public.websites (lower(dominio)) WHERE dominio IS NOT NULL;
CREATE INDEX clientes_status_idx ON public.clientes(status);
CREATE INDEX websites_cliente_id_idx ON public.websites(cliente_id);
CREATE INDEX websites_status_idx ON public.websites(status);
CREATE INDEX planos_ativo_idx ON public.planos(ativo);
CREATE INDEX assinaturas_cliente_id_idx ON public.assinaturas(cliente_id);
CREATE INDEX assinaturas_website_id_idx ON public.assinaturas(website_id);
CREATE INDEX assinaturas_plano_id_idx ON public.assinaturas(plano_id);
CREATE INDEX assinaturas_status_idx ON public.assinaturas(status);
CREATE INDEX assinaturas_proximo_vencimento_idx ON public.assinaturas(proximo_vencimento);
CREATE INDEX pagamentos_cliente_id_idx ON public.pagamentos(cliente_id);
CREATE INDEX pagamentos_assinatura_id_idx ON public.pagamentos(assinatura_id);
CREATE INDEX pagamentos_status_idx ON public.pagamentos(status);
CREATE INDEX pagamentos_data_vencimento_idx ON public.pagamentos(data_vencimento);
CREATE INDEX manutencoes_cliente_id_idx ON public.manutencoes(cliente_id);
CREATE INDEX manutencoes_website_id_idx ON public.manutencoes(website_id);
CREATE INDEX manutencoes_status_idx ON public.manutencoes(status);
CREATE INDEX faturamentos_cliente_id_idx ON public.faturamentos(cliente_id);
CREATE INDEX faturamentos_assinatura_id_idx ON public.faturamentos(assinatura_id);
CREATE INDEX faturamentos_status_idx ON public.faturamentos(status);
CREATE INDEX faturamentos_competencia_idx ON public.faturamentos(competencia);

CREATE TRIGGER set_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_websites_updated_at BEFORE UPDATE ON public.websites FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_planos_updated_at BEFORE UPDATE ON public.planos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_assinaturas_updated_at BEFORE UPDATE ON public.assinaturas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_pagamentos_updated_at BEFORE UPDATE ON public.pagamentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_manutencoes_updated_at BEFORE UPDATE ON public.manutencoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_faturamentos_updated_at BEFORE UPDATE ON public.faturamentos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();