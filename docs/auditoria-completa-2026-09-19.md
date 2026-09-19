# Auditoria técnica — WEZA HUB

**Data:** 19/09/2026  
**Repositório:** `wesleyneris023/weza-hub-core`  
**Supabase:** projeto `oocjtlipoobydsvwxqlo` (sa-east-1)

## Escopo e limites

Auditoria estática do GitHub e inspeção do schema, policies e advisors do Supabase. Foram aplicadas alterações em selects relacionais. O preview apresentou falha global após mudanças recentes; o build, testes e validação ponta a ponta ainda não foram executados. Auditoria aberta; não declarar pronto para produção.

## Incidente crítico — preview falhou após remoção do `.env`

O arquivo `src/integrations/supabase/client.ts` exige `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e lança erro durante inicialização quando ausentes. O `.env` foi removido do Git, eliminando a fonte dessas variáveis no preview baseado no repositório. A tela `/auth` passou a exibir “This page didn't load”. Essa sequência é compatível com a falha global observada e é a causa imediata mais provável.

**Mitigação aplicada:** `.env` foi restaurado no commit `e00ee98763f0120653a4c0a6d12347bfd096d302`; a chave presente é a chave pública/anon do Supabase, não uma `service_role`. Houve correção do valor da variável Vite em `26bd1897135fc8724cfefd530e50de6141b387ab`. Aguardando rebuild/restart e validação do preview. No futuro, migrar esses valores para configuração de ambiente suportada pelo host/Lovable antes de remover o arquivo novamente. Não remover `.env` sem garantir injeção das variáveis exigidas.

## Achados e ações

### Falha de carregamento de módulos — hipótese secundária

O schema contém FKs simples e compostas apontando para as mesmas tabelas. Os selects PostgREST dos módulos faziam embeds sem indicar a constraint, situação compatível com `PGRST201`.

**Correções aplicadas no GitHub** indicando FKs explícitas:
- Pagamentos: `pagamentos_cliente_id_fkey` e `pagamentos_assinatura_id_fkey`.
- Faturamento: `faturamentos_cliente_id_fkey` e `faturamentos_assinatura_id_fkey`.
- Manutenção: `manutencoes_cliente_id_fkey` e `manutencoes_website_id_fkey`.
- Assinaturas: `assinaturas_cliente_id_fkey`, `assinaturas_website_id_fkey` e `assinaturas_plano_id_fkey`.
- Vendas: `vendas_cliente_id_fkey` e `vendas_website_id_fkey`.

Os selects explícitos podem resolver falhas específicas nos módulos, mas a tela global `/auth` indica erro anterior ao carregamento desses módulos. Não tratar a hipótese de ambiguidade como causa confirmada sem testar novamente.

### Média — vencimento não é normalizado na listagem financeira

Pagamentos e Faturamento ainda filtram/exibem o status persistido diretamente. Indicadores calculam vencimentos separadamente, podendo divergir da badge e do filtro “Atrasado”. Pendente: derivar status efetivo de itens não pagos/não cancelados com vencimento anterior à data local, usando a regra em filtro, badge e valores em aberto, sem gravar automaticamente no banco.

### Média — alerta de segurança Supabase

O advisor reporta **Leaked Password Protection Disabled**. Habilitar proteção contra senhas comprometidas nas configurações de Auth.

### Baixa/média — índices

O advisor reporta cinco FKs compostas sem índice de cobertura: `assinaturas_website_cliente_fkey`, `faturamentos_assinatura_cliente_fkey`, `manutencoes_website_cliente_fkey`, `pagamentos_assinatura_cliente_fkey` e `vendas_website_cliente_fkey`. Avaliar índices com colunas na mesma ordem da FK e benefício real antes de aplicar. O advisor também sinaliza dez índices não utilizados; não remover sem observar carga representativa.

## Banco de dados — estado observado

As tabelas públicas `user_roles`, `clientes`, `websites`, `planos`, `assinaturas`, `pagamentos`, `manutencoes`, `faturamentos` e `vendas` estão com RLS habilitado. Policies retornadas são restritas a `authenticated` e exigem `private.has_role(auth.uid(), 'admin')` para gerenciamento; `user_roles` permite SELECT administrativo. Há um registro admin, mas ainda não foi validado que corresponde à conta do preview. RLS habilitado não substitui testes com contas admin/não-admin/anônima.

Migrações listadas:
- `20260918011023`
- `20260918011216`
- `20260919012458` — `create_vendas_table`
- `20260919221151` — `optimize_admin_rls_initplan`
- `20260919221222` — `wrap_auth_uid_in_admin_policies`
- `20260919221240` — `enforce_client_relationship_integrity`

## Pendências

1. Confirmar que o preview reinicia e `/auth` abre após restaurar as variáveis Supabase.
2. Validar os cinco módulos e capturar erros de console/rede, se persistirem.
3. Corrigir status efetivo de vencimento em Pagamentos e Faturamento.
4. Executar instalação reproduzível, lint, typecheck e build.
5. Revisar guards e RLS; testar acesso anônimo, não-admin e admin, incluindo acesso cruzado.
6. Testar CRUD e integridade dos módulos sem dados fictícios em produção.
7. Conferir datas/timezone, formulários, estados de erro/vazio, responsividade e sincronização Lovable.
8. Habilitar proteção contra senhas comprometidas; avaliar índices.
9. Confirmar vínculo da conta admin e recuperação/logout.
10. Revisar histórico Git para verificar que nenhum segredo privilegiado foi versionado.

## Conclusão provisória

A falha global do preview provavelmente foi causada pela remoção de variáveis de ambiente obrigatórias. A configuração foi restaurada, mas o preview ainda precisa ser reconstruído e validado. Auditoria **em andamento**; não considerar o WEZA HUB aprovado para produção até fechar as pendências e executar testes.