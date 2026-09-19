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
