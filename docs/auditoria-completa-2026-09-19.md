# Auditoria técnica — WEZA HUB

**Data:** 19/09/2026  
**Repositório:** `wesleyneris023/weza-hub-core`  
**Supabase:** projeto `oocjtlipoobydsvwxqlo` (sa-east-1)

## Escopo e limites

Auditoria estática do GitHub, inspeção ao vivo do schema, policies e advisors do Supabase, consultas SQL somente de leitura e validação visual do preview pelo usuário. O preview voltou a abrir após a restauração das variáveis. Os módulos financeiros/operacionais exibem os registros existentes. Isso não substitui testes completos de CRUD e autorização.

## Incidente crítico — preview falhou após remoção do `.env`

O arquivo `src/integrations/supabase/client.ts` exige `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e lança erro durante inicialização quando ausentes. A remoção do `.env` do Git foi seguida por falha global em `/auth`; a sequência é compatível com a ausência dessas variáveis e constitui a causa imediata mais provável.

**Mitigação aplicada anteriormente:** `.env` restaurado e variável Vite corrigida. O usuário confirmou visualmente que o preview voltou a abrir. Não remover nem alterar `.env` novamente sem configurar e validar variáveis no ambiente de build/preview.

**Risco aberto:** `.env` está versionado. A chave observada na cópia inspecionada era publishable/anon; revisão completa do histórico Git e migração para ambiente seguro ainda pendentes. Nunca expor valores de chaves em logs/documentação. Se algum segredo privilegiado tiver sido versionado, remover do histórico e rotacionar.

## Módulos e vencimento

O schema possui FKs simples e compostas para algumas relações. Os selects PostgREST foram explicitados para reduzir ambiguidade em:
- Pagamentos: `pagamentos_cliente_id_fkey`, `pagamentos_assinatura_id_fkey`.
- Faturamento: `faturamentos_cliente_id_fkey`, `faturamentos_assinatura_id_fkey`.
- Manutenção: `manutencoes_cliente_id_fkey`, `manutencoes_website_id_fkey`.
- Assinaturas: `assinaturas_cliente_id_fkey`, `assinaturas_website_id_fkey`, `assinaturas_plano_id_fkey`.
- Vendas: `vendas_cliente_id_fkey`, `vendas_website_id_fkey`.

O usuário confirmou que as páginas carregam. Como também houve incidente de ambiente, a causa original não pode ser atribuída exclusivamente à ambiguidade de relacionamentos.

Pagamentos e Faturamento calculam status efetivo como atrasado quando vencimento é anterior à data local atual e o registro não está pago/cancelado; esse status alimenta filtro, badge e indicadores sem gravar mudança automática. No print de 19/09/2026, ambos venciam naquele dia e apareceram pendentes/em aberto; contador de vencidos = 0 é consistente com a regra. Falta validar o caso após vencimento real no preview.

## Banco de dados — inspeção ao vivo

### Integridade relacional e financeira

Consultas somente de leitura retornaram **zero inconsistências** nos vínculos:
- pagamento ↔ assinatura/cliente;
- faturamento ↔ assinatura/cliente;
- assinatura ↔ website/cliente;
- manutenção ↔ website/cliente;
- venda ↔ website/cliente.

Também retornaram zero registros com pagamento/faturamento marcado como pago sem data de pagamento, data de pagamento em status não pago ou valor negativo. Isso é uma fotografia dos dados atuais, não garantia contra futuras gravações incorretas.

Contagem observada: 1 cliente, 1 website, 1 plano, 1 assinatura, 1 pagamento, 1 faturamento, 1 manutenção e 0 vendas. Há 1 linha de papel `admin` em `user_roles`; ainda não foi confirmada a correspondência com a conta administrativa usada no preview.

### RLS e políticas

RLS está habilitado em todas as tabelas públicas de negócio observadas (`user_roles`, `clientes`, `websites`, `planos`, `assinaturas`, `pagamentos`, `manutencoes`, `faturamentos`, `vendas`). Policies para `authenticated` exigem `private.has_role((select auth.uid()), 'admin')`; `user_roles` tem policy de leitura administrativa. O helper `private.has_role` é `SECURITY DEFINER`, com `search_path=public`. Recomenda-se confirmar que referências internas estão qualificadas e restringir EXECUTE ao necessário. Ainda faltam testes de acesso anônimo, usuário comum e admin, incluindo tentativas de acesso cruzado.

### Advisors Supabase (19/09/2026)

- **Segurança — WARN:** `Leaked Password Protection Disabled`. Habilitar proteção contra senhas comprometidas nas configurações de Auth: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- **Performance — INFO:** cinco FKs compostas sem índice de cobertura: `assinaturas_website_cliente_fkey`, `faturamentos_assinatura_cliente_fkey`, `manutencoes_website_cliente_fkey`, `pagamentos_assinatura_cliente_fkey`, `vendas_website_cliente_fkey`. Avaliar índices adequados antes de aplicar.
- Advisor também lista 10 índices não utilizados. Não remover com base em uso ainda baixo; observar carga representativa primeiro.

## CI e qualidade de código

Workflow `.github/workflows/quality-checks.yml` adicionado para lint, `tsc --noEmit` e build (Node 22). A primeira execução falhou no ESLint: **1.007 erros e 7 warnings**, sendo 995 erros potencialmente corrigíveis com `--fix`; predominam regras `prettier/prettier`, mas também há ocorrências de `no-explicit-any` e `prefer-const`. TypeScript e build foram pulados porque o workflow parava no lint.

O workflow foi atualizado para tentar TypeScript e build mesmo quando o lint falhar. Execução disparada no commit `5ed6a2ae49d5237afc95eacf159b32eb42895297`; resultado ainda não confirmado no momento desta atualização. O repositório não tem `package-lock.json`, portanto o workflow usa `npm install` e não oferece instalação estritamente reproduzível.

## Pendências prioritárias

1. Obter resultado da execução CI atual para typecheck e build; reduzir dívida do ESLint sem desativar silenciosamente regras importantes.
2. Validar status vencido, filtro e badge em Pagamentos/Faturamento quando a data ultrapassar vencimento.
3. Testar CRUD e relações dos módulos sem criar dados desnecessários em produção.
4. Testar RLS com usuário anônimo, usuário comum e admin; confirmar vínculo do admin atual.
5. Revisar função `private.has_role`, grants EXECUTE e segurança do `search_path`.
6. Habilitar proteção contra senhas comprometidas; avaliar índices compostos após observar carga.
7. Revisar histórico Git para credenciais e planejar migração segura do `.env` sem derrubar o preview.
8. Conferir timezone, formulários, estados de erro/vazio, responsividade e sincronização Lovable.
9. Adicionar lockfile e confirmar dependências/build reprodutíveis.

## Conclusão provisória

A aplicação voltou a carregar e as relações atuais verificadas não apresentam inconsistências nos dados existentes. RLS está habilitado, mas falta teste de autorização por perfil. CI revelou dívida significativa de formatação/lint; TypeScript e build aguardam execução independente. A auditoria **permanece em andamento**; não considerar o WEZA HUB aprovado para produção até fechar as pendências prioritárias.