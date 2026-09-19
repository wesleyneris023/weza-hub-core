# Auditoria técnica — WEZA HUB

**Data:** 19/09/2026  
**Repositório:** `wesleyneris023/weza-hub-core`  
**Supabase:** projeto `oocjtlipoobydsvwxqlo` (sa-east-1)

## Escopo e limites

Auditoria documental/estática do GitHub e inspeção do schema, policies e advisors do Supabase. Foram aplicadas correções nos selects relacionais dos módulos que falhavam e removido `.env` do controle de versão. Ainda não foi executado build, suíte de testes, navegador/preview, teste autenticado ponta a ponta ou pentest. Portanto, a auditoria continua aberta e não declara o sistema pronto para produção.

## Achados e ações

### Alta prioridade — causa provável das falhas nos módulos

O schema contém FKs simples e compostas apontando para as mesmas tabelas relacionadas. Os selects PostgREST dos módulos faziam embeds sem indicar a constraint, deixando a relação ambígua (erro típico `PGRST201`). Isso corresponde ao padrão comum de falha visto nos módulos Pagamentos, Faturamento, Manutenção, Assinaturas e Vendas.

**Correção aplicada no GitHub:** os selects agora indicam explicitamente as FKs simples usadas para cada embed:
- Pagamentos: `pagamentos_cliente_id_fkey` e `pagamentos_assinatura_id_fkey`.
- Faturamento: `faturamentos_cliente_id_fkey` e `faturamentos_assinatura_id_fkey`.
- Manutenção: `manutencoes_cliente_id_fkey` e `manutencoes_website_id_fkey`.
- Assinaturas: `assinaturas_cliente_id_fkey`, `assinaturas_website_id_fkey` e `assinaturas_plano_id_fkey`.
- Vendas: `vendas_cliente_id_fkey` e `vendas_website_id_fkey`.

Também foram adicionados logs técnicos controlados (código/mensagem/hint) antes de mostrar mensagens amigáveis, para que falhas futuras possam ser diagnosticadas sem expor dados de clientes. A causa é altamente compatível com a falha exibida, mas só será considerada confirmada após validar os módulos no preview com sessão administrativa.

### Alta prioridade — arquivo `.env` versionado

O `.env` continha URL do projeto e chave Supabase pública/publishable; não foi identificada service-role na cópia inspecionada. **Ação aplicada:** removido do Git e adicionado `.env.example` com placeholders; `.gitignore` agora ignora arquivos `.env*`, exceto `.env.example`. A chave publishable não é secreta, mas RLS continua sendo a barreira de acesso. Revisar o histórico Git caso algum segredo privilegiado tenha sido adicionado anteriormente; rotacionar qualquer credencial privilegiada encontrada.

### Média — vencimento não é normalizado na listagem financeira

Pagamentos e Faturamento ainda filtram/exibem o status persistido diretamente. Os indicadores contam datas vencidas separadamente, o que pode divergir da badge e do filtro “Atrasado”. **Correção de UI pendente:** derivar status efetivo para itens não pagos/não cancelados com vencimento anterior à data local, usando a regra em filtro, badge e valores em aberto, sem gravar automaticamente o status no banco.

### Média — alerta de segurança Supabase

O advisor reporta **Leaked Password Protection Disabled**. Habilitar a proteção contra senhas comprometidas nas configurações de Auth.

### Baixa/média — índices de FKs compostas

O advisor reporta cinco FKs compostas sem índice de cobertura: `assinaturas_website_cliente_fkey`, `faturamentos_assinatura_cliente_fkey`, `manutencoes_website_cliente_fkey`, `pagamentos_assinatura_cliente_fkey` e `vendas_website_cliente_fkey`. Avaliar índices com colunas na mesma ordem da FK e confirmar benefício antes de aplicar.

### Observação de performance

O advisor sinaliza dez índices não utilizados. Em projeto com pouco tráfego/volume, isso não prova que sejam dispensáveis; não remover sem analisar consultas esperadas e uso após período representativo.

## Banco de dados — estado observado

As tabelas públicas `user_roles`, `clientes`, `websites`, `planos`, `assinaturas`, `pagamentos`, `manutencoes`, `faturamentos` e `vendas` estão com RLS habilitado. As policies retornadas são restritas a `authenticated` e exigem `private.has_role(auth.uid(), 'admin')` para gerenciamento; `user_roles` permite SELECT administrativo. A tabela `user_roles` contém um registro admin, mas ainda não foi validado que corresponde à conta usada no preview. RLS habilitado não substitui testes com contas admin/não-admin/anônima.

Migrações listadas pelo Supabase:
- `20260918011023`
- `20260918011216`
- `20260919012458` — `create_vendas_table`
- `20260919221151` — `optimize_admin_rls_initplan`
- `20260919221222` — `wrap_auth_uid_in_admin_policies`
- `20260919221240` — `enforce_client_relationship_integrity`

## Pendências para concluir a auditoria

1. Validar no preview os cinco módulos após os selects com FK explícita; verificar console e erros de rede caso algum ainda falhe.
2. Corrigir status efetivo de vencimento em Pagamentos e Faturamento (badge, filtro e indicadores).
3. Executar instalação reproduzível, lint, typecheck e build; registrar resultados reais.
4. Revisar rotas, guards de autenticação/autorização e políticas RLS por tabela, incluindo testes de acesso cruzado.
5. Testar CRUD e integridade de Clientes, Websites, Assinaturas, Pagamentos, Faturamento, Manutenções e Vendas, sem criar dados fictícios em produção.
6. Conferir datas/timezone, formulários, estados vazios/erro, responsividade e sincronização/preview Lovable.
7. Habilitar proteção contra senhas comprometidas; avaliar índices de FKs compostas e os índices sinalizados como não utilizados.
8. Validar conta administrativa vinculada e fluxo de recuperação/logout.
9. Revisar histórico Git para confirmar que nunca houve credenciais privilegiadas no `.env`.

## Conclusão provisória

As correções mais diretamente relacionadas à falha de carregamento foram aplicadas no GitHub. A hipótese técnica principal é a ambiguidade de FKs nos embeds PostgREST. A confirmação depende do preview autenticado e da execução de build/testes. Auditoria **em andamento**; não considerar o WEZA HUB aprovado para produção até fechar as pendências prioritárias.