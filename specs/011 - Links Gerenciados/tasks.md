# Fase 01: Camada de dados []
Branch: `feat/011-links-dados`

- [] Task 01: Modelo. Arquivo: `src/app/models/link.model.ts`. Objetivo: `ManagedLink` com `slug`,
  `label`, `url`, `description`, `order` e `isSlot`. `SLOT_SLUGS` fica aqui também, como constante do
  front, porque é o front que pede link pelo nome.
- [] Task 02 (TDD + implementação): `LinkService`. Arquivos: `src/app/services/link.service.ts`,
  `.spec.ts`. Objetivo: `GET /links` com cache de sessão, mais o CRUD de admin. **Salvar invalida o
  cache** — sem isso o admin salva, volta para o painel e vê o link antigo, e a conclusão dele é que
  a escrita falhou. O teste que cobre isso é o mais importante da fase.
- [] Task 03 (TDD + implementação): O seletor de slot. Arquivo: `src/app/core/links/slot.ts`.
  Objetivo: `findSlot(links, slug)` devolve `ManagedLink | null`. Um lugar só para a pergunta "existe
  esse link?", porque a resposta decide se um botão aparece — e três telas fazem essa pergunta.
- [] Task 04 (TDD + implementação): Validação de URL no front. Arquivo: `src/app/core/links/url.ts`.
  Objetivo: mesmos três esquemas do backend (`https:`, `mailto:`, `tel:`). Não é desconfiança do
  servidor: um 400 genérico depois de três campos preenchidos não diz **qual** deles está errado.

# Fase 02: A tela de admin []
Branch: `feat/011-links-admin`

- [] Task 01: Rota e cartão no índice. Arquivos: `src/app/app.routes.ts`,
  `src/app/pages/admin/admin.page.ts`. Objetivo: `/dashboard/admin/links` sob `adminGuard`, e o
  terceiro cartão na Administração.
- [] Task 02: A tela. Arquivos: `src/app/pages/admin/links/links.page.{ts,html,scss}`. Objetivo:
  **duas seções separadas** — Slots e Outros links. Cada slot mostra onde ele aparece no produto
  ("botão de upgrade do Financeiro", "cartão da comunidade no painel"), e o campo de slug dele é
  somente leitura: sem isso o admin cadastra um nome parecido, espera o botão mudar, e nada muda.
- [] Task 03: Formulário. Arquivo: `src/app/components/link-form/link-form.ts`. Objetivo: label, URL
  e descrição, com `inputmode="url"` e `enterkeyhint="done"`. A validação de URL roda antes de enviar,
  com a mensagem dizendo o esquema aceito.
- [] Task 04: Remoção. Objetivo: `confirm-dialog`, **com o aviso extra quando o link é slot** — "o
  botão de upgrade do Financeiro vai sumir até você cadastrar de novo". Apagar é permitido (decisão 5
  do backend); o que não pode é ser surpresa.
- [] Task 05 (TDD): Spec da tela. Objetivo: as duas seções, o slug do slot bloqueado, a URL inválida
  barrada antes do envio, e o aviso do slot no diálogo de remoção.

# Fase 03: Os consumidores []
Branch: `feat/011-links-consumidores`

- [] Task 01: Financeiro. Arquivo: `src/app/pages/financeiro/financeiro.page.ts`. Objetivo: o upgrade
  passa a abrir `whatsapp-pessoal`. **Sem o slot, o botão não aparece** — nem no cartão do tier, nem
  no bloco do próximo degrau. Um `href` vazio é um link que recarrega a página, e o aluno clica
  achando que abriu alguma coisa.
- [] Task 02: Painel. Arquivos: `src/app/pages/dashboard/dashboard.page.{ts,html}`. Objetivo: o cartão
  do WhatsApp passa a depender de `whatsapp-comunidade`, e `environment.whatsappGroupUrl` **é
  removido** de `environment.ts` e `environment.production.ts`. Constante vazia esperando alguém
  lembrar de preenchê-la no deploy é a forma mais silenciosa de um recurso não existir — e é por causa
  dela que aquele cartão está desabilitado desde a spec 005.
- [] Task 03: Links úteis no painel. Objetivo: os links livres num bloco no fim do dashboard. Sem
  isso, todo link que não é slot seria cadastro morto (ponto em aberto 1).
- [] Task 04: Landing. Arquivos: `src/app/pages/landing/landing.page.{ts,html}`. Objetivo: os links
  gerenciados **com o conteúdo local como fallback**. Sem o fallback, uma falha de API apagaria a
  seção de contato — e contato é a única coisa que aquela página precisa entregar. O conteúdo local
  não morre: muda de fonte para rede de segurança, e o comentário precisa dizer isso.
- [] Task 05 (TDD): Specs dos consumidores. Objetivo: **o teste central é o do slot ausente** — o
  botão some, e nenhuma tela renderiza `href` vazio. Mais o fallback da landing quando a API falha.

# Fase 04: Documentação e release []
Branch: `release/011-links-gerenciados`

- [] Task 01: Marcar na spec 010 daqui que o ponto em aberto do upgrade foi resolvido, e na 005 que a
  dívida do `whatsappGroupUrl` foi paga.
- [] Task 02: Registrar o resultado da execução no `context.md` desta spec.
- [] Task 03: `npm run lint`, `npm test` e `npm run build` limpos.
- [] Task 04: Verificar no navegador **com o slot ausente e com o slot presente** — é a única forma de
  provar que o botão some em vez de virar link morto.
- [] Task 05: Unir as `feat/011-*` na release, merge em `dev`, e abrir o PR contra a `main`. **O merge
  está liberado** (autorizado em 2026-08-18). O backend da 011 precisa estar em produção antes: sem
  `GET /links`, a tela de admin só sabe dar erro.
