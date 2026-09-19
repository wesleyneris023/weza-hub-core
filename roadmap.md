# Roadmap

- [x] Apresentar a migration das 7 tabelas e a política de segurança para aprovação.
- [x] Após aprovação, aplicar a migration no Supabase conectado, sem dados fictícios.
- [x] Após a migration, conectar os indicadores existentes aos dados reais sem alterar o visual.
- [x] Validar RLS, banco vazio, rota protegida e tela de acesso.
- [ ] Vincular uma conta Supabase existente ao papel `admin` e validar os indicadores autenticados — bloqueado até existir ou ser indicada uma conta real.

## Módulo Clientes

- [x] Criar rota autenticada e navegação para Clientes sem alterar o visual global.
- [x] Implementar consulta paginada, pesquisa, filtro e contagens relacionadas.
- [x] Implementar cadastro, edição, detalhe e exclusão protegida.
- [x] Integrar notificações e invalidação do indicador de clientes ativos.
- [x] Validar estados, segurança, responsividade e fluxo público sem dados fictícios.

## Módulo Websites

- [x] Criar camada de consultas autenticadas reutilizando `public.websites` e `public.clientes` existentes.
- [x] Implementar listagem paginada, pesquisa, filtro por status e indicadores da página atual.
- [x] Implementar cadastro e edição com vínculo a cliente existente, domínio, plataforma, hospedagem e datas.
- [x] Adicionar rota autenticada `/websites` e habilitar item correspondente na navegação.
- [ ] Validar geração automática da rota, build, permissões RLS e fluxos CRUD no preview autenticado.
- [ ] Revisar os indicadores para totais globais e vencimentos, após validação funcional.

## Módulo Vendas

- [x] Criar `public.vendas` com vínculo opcional a website e obrigatório a cliente, índices, `updated_at` e RLS administrativa.
- [x] Aplicar a migration no projeto Supabase Weza 2 sem inserir registros fictícios.
- [x] Criar consultas autenticadas para listar, cadastrar e editar vendas, além de carregar clientes e websites existentes.
- [x] Criar tela de Vendas com indicadores, busca, filtro de status, estado vazio e formulário de cadastro/edição.
- [x] Adicionar rota autenticada `/vendas` e habilitar navegação.
- [ ] Atualizar/validar tipos gerados, build, rota automática e fluxos CRUD no preview autenticado.
- [ ] Confirmar a associação correta entre venda fechada, pagamento e faturamento antes de automatizar lançamentos financeiros.

## Módulo Assinaturas e Planos

- [x] Auditar e reutilizar `public.assinaturas` e `public.planos` existentes; sem migration ou dados fictícios.
- [x] Criar consultas autenticadas para listar/cadastrar/editar planos e assinaturas.
- [x] Criar tela com abas de Assinaturas e Planos, indicadores, pesquisa, filtros e estados vazios.
- [x] Criar formulários de plano e assinatura, incluindo vínculo a cliente, website e plano existentes.
- [x] Adicionar rota autenticada `/assinaturas` e habilitar navegação.
- [ ] Validar geração automática da rota, build, permissões RLS e fluxos CRUD no preview autenticado.
- [ ] Revisar o cálculo de receita recorrente e definir o vínculo financeiro com pagamentos/faturamentos antes de automatizar cobranças.
