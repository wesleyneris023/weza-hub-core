# WEZA HUB — Módulo Clientes

## Objetivo
Transformar **Clientes** em um módulo administrativo completo sobre `public.clientes`, mantendo intactos o design, a autenticação e as políticas RLS atuais. Nenhum dado fictício será criado.

## Banco e segurança

- **Nenhuma migration é necessária.** As tabelas, chaves estrangeiras, restrições de exclusão, índices e policies administrativas existentes atendem ao escopo.
- Todas as consultas usarão o cliente Supabase já conectado e a sessão autenticada; o acesso continuará dentro de `/_authenticated`.
- O frontend não receberá `service_role`, secrets nem credenciais.
- O RLS existente continuará decidindo autorização para SELECT, INSERT, UPDATE e DELETE com papel `admin`.
- A exclusão fará uma verificação amigável dos vínculos e continuará protegida pelas FKs `ON DELETE RESTRICT`, inclusive contra alterações concorrentes.

## Implementação

### 1. Estrutura compartilhada e navegação

- Extrair do dashboard o quadro comum de página (menu lateral, cabeçalho, fundo e comportamento mobile), sem mudar sua aparência.
- Ativar **Clientes** no menu e apontá-lo para `/clientes`, mantendo **Dashboard** em `/dashboard`.
- Criar a rota autenticada `/clientes` com metadados próprios e tratamento de erro.
- Montar o sistema de confirmações visuais já disponível no projeto.

### 2. Camada de dados

Criar uma camada tipada de consultas e operações para clientes:

- `listarClientes`: página limitada, ordenação por criação, filtro de status e pesquisa por nome, empresa, e-mail ou telefone.
- A listagem retornará a contagem total e as contagens agregadas de websites e assinaturas, sem carregar os registros relacionados.
- `obterCliente`: informações completas e cinco contagens relacionadas.
- `criarCliente`, `atualizarCliente` e `excluirCliente`: payloads mínimos e tipados.
- `verificarVinculos`: contagens de websites, assinaturas, pagamentos, manutenções e faturamentos antes da exclusão.
- Toda operação validará a sessão antes de consultar; mensagens técnicas serão convertidas em mensagens seguras para a interface.

### 3. Página e listagem

- Cabeçalho “Clientes”, subtítulo solicitado e botão **Novo cliente**.
- Pesquisa e filtro de status combináveis; mudança de pesquisa/filtro volta à primeira página.
- Paginação no servidor com quantidade fixa por página.
- Desktop/tablet: tabela com Cliente, Empresa, E-mail, Telefone, Status, Websites, Assinaturas e Ações.
- Celular: itens compactos e legíveis com as mesmas informações e ações, sem rolagem horizontal obrigatória.
- Estados dedicados de carregamento, erro e lista vazia, incluindo o botão **Novo cliente**.

### 4. Cadastro e edição

- Um painel lateral reutilizável com React Hook Form + Zod para nome, empresa, e-mail, telefone, documento, status e observações.
- Nome e status obrigatórios; e-mail opcional validado; envio bloqueado enquanto inválido ou em andamento.
- Cadastro usa `status = ativo` por padrão e não envia id/timestamps.
- Edição preenche os dados atuais e não altera id/created_at.
- Após sucesso: fechar painel, atualizar lista, detalhes e `dashboard-metrics`, e mostrar a confirmação apropriada.

### 5. Visualização e exclusão

- Painel de detalhes com os campos solicitados, datas formatadas e cinco resumos relacionados, inclusive zero.
- Atalhos futuros serão apresentados como destinos ainda indisponíveis, sem criar rotas ou funcionalidades dos próximos módulos.
- Menu de ações com Visualizar, Editar e Excluir.
- Excluir abre confirmação explícita; vínculos bloqueiam a ação com mensagem clara. Sem vínculos, a exclusão é executada e a lista/indicador são atualizados.

## Arquivos previstos

- Atualizar: `src/components/dashboard/dashboard-shell.tsx`, `src/components/dashboard/app-sidebar.tsx`, `src/routes/__root.tsx` e `roadmap.md`.
- Criar: rota de Clientes, camada de consultas/mutações e componentes focados de listagem, formulário, detalhes e exclusão.
- Não alterar: schema do Supabase, migrations, RLS, identidade visual ou demais módulos.

## Validação

- Verificação automática de TypeScript/build pelo ambiente.
- Testes focados de validação, filtros, paginação e tratamento de vínculos quando viáveis na estrutura atual.
- Playwright em desktop e celular para rota pública, redirecionamento sem sessão, layout e estados acessíveis.
- Como este Supabase é externo e não fornece sessão administrativa ao ambiente de teste, o fluxo autenticado real será validado até o limite disponível; qualquer bloqueio remanescente será informado sem criar usuário ou dados.
- Confirmar ao final que nenhuma migration e nenhum registro fictício foram criados.
