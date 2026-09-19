# Auditoria técnica — WEZA HUB

**Data:** 19/09/2026  
**Repositório:** `wesleyneris023/weza-hub-core`  
**Supabase:** projeto `oocjtlipoobydsvwxqlo` (sa-east-1)

## Escopo e limites

Auditoria documental/estática inicial do estado remoto do GitHub e inspeção do schema/advisors do Supabase. Não foi executado build, suíte de testes, navegador/preview, teste autenticado ponta a ponta ou pentest. Portanto, este documento não declara o sistema pronto para produção.

## Achados confirmados

### Alta prioridade — arquivo `.env` versionado

O repositório contém `.env` rastreado. A cópia inspecionada contém URL do projeto e chave Supabase `anon`/publishable (não foi identificada service-role nessa cópia). Chaves públicas são projetadas para uso no cliente e não substituem RLS; ainda assim, arquivos de ambiente não devem ser versionados. Remover `.env` do Git, adicionar `.env.example` apenas com placeholders e manter segredos/configuração local fora do controle de versão. Se algum segredo privilegiado já esteve nesse arquivo ou no histórico, revogá-lo/rotacioná-lo imediatamente. Não publicar valores de chaves em relatórios.

### Média — vencimento não é normalizado na listagem financeira

Em Pagamentos e Faturamento, o código inspecionado filtra/exibe o `status` persistido diretamente. Os indicadores contam datas vencidas separadamente, mas a linha não passa automaticamente a exibir `Atrasado` e o filtro `Atrasado` depende do status persistido. Isso pode causar divergência entre o indicador e a listagem. A correção de UI solicitada ainda precisa ser implementada e validada: derivar status efetivo para registros não pagos/não cancelados com `data_vencimento < hoje`, e reutilizar essa regra no filtro, badge e cálculo de valores em aberto, sem gravar status automaticamente no banco.

### Média — alerta de segurança Supabase

O advisor de segurança reporta **Leaked Password Protection Disabled**. Habilitar a proteção contra senhas comprometidas nas configurações de Auth.

### Baixa/média — índices de FKs compostas

O advisor de performance reporta cinco FKs compostas sem índice de cobertura: `assinaturas_website_cliente_fkey`, `faturamentos_assinatura_cliente_fkey`, `manutencoes_website_cliente_fkey`, `pagamentos_assinatura_cliente_fkey` e `vendas_website_cliente_fkey`. Avaliar índices com colunas na mesma ordem da FK e confirmar plano/benefício antes de aplicar.

### Observação de performance

O advisor também sinaliza dez índices não utilizados. Em projeto com pouco tráfego/volume, isso não prova que sejam dispensáveis; não remover sem analisar consultas esperadas e uso após período representativo.

## Banco de dados — estado observado

Todas as tabelas públicas listadas (`user_roles`, `clientes`, `websites`, `planos`, `assinaturas`, `pagamentos`, `manutencoes`, `faturamentos`, `vendas`) estão com RLS habilitado. O schema possui FKs e checks para status/valores e integridade composta de cliente/website/assinatura em relações relevantes. RLS habilitado, isoladamente, não comprova que as policies estejam corretas; é necessário testar usuário anônimo, usuário comum e administrador.

Migrações listadas pelo Supabase:
- `20260918011023`
- `20260918011216`
- `20260919012458` — `create_vendas_table`
- `20260919221151` — `optimize_admin_rls_initplan`
- `20260919221222` — `wrap_auth_uid_in_admin_policies`
- `20260919221240` — `enforce_client_relationship_integrity`

## Pendências para concluir a auditoria

1. Corrigir status efetivo de vencimento em Pagamentos e Faturamento (badge, filtro e indicadores) e validar com datas antes/no/depois do vencimento, pagos e cancelados.
2. Retirar `.env` do versionamento e criar `.env.example`; revisar histórico do Git por possíveis segredos privilegiados.
3. Executar instalação reproduzível, lint, typecheck e build; registrar resultados reais.
4. Revisar rotas, guards de autenticação/autorização e políticas RLS por tabela, incluindo tentativas de acesso cruzado.
5. Testar CRUD e integridade de Clientes, Websites, Assinaturas, Pagamentos, Faturamento, Manutenções e Vendas, sem criar dados fictícios em produção.
6. Conferir comportamento de datas/timezone, formulários, estados vazios/erro, responsividade e preview Lovable.
7. Habilitar proteção contra senhas comprometidas; avaliar índices de FKs compostas e os índices sinalizados como não utilizados.
8. Validar conta administrativa vinculada e fluxo de recuperação/logout antes de liberar uso operacional.

## Conclusão provisória

A base possui estrutura relacional e RLS habilitado, mas a auditoria permanece **em andamento**. Não considerar o WEZA HUB aprovado para produção até fechar as pendências prioritárias e executar os testes listados.