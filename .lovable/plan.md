# WEZA HUB — Banco inicial e indicadores reais

## Objetivo
Criar a base operacional no Supabase já conectado, sem dados fictícios e sem alterar o visual do dashboard. A migration só será aplicada após esta aprovação.

## Migration proposta

### 1. Tabelas de negócio

- **clientes** — `id uuid`, `nome text`, `empresa text`, `email text`, `telefone text`, `documento text`, `status text CHECK ('ativo','inativo')`, `observacoes text`, `created_at timestamptz`, `updated_at timestamptz`.
- **websites** — `id uuid`, `cliente_id uuid NOT NULL`, `nome text`, `dominio text`, `descricao text`, `status text CHECK ('ativo','pendente','vencido','suspenso')`, `plataforma text`, `hospedagem text`, `data_inicio date`, `data_expiracao date`, `observacoes text`, timestamps.
- **planos** — `id uuid`, `nome text`, `descricao text`, `valor_mensal numeric(12,2)`, `valor_anual numeric(12,2)`, `periodo_cobranca text CHECK ('mensal','anual')`, `ativo boolean`, timestamps.
- **assinaturas** — `id uuid`, `cliente_id uuid NOT NULL`, `website_id uuid NOT NULL`, `plano_id uuid NOT NULL`, `valor numeric(12,2)`, `data_inicio date`, `proximo_vencimento date`, `status text CHECK ('ativa','pendente','atrasada','cancelada','suspensa')`, `observacoes text`, timestamps.
- **pagamentos** — `id uuid`, `cliente_id uuid NOT NULL`, `assinatura_id uuid NULL`, `valor numeric(12,2)`, `data_vencimento date`, `data_pagamento date NULL`, `status text CHECK ('pendente','pago','atrasado','cancelado')`, `metodo_pagamento text`, `referencia text`, `observacoes text`, timestamps.
- **manutencoes** — `id uuid`, `cliente_id uuid NOT NULL`, `website_id uuid NOT NULL`, `titulo text`, `descricao text`, `tipo text`, `status text CHECK ('aberta','em_andamento','concluida')`, `prioridade text CHECK ('baixa','media','alta','urgente')`, `data_abertura timestamptz`, `data_conclusao timestamptz NULL`, `observacoes text`, timestamps.
- **faturamentos** — `id uuid`, `cliente_id uuid NOT NULL`, `assinatura_id uuid NULL`, `valor numeric(12,2)`, `competencia date`, `data_vencimento date`, `data_pagamento date NULL`, `status text CHECK ('aberto','pago','atrasado','cancelado')`, `observacoes text`, timestamps.

Todos os IDs usarão `gen_random_uuid()`. Valores monetários serão não negativos. Campos essenciais (nomes, estados, valores e datas operacionais) serão `NOT NULL`; campos descritivos e datas ainda não ocorridas poderão ser nulos.

### 2. Relacionamentos e integridade

- FKs obrigatórias para cliente, website e plano conforme o escopo.
- `assinatura_id` será opcional em pagamentos e faturamentos, conforme solicitado.
- Exclusão de cliente será restrita enquanto houver registros associados, evitando perda acidental de histórico financeiro.
- Exclusão de assinatura será restrita quando houver pagamentos ou faturamentos vinculados.
- Índices em todas as FKs e em estados/datas usados pelos indicadores.
- Índices únicos para `clientes.email` e `websites.dominio` apenas quando preenchidos.
- Uma função comum atualizará `updated_at` automaticamente em todas as tabelas.

### 3. Segurança administrativa

Além das sete tabelas de negócio, a migration criará a tabela técnica **user_roles** e o enum `app_role` (`admin`, `user`). Papéis não serão armazenados em clientes ou perfis.

- RLS habilitado nas oito tabelas.
- Nenhum acesso concedido ao papel `anon`.
- `authenticated` receberá permissões de tabela, mas as policies permitirão operações somente quando `has_role(auth.uid(), 'admin')` for verdadeiro.
- `service_role` receberá acesso administrativo para rotinas internas.
- Função `has_role` será `SECURITY DEFINER`, com `search_path` fixo, evitando recursão de RLS.
- Nenhum usuário ou papel administrativo será criado automaticamente.

### 4. Dashboard após a migration

Sem mudar textos, disposição, cores ou estilo dos cartões, os quatro valores existentes passarão a exibir:

1. clientes ativos;
2. websites ativos;
3. receita mensal das assinaturas ativas;
4. manutenções abertas/em andamento.

A consulta também retornará, já tipados para uso futuro: assinaturas ativas, pagamentos pendentes, pagamentos atrasados, faturamento do mês, MRR, inadimplência e sites suspensos.

Como os dados são administrativos e não podem ser públicos, o dashboard será colocado sob autenticação e a leitura usará uma função de servidor validada pelo usuário. Sem um usuário com papel `admin`, o banco permanecerá bloqueado por padrão.

## Ordem de execução após aprovação

1. Aplicar uma única migration transacional com tabelas, grants, índices, função de timestamp, RLS e policies.
2. Atualizar os tipos Supabase do projeto.
3. Integrar autenticação administrativa e proteger o dashboard.
4. Conectar os indicadores aos agregados reais via TanStack Query, com estados de carregamento e erro sem redesenhar a interface.
5. Validar RLS, banco vazio, consultas e visual em desktop/mobile.

## Fora do escopo

- Dados de demonstração ou qualquer seed.
- Gateway de pagamento.
- Suspensão automática de sites.
- CRUD completo dos módulos.
- Alterações visuais no dashboard.
