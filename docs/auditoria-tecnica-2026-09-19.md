# Auditoria técnica — 19/09/2026

## Escopo desta rodada

Auditoria somente leitura do estado dos dados e políticas, seguida de duas correções estruturais no Supabase Weza 2 (`oocjtlipoobydsvwxqlo`). Nenhum registro de negócio foi criado, alterado ou excluído.

## Verificações concluídas

- As 9 tabelas administrativas (`user_roles`, `clientes`, `websites`, `planos`, `assinaturas`, `pagamentos`, `manutencoes`, `faturamentos`, `vendas`) estão com RLS habilitado.
- As policies administrativas continuam restritas a `authenticated` + `private.has_role(..., 'admin')`.
- O único registro de papel `admin` está vinculado a um usuário existente em `auth.users` (1/1). Ainda falta validar que esse usuário é exatamente o que está autenticado no preview.
- Auditoria de integridade encontrou zero divergências de cliente entre assinaturas, websites, pagamentos, faturamentos, manutenções e vendas.
- Dados existentes preservados: 1 cliente, 1 website, 1 assinatura, 1 pagamento, 1 faturamento, 1 manutenção e 0 vendas. São registros existentes de validação; não foram criados nesta auditoria.

## Correções aplicadas

### 1. Otimização das policies RLS

Migração `optimize_admin_rls_initplan` e ajuste subsequente envolveram a checagem de papel e `auth.uid()` em subconsultas escalares, mantendo a autorização administrativa existente.

Validação posterior: o advisor de performance deixou de reportar os 9 alertas `auth_rls_initplan`. Permanecem alertas informativos de índices ainda não utilizados; não foram removidos, pois o volume de dados é pequeno e isso não comprova que sejam desnecessários.

### 2. Integridade referencial entre cliente e registros relacionados

Migração `enforce_client_relationship_integrity` adicionou chaves únicas compostas e FKs compostas validadas para impedir associações cruzadas entre clientes:

- assinatura ↔ website;
- pagamento/faturamento ↔ assinatura;
- manutenção/venda ↔ website.

Todas as 7 constraints foram confirmadas como validadas no catálogo do PostgreSQL. As FKs originais foram mantidas. A auditoria anterior encontrou zero inconsistências.

## Pendências / próximos passos

- Corrigir na interface de Pagamentos e Faturamento o status derivado `atrasado`: hoje a contagem de vencidos considera data de vencimento, mas a filtragem e o badge ainda dependem do status gravado. A regra deve ser calculada na apresentação, sem atualizar automaticamente o banco.
- Revisar se os formulários de pagamentos/faturamentos filtram assinaturas pelo cliente selecionado (a integridade agora também é garantida no banco).
- Executar build/lint e validação de rotas/CRUD no ambiente da aplicação; não foi possível executar o projeto por meio das APIs de GitHub/Supabase.
- Revisar a configuração de proteção contra senhas vazadas no Supabase Auth.
- Revisar o arquivo `.env` rastreado no repositório público. O arquivo contém a chave publicável do Supabase; nenhuma chave `service_role` foi identificada no conteúdo examinado. Não imprimir ou compartilhar valores de chave. Confirmar variáveis do preview antes de remover o arquivo e avaliar rotação conforme o histórico/uso.

## Limitações

A auditoria de banco e código não substitui um build real nem um teste ponta a ponta com a sessão administrativa do preview. Não foram geradas cobranças, pagamentos, automações ou dados fictícios.