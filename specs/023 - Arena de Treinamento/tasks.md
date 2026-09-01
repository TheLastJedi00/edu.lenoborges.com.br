# Spec 023 (front): Arena de Treinamento — Tasks

> Regras do repositório que valem em toda task: sem emojis (SVG componentizado), Mobile First,
> nada de travessão nos textos de tela, gradientes e animações em `.scss`, `animate-enter` /
> `animate-leave`, Dumb Components e Smart Pages, `Promise.all` quando a página faz mais de uma
> requisição, e **TDD nos services**.
> Uma branch `feat/` por fase, um commit por task, um push por fase. Testar no Chrome sempre.
> O par no backend é a spec 023 de lá, e as duas entram juntas — as fases do back precisam
> estar de pé antes da fase correspondente aqui virar tela funcionando.

---

# Fase 01: Modelos e serviços [x]

Ao fim desta fase o front sabe falar com a API de treinamentos e com os comentários. Nenhuma tela
muda de aparência.

- [x] Task 01: `src/app/models/training.model.ts` — todos os tipos da spec: `Training` (id, badgeId,
  title, description, steps, videoUrl, xpAmount, position, completed), `TrainingComment` (id,
  trainingId, authorName, content, createdAt, `adminReply: { content, authorName, repliedAt } | null`),
  `CreateTrainingRequest`, `UpdateTrainingRequest`,
  `CreateCommentRequest`, `ReorderTrainingsRequest`, `AdminReplyRequest`. Espelham o contrato do
  `context.md`, campo a campo.
- [x] Task 02: `src/app/services/training.service.spec.ts` — **testes antes**, com
  `HttpTestingController`: `listByBadge(badgeId)` batendo em `GET /badges/:badgeId/trainings`,
  `getTraining(id)` em `GET /trainings/:id`, `complete(id)` em `POST /trainings/:id/complete`,
  `listComments(id, { limit, after })` em `GET /trainings/:id/comments` com `HttpParams`,
  `addComment(id, content)` em `POST /trainings/:id/comments`.
- [x] Task 03: `src/app/services/training.service.ts` — `providedIn: 'root'`, `inject(HttpClient)`,
  no molde do `track.service.ts`.
- [x] Task 04: `src/app/services/admin.service.ts` + `.spec.ts` — **estendido, não duplicado**: as
  rotas de admin de treinamentos entram no serviço de admin que já existe.
  `listTrainings(badgeId)`, `createTraining(badgeId, data)`, `updateTraining(id, data)`,
  `deleteTraining(id)`, `reorderTrainings(badgeId, orderedIds)`,
  `listTrainingCommentsRecent()`, `replyTrainingComment(commentId, content)`.
  Testes cobrindo URLs e corpos.

---

# Fase 02: O card de treinamento e o modal na trilha [x]

A fase que o aluno vê. Ao fim dela, os desafios de treinamento aparecem na trilha como cards, e
clicar abre o modal com passos, vídeo e comentários.

- [x] Task 01: `src/app/components/training-card/training-card.ts` + `.scss` — componente burro
  (`ChangeDetectionStrategy.OnPush`, `input()` / `output()`). Recebe um `Training` e emite o clique.
  Exibe: título, descrição truncada em 2 linhas, o XP do desafio (ex: "30 XP") com destaque visual,
  e um ícone de check verde quando `completed === true`. Alvo de toque de **48px** mínimo. O card
  não faz requisição — é o mesmo princípio do `gym-challenge-card`.
- [x] Task 02: `training-card.spec.ts` — o título, a descrição truncada, o badge de XP, o check
  de concluído, e o clique emitindo.
- [x] Task 03: `src/app/components/training-dialog/training-dialog.ts` + `.html` + `.scss` — o modal
  expansível da decisão 2. Componente burro que recebe `Training`, `comments: TrainingComment[]`,
  `canComment: boolean`, `completed: boolean`, `loadingMore: boolean` e emite `complete`, `comment`,
  `loadMore`, `close`. Estrutura interna:
  1. **Cabeçalho**: título e descrição expandidos.
  2. **Passos**: lista enumerada (`<ol>`) dos passos do treinamento.
  3. **Vídeo**: `@if (training.videoUrl)` renderiza um player (iframe YouTube ou equivalente). O
     conteúdo fica dentro de um `@if` que o destrói ao fechar — um iframe escondido **continua
     tocando**, e destruir o elemento é o único jeito confiável de parar um player de terceiros
     sem falar a API dele (mesma decisão da spec 021).
  4. **Comentários**: seção exibindo os comentários recebidos. Cada comentário com `adminReply`
     mostra a resposta recuada logo abaixo, com o nome de quem respondeu e a data — é o que fecha o
     ciclo da decisão 5, e sem essa área o admin responde e ninguém vê. Botão "Mostrar mais" quando há mais
     páginas. Input de texto + botão "Comentar" visíveis apenas quando `canComment === true`. Quando
     `canComment === false`, mostra a mensagem: "A seção de comentários da Arena de Treinamento é
     exclusiva para membros do Great Tier."
  5. **Rodapé**: Botão "Concluir Desafio" (desabilitado quando `completed === true`, substituído por
     selo "Concluído") e botão de fechar.
  Fecha por Esc, por clique no botão de fechar, e **devolve o foco ao card que o abriu** (mesmo
  padrão do modal de resposta da spec 021). `animate-enter` / `animate-leave`.
- [x] Task 04: `training-dialog.spec.ts` — os passos renderizados como `<ol>`, o vídeo condicional,
  os comentários, a resposta do admin aparecendo sob o comentário que a tem e ausente no que não tem,
  o "Mostrar mais", o botão de concluir desabilitado após conclusão, a mensagem de
  tier exibida quando `canComment === false`, e o foco devolvido ao fechar.
- [x] Task 05: `src/app/pages/trilha/insignia/insignia.page.ts` — passa a chamar
  `GET /badges/:badgeId/trainings` junto do `GET /badges/:badgeId/videos` e do
  `GET /games/challenges/:badgeId`, **num `Promise.all`** (regra 8 do `clauderc`). Novos signals:
  `trainings`, `treinamentoAberto: Training | null`, `treinamentoComentarios: TrainingComment[]`.
- [x] Task 06: `insignia.page.html` + `.scss` — na aba Aulas, a lista de `training-card` renderizada
  **depois dos vídeos e respostas posicionadas** e **antes do `gym-challenge-card`** da spec 022
  (decisão 1). Um `<dialog>` ou o `training-dialog` instanciado condicionalmente com
  `@if (treinamentoAberto())`. Ao clicar num card: abre o modal, carrega os comentários do
  treinamento. Ao concluir: chama `POST /trainings/:id/complete`, anima o ganho de XP com
  `authStore.setXp(totalXp)` (o valor do servidor, **nunca soma local**), e o card passa a mostrar
  o check verde. **O modal não fecha** — decisão 2, para o membro continuar lendo comentários ou
  revendo o vídeo. A falha do `GET /badges/:badgeId/trainings` **não derruba a lista de vídeos**:
  a seção de treinamentos some, a trilha fica.
- [x] Task 07: A avaliação de `canComment` na página: `canComment = computed(() =>
  this.authStore.tier() !== 'dev-tier')` — mesma checagem do Mural, mesma fonte no `AuthStore`
  (decisão 3). O componente recebe pronto.
- [x] Task 08: `insignia.page.spec.ts` — testes-trava de que (a) os cards de treinamento aparecem
  entre os vídeos e o GYM Challenge; (b) clicar num card abre o modal; (c) concluir atualiza o check
  e chama `authStore.setXp`; (d) concluir de novo não chama a API; (e) membro do `dev-tier` vê a
  mensagem de tier no modal e **não vê** o campo de comentário; (f) membro do `great-dev-tier` vê o
  campo e consegue comentar; (g) falha da API de treinamentos não derruba a lista de vídeos.

---

# Fase 03: Admin — gestão de treinamentos na trilha

A fase que o professor vê. Ao fim dela, o admin cria, edita, exclui e reordena treinamentos dentro
de cada insígnia.

- [ ] Task 01: `src/app/components/training-form/training-form.ts` + `.scss` — formulário de
  criação/edição de treinamento. Reactive form com: título (input text, required), descrição
  (textarea, required), passos (lista dinâmica: botão "Adicionar Passo" acrescenta um input, botão
  de remover ao lado de cada passo, pelo menos 1 obrigatório), link do vídeo (input URL, opcional),
  XP do desafio (input numérico, default 30, min 1). Emite `submit` com o `CreateTrainingRequest` ou
  `UpdateTrainingRequest`. Componente burro. No molde do `video-form`.
- [ ] Task 02: `training-form.spec.ts` — validação: botão travado sem título ou sem ao menos 1 passo,
  passos adicionados e removidos corretamente, valor default de XP presente.
- [ ] Task 03: `src/app/pages/admin/trilha/insignia-admin.page.ts` + `.html` + `.scss` — abaixo da
  seção de vídeos, nova seção **"Arena de Treinamento"** com:
  - Lista dos treinamentos da insígnia, cada item com título, XP, e as ações: Editar (abre o
    `training-form` inline, no molde da edição de questão), Excluir (com `ConfirmDialog` cujo texto
    avisa que os comentários e as conclusões do treinamento vão junto), e
    **setas para cima e para baixo reordenando** — no molde exato de `moveUp` / `moveDown` de vídeos, com
    reordenação otimista em memória e rollback em caso de falha da API. **Sem drag-and-drop**: o
    projeto não usa `@angular/cdk`, e no mobile/touch o drag-and-drop conflita com a rolagem de tela.
    A decisão 4 do `context.md` foi emendada para dizer o mesmo.
  - Botão "Novo Treinamento" que abre o formulário.
  - O formulário de criação chama `POST /admin/badges/:badgeId/trainings` e empurra o item no fim
    da lista em memória.
- [ ] Task 04: `insignia-admin.page.spec.ts` — estender com testes-trava de que (a) a seção de
  treinamentos aparece abaixo dos vídeos; (b) criar um treinamento o adiciona ao fim da lista; (c)
  excluir passa pelo `ConfirmDialog`; (d) as setas reordenam e chamam a API de reorder; (e) editar
  inline salva e atualiza a lista.

---

# Fase 04: Admin — painel centralizado de comentários

- [ ] Task 01: `src/app/pages/admin/treinamentos-comentarios/treinamentos-comentarios.page.ts` +
  `.html` + `.scss` — nova smart page. Chama `GET /admin/trainings/comments/recent` e renderiza a
  lista de comentários mais recentes, agrupados ou ordenados cronologicamente. Cada comentário mostra:
  nome do treinamento (ou badge), nome do autor, conteúdo, data. Abaixo de cada comentário, um campo
  de texto inline para **resposta direta do admin** com botão "Responder", chamando
  `POST /admin/trainings/comments/:commentId/reply` — no molde da resposta do Mural Admin, que
  economiza cliques e centraliza o suporte. A resposta é gravada no campo `adminReply` do próprio
  comentário: **um comentário já respondido mostra a resposta atual no lugar do campo vazio**, com um
  botão "Editar resposta". A tela lista tudo e não só o que falta responder, então sem essa marca o
  admin responde duas vezes a mesma pessoa sem perceber, e a segunda resposta sobrescreve a primeira.
- [ ] Task 02: `treinamentos-comentarios.page.spec.ts` — listagem, resposta inline, o comentário já
  respondido exibindo a resposta em vez do campo vazio, estado de loading e de lista vazia.
- [ ] Task 03: `src/app/pages/admin/admin.page.ts` — adicionar o sexto cartão na lista `<ul
  class="cards">`, apontando para `/dashboard/admin/treinamentos-comentarios`, com título
  "Comentários dos Treinamentos" e texto descritivo: "Ver e responder os comentários deixados nos
  desafios da Arena de Treinamento."
- [ ] Task 04: `src/app/app.routes.ts` — nova rota `admin/treinamentos-comentarios` com `adminGuard`,
  `loadComponent` para a nova página, e `title`. No molde de `admin/questoes`.

---

# Fase 05: Acessibilidade, movimento e fechamento

- [ ] Task 01: Varredura de `prefers-reduced-motion` em todos os `.scss` desta spec — card, modal,
  feedback de conclusão, entrada de comentários. É a regra de todas as specs.
- [ ] Task 02: Acessibilidade do modal: o `<dialog>` é nativo e já herda o trap de foco; a lista de
  passos é `<ol>` semântico; os botões são `<button>` com texto descritivo; o resultado de conclusão é
  anunciado em `aria-live="polite"`; o vídeo iframe tem `title` descritivo.
- [ ] Task 03: Passada mobile em 360px: alvo de toque de 48px nos cards, o modal ocupando a tela
  inteira com `env(safe-area-inset-bottom)` no botão de concluir, e a lista de comentários sem
  estouro horizontal.
- [ ] Task 04: Conferir que nenhuma tela desta spec grava treinamentos, conclusões ou comentários em
  `localStorage`. O estado vem do servidor em toda abertura (decisão análoga à 12 da spec 022).
- [ ] Task 05: `npm test` **limpo** e `ng build` passando. Passada no Chrome no fluxo inteiro contra
  a API do `dev-liga-dev`: trilha → cards de treinamento → abrir modal → concluir → comentar →
  admin de trilha → criar treinamento → reordenar → painel de comentários → responder.
- [ ] Task 06: Marcar as emendas nas specs afetadas, incluindo a **023 deste repositório**, cujas
  decisões 2, 4 e 5 foram corrigidas antes da execução (resposta do admin como campo do comentário,
  reordenação por setas em vez de drag-and-drop, exclusão em cascata): **009** (trilha estendida com seção de
  treinamentos no membro e no admin), **019** (XP com terceira fonte: vídeos + GYM + treinamentos),
  **022** (card do GYM Challenge permanece como último item da aba Aulas, agora depois dos
  treinamentos).
