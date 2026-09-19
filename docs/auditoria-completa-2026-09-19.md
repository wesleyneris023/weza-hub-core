# Auditoria técnica — WEZA HUB

**Data:** 19/09/2026  
**Repositório:** `wesleyneris023/weza-hub-core`  
**Supabase:** projeto `oocjtlipoobydsvwxqlo` (sa-east-1)

## Escopo e limites

Auditoria estática do GitHub, inspeção do schema/policies/advisors do Supabase e validação visual do preview pelo usuário. O preview voltou a abrir e exibir dados após a restauração das variáveis. Foram adicionadas correção de status efetivo de vencimento e automação de qualidade no GitHub Actions. O workflow ainda precisa concluir a primeira execução; lint, typecheck e build não foram verificados localmente nesta auditoria. Auditoria aberta; não declarar pronto para produção.

## Incidente crítico — preview falhou após remoção do `.env`

O arquivo `src/integrations/supabase/client.ts` exige `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e lança erro durante inicialização quando ausentes. A remoção do `.env` do Git foi seguida por falha global em `/auth`; a sequência é compatível com a ausência dessas variáveis e constitui a causa imediata mais provável.

**Mitigação aplicada:** `.env` foi restaurado e houve correção do valor da variável Vite em commits anteriores. O usuário confirmou visualmente que o preview voltou a abrir e que Clientes, Websites, Assinaturas, Pagamentos, Faturamento e Manutenção exibem registros; Vendas abre sem erro e sem registros. Essa confirmação é visual, não substitui build ou testes automatizados.

**Risco ainda aberto:** `.env` permanece versionado no repositório para preservar a inicialização atual do preview. A chave vista na cópia inspecionada era publishable/anon, não `service_role`. Não remover o arquivo novamente até configurar e validar as variáveis no ambiente de build/preview. Revisar histórico Git antes de concluir a auditoria de credenciais; nunca expor valores de chaves em logs ou documentação.

## Achados e ações

### Falha de carregamento de módulos — correção visualmente validada, causa original não isolada

O schema contém FKs simples e compostas apontando para as mesmas tabelas. Os selects PostgREST precisavam indicar a constraint para evitar possível ambiguidade (`PGRST201`). Os selects explícitos foram aplicados em:
- Pagamentos: `pagamentos_cliente_id_fkey` e `pagamentos_assinatura_id_fkey`.
- Faturamento: `faturamentos_cliente_id_fkey` e `faturamentos_assinatura_id_fkey`.
- Manutenção: `manutencoes_cliente_id_fkey` e `manutencoes_website_id_fkey`.
- Assinaturas: `assinaturas_cliente_id_fkey`, `assinaturas_website_id_fkey` e `assinaturas_plano_id_fkey`.
- Vendas: `vendas_cliente_id_fkey` e `vendas_website_id_fkey`.

O usuário confirmou que as páginas voltaram a carregar. Como houve também incidente de ambiente, não é possível atribuir com certeza a causa original somente à ambiguidade dos relacionamentos.

### Correção aplicada — vencimento efetivo em Pagamentos e Faturamento

Os dois módulos agora calculam o status exibido: quando o registro não está pago nem cancelado e `data_vencimento` é anterior à data local atual, ele é considerado `atrasado`. O status calculado é usado no filtro, badge, total em aberto e contador de vencidos. A correção é somente de apresentação/cálculo; não grava alteração automática no banco. Aguardando validação visual no preview.

### Qualidade/CI — workflow adicionado

Criado `.github/workflows/quality-checks.yml`, acionado em push para `main` e pull requests para `main`, com etapas de instalação de dependências, ESLint, `tsc --noEmit` e build de produção (Node 22). O repositório não contém `package-lock.json`; por isso o workflow usa `npm install`, não `npm ci`. A primeira execução precisa confirmar se os comandos passam; sem lockfile, a instalação não é estritamente reproduzível.

### Média — alerta de segurança Supabase

Advisor de segurança consultado em 19/09/2026 reporta **Leaked Password Protection Disabled**. Recomenda-se habilitar a proteção contra senhas comprometidas nas configurações de Auth. A alteração ainda não foi aplicada.

### Baixa/média — índices

Advisor de performance consultado em 19/09/2026 reporta cinco FKs compostas sem índice de cobertura: `assinaturas_website_cliente_fkey`, `faturamentos_assinatura_cliente_fkey`, `manutencoes_website_cliente_fkey`, `pagamentos_assinatura_cliente_fkey` e `vendas_website_cliente_fkey`. Avaliar índices com colunas na mesma ordem da FK e benefício real antes de aplicar. O advisor também sinaliza dez índices não utilizados; não remover sem observar carga representativa.

## Banco de dados — estado observado

As tabelas públicas `user_roles`, `clientes`, `websites`, `planos`, `assinaturas`, `pagamentos`, `manutencoes`, `faturamentos` e `vendas` estão com RLS habilitado. A consulta a `pg_policies` confirmou policies para `authenticated`; gerenciamento exige `private.has_role((select auth.uid()), 'admin')`. `user_roles` permite SELECT administrativo. Isso é uma boa barreira de banco, mas não substitui testes com contas admin/não-admin/anônima. O registro admin existente ainda precisa ser comparado com a conta efetivamente usada no preview, sem expor dados pessoais.

As tabelas têm FKs e restrições que reforçam vínculos entre cliente, website e assinatura. A existência dessas constraints foi confirmada; a validação de fluxos reais de CRUD permanece pendente.

Migrações listadas:
- `20260918011023`
- `20260918011216`
- `20260919012458` — `create_vendas_table`
- `20260919221151` — `optimize_admin_rls_initplan`
- `20260919221222` — `wrap_auth_uid_in_admin_policies`
- `20260919221240` — `enforce_client_relationship_integrity`

## Pendências

1. Confirmar primeira execução do workflow (lint, typecheck e build) e avaliar/adicionar lockfile.
2. Validar visualmente vencimentos em Pagamentos e Faturamento, incluindo filtro e badges.
3. Revisar guards e RLS; testar acesso anônimo, não-admin e admin, incluindo acesso cruzado.
4. Testar CRUD e integridade dos módulos sem dados fictícios em produção.
5. Conferir datas/timezone, formulários, estados de erro/vazio, responsividade e sincronização Lovable.
6. Habilitar proteção contra senhas comprometidas; avaliar índices.
7. Confirmar vínculo da conta admin e recuperação/logout.
8. Revisar histórico Git para verificar que nenhum segredo privilegiado foi versionado e migrar configuração para ambiente seguro sem derrubar o preview.

## Conclusão provisória

O preview está novamente acessível e o usuário confirmou visualmente o carregamento dos módulos. A correção de vencimentos e o workflow de CI foram enviados, mas aguardam validação automatizada/visual. Permanecem pendentes testes de segurança operacional e validação ponta a ponta. Auditoria **em andamento**; não considerar o WEZA HUB aprovado para produção até fechar as pendências.