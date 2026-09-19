# Roadmap

## Auditoria técnica inicial — 19/09/2026

- [x] Conferir estrutura real do Supabase: 8 tabelas administrativas presentes, todas com RLS habilitado.
- [x] Conferir políticas: operações administrativas nas tabelas de negócio exigem `authenticated` + `private.has_role(auth.uid(), 'admin')`.
- [x] Conferir função `private.has_role`: `SECURITY DEFINER`, consulta restrita à tabela `public.user_roles`.
- [x] Conferir integridade dos vínculos existentes: nenhuma divergência encontrada entre cliente/website/assinatura em vendas, manutenção, pagamentos e faturamentos.
- [x] Conferir registros sem alterar ou inserir dados: clientes 1, websites 1, vendas 0, assinaturas 1, pagamentos 1, faturamentos 1, manutenções 1. Há registros de validação existentes; foram preservados.
- [ ] Confirmar que o usuário autenticado no preview corresponde ao único papel `admin` existente; ainda não validado ponta a ponta.
- [ ] Corrigir/validar vencimento derivado: registros não pagos com vencimento anterior à data atual devem aparecer como atrasados nos indicadores, filtros e badges, sem modificar automaticamente o banco.
- [ ] Validar os vínculos de cliente com assinatura/website no formulário e reforçar integridade no banco quando a abordagem estiver definida.
- [ ] Executar build/lint e validar rotas/CRUD no ambiente da aplicação; a leitura do GitHub/Supabase não executa o projeto.
- [ ] Revisar alerta Supabase de proteção contra senhas vazadas desabilitada e habilitar no painel Auth após aprovação/configuração.
- [ ] Revisar os 9 alertas de performance de RLS (`auth.uid()` reavaliado por linha) e otimizar políticas com migration após revisão.
- [ ] Revisar o arquivo `.env` rastreado no repositório público. Confirmar o conteúdo sem expor valores; se contiver credenciais, removê-lo do histórico conforme necessário e rotacionar as chaves.

## Busca rápida global

- [x] Substituir o selo “Em breve” por busca rápida funcional de módulos e páginas no cabeçalho.
- [x] Adicionar filtragem por nome/descrição e navegação direta para as rotas autenticadas existentes.
- [ ] Validar visualmente no preview desktop e responsivo.

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

## Módulo Pagamentos

- [x] Auditar e reutilizar `public.pagamentos`; tabela já possui cliente, assinatura opcional, valor, vencimento, data paga, status, método, referência e observações.
- [x] Confirmar RLS habilitado e policy administrativa existente; sem migration ou registros fictícios.
- [x] Criar consultas autenticadas para listar, cadastrar e editar pagamentos, além de carregar clientes e assinaturas.
- [x] Criar tela com indicadores, busca, filtro por status, estado vazio e formulário de cadastro/edição.
- [x] Adicionar rota autenticada `/pagamentos` e habilitar navegação.
- [ ] Validar geração automática da rota, build, permissões RLS e fluxos CRUD no preview autenticado.
- [ ] Definir conciliação com faturamentos e automatizações apenas após validar os fluxos financeiros.

## Módulo Faturamento

- [x] Auditar e reutilizar `public.faturamentos`, já existente, com vínculo obrigatório a cliente e opcional a assinatura; sem migration ou dados fictícios.
- [x] Confirmar RLS habilitado com policy administrativa para operações autenticadas.
- [x] Confirmar implementação existente de consultas autenticadas para listar, cadastrar e editar faturamentos.
- [x] Confirmar tela existente com indicadores, busca, filtro por status, estado vazio e formulário de cadastro/edição.
- [ ] Validar rota `/faturamento`, navegação, geração automática de rota e build no preview autenticado.
- [ ] Testar CRUD com registros reais de teste autorizados, vínculo cliente/assinatura, datas e status de pagamento.
- [ ] Revisar regra de vencimento: registros abertos com data passada devem ser exibidos/filtrados coerentemente como atrasados, sem criar cobranças automáticas.
- [ ] Definir conciliação entre faturamento e pagamentos antes de automatizar lançamentos.
