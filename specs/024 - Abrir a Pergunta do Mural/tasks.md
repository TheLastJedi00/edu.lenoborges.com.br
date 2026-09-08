# Spec 024 (front): Abrir a Pergunta do Mural — Tasks

> Regras do repositório que valem em toda task: sem emojis (SVG componentizado), Mobile First,
> nada de travessão nos textos de tela, gradientes e animações suaves em `.scss`, `animate-enter` /
> `animate-leave`, Dumb Components e Smart Pages, `Promise.all` (ou `forkJoin`) quando a página faz
> mais de uma requisição. Testar no Chrome sempre.
> Uma branch `feat/` por fase, um commit por task, um push por fase. Ao fim, uma `release/` unindo
> as fases, merge em `dev` e PR contra a `main`.
> **Sem par no backend**: nenhuma rota nova, nenhum campo novo. O diálogo mostra o que a listagem
> já traz.

---

# Fase 01: A conversão de insígnia num lugar só []

Fase de fundação, sem mudança visível. Ao fim dela existe uma função pura para o rótulo da
insígnia, e o `QuestionCard` já usa.

- [] Task 01: `src/app/core/mural/badge-title.spec.ts` — testes antes: id que existe na trilha
  devolve o título da etapa; id que não existe devolve **o próprio id**; lista vazia devolve o id.
  O fallback é o que a spec 010 já escolheu, e o teste é o que impede a próxima refatoração de
  trocá-lo por string vazia.
- [] Task 02: `src/app/core/mural/badge-title.ts` — `tituloDaInsignia(stages: readonly TrackStage[],
  badgeId: string): string`. Função pura, sem `inject`, sem serviço: quem tem o serviço é quem
  chama.
- [] Task 03: `src/app/components/question-card/question-card.ts` — o `computed` de `badgeTitle`
  passa a chamar `tituloDaInsignia(this.community.trackStages(), this.question().badgeId)`. O
  comentário que explica o fallback muda de casa junto com a regra, e não fica duplicado.

---

# Fase 02: O diálogo da pergunta []

O componente burro que todas as telas vão usar. Ao fim desta fase ele existe, está testado e ainda
não é aberto por ninguém.

- [] Task 01: `src/app/components/question-detail-dialog/question-detail-dialog.ts` +
  `.html` + `.scss` — `app-question-detail-dialog`, `ChangeDetectionStrategy.OnPush`, no molde do
  `MemberCardDialog`: `<dialog>` nativo, `open(question: MuralQuestion)` guardando a pergunta num
  `signal` e chamando `showModal()`, `close()`, fechamento por `Esc` e por clique fora, foco no
  corpo ao abrir e devolvido ao elemento que abriu ao fechar.
  Conteúdo, nesta ordem:
  1. Sobrancelha com o título da insígnia (`tituloDaInsignia`, com `CommunityService` injetado como
     o cartão já faz) e a fase por extenso (decisão 10): "recebendo perguntas", "em votação" ou
     "encerrada", mais o selo "adiantada" quando `promotedTo` existe, e "a sua" quando `isMine`.
  2. `<h2>` com o título da pergunta.
  3. O corpo **inteiro**, com `white-space: pre-wrap`, por interpolação. Sem `innerHTML`. Quando
     `body` é nulo: "Quem perguntou não escreveu mais contexto."
  4. Rodapé de metadados: autor, `dataPorExtenso(createdAt)` de `core/datas`, e a contagem de votos
     como texto estático (decisão 5, o diálogo não vota).
  5. `<ng-content select="[acoes]">` no rodapé, antes do botão "Fechar" (decisão 2).
- [] Task 02: o nome do autor no diálogo — `<button>` **só quando `authorUid` existe**, emitindo
  `authorClick`; sem uid, texto puro, sem cursor, sem foco, sem `role`. A comparação é com nulo, e
  nunca com o valor sentinela do backend (spec 019). Emitir **fecha o diálogo** antes de avisar o
  host (decisão 6).
- [] Task 03: `question-detail-dialog.spec.ts` — título, corpo inteiro renderizado, a frase de
  corpo vazio, a fase por extenso nos três valores, o selo de adiantada, o selo "a sua", a data
  formatada, a contagem de votos, o nome do autor como botão com uid e como texto sem uid, o
  `authorClick` fechando o diálogo, e a ausência de qualquer botão de voto dentro do diálogo (é o
  teste de armadilha da decisão 5).
- [] Task 04: `.scss` do diálogo — overlay, cartão, `animate-enter` na abertura e `animate-leave` no
  fechamento, gradiente suave no cabeçalho no mesmo tom do `MemberCardDialog`, corpo com rolagem
  própria (`max-height` e `overflow-y: auto`) para os 1000 caracteres em 360px, e
  `prefers-reduced-motion: reduce` desligando a animação.

---

# Fase 03: O Mural do membro abre a pergunta []

Ao fim desta fase, clicar no cartão do mural abre a pergunta, nas três abas.

- [] Task 01: `src/app/components/question-card/question-card.ts` — o alvo esticado da decisão 3: o
  título vira `<button class="card__abrir">` com `::after { position: absolute; inset: 0 }` sobre o
  `.card` (`position: relative`), `aria-label` "Abrir a pergunta: {título}", e emite um novo
  `output` `abrir`. O botão de voto e o botão do autor recebem `position: relative; z-index: 1`.
  Nada de `<button>` dentro de `<button>`.
- [] Task 02: `question-card.ts` — a prévia de corpo da decisão 4: `.card__text` com
  `-webkit-line-clamp: 3`, `display: -webkit-box` e `overflow: hidden`. Mais o realce de `:hover` e
  `:focus-within` no cartão e o `cursor: pointer`, sem os quais o alvo é invisível.
- [] Task 03: `question-card.spec.ts` — o clique no título emitindo `abrir`; o clique no voto
  emitindo `toggle` e **não** emitindo `abrir`; o clique no autor emitindo `authorClick` e **não**
  emitindo `abrir`. Estes dois últimos são os testes que protegem o alvo esticado da regressão que
  ele convida.
- [] Task 04: `src/app/pages/mural/mural.page.html` + `.ts` — o `app-question-detail-dialog` entra
  ao lado do `app-member-card-dialog`, sempre renderizado, com `viewChild.required`. O
  `(abrir)` do cartão chama `abrirPergunta(question)`. O `authorClick` do diálogo cai no mesmo
  `abrirCartao` que já existe, sem segundo caminho.
- [] Task 05: `mural.page.html` — a aba "Respondidas" (decisão 8): a linha com pergunta vira alvo
  esticado do mesmo jeito e abre o diálogo; semana em branco continua sem alvo e sem cursor. O link
  "Ver a resposta na trilha" é projetado em `[acoes]` quando `answerVideoId` existe.
- [] Task 06: `mural.page.spec.ts` — abrir pelo cartão mostra o corpo inteiro; abrir pela aba
  "Respondidas" mostra o link da trilha; clicar no autor dentro do diálogo fecha o diálogo e abre o
  cartão do membro; o voto otimista continua funcionando com o diálogo em tela.
- [] Task 07: `mural.page.scss` — o que a fase acrescentou de estilo de linha na aba
  "Respondidas", com o mesmo realce das outras listas.

---

# Fase 04: O painel do admin abre a pergunta []

Ao fim desta fase, o admin lê a pergunta inteira antes de adiantar, remover ou gravar o vídeo.

- [] Task 01: `src/app/pages/admin/mural/mural-admin.page.html` + `.ts` — o
  `app-question-detail-dialog` entra na página, sempre renderizado, com um `signal`
  `perguntaAberta` guardando qual pergunta está em tela (é dele que as ações projetadas se ligam).
- [] Task 02: as linhas de "Em votação" e "Esta semana" viram alvo esticado (decisão 3), com o
  título como botão e os botões de adiantar e remover com `z-index: 1`. Os botões continuam na
  linha: quem já sabe o que quer fazer não precisa abrir nada.
- [] Task 03: as ações projetadas no rodapé do diálogo — `promotionsFor(perguntaAberta())` e o
  botão de remover, chamando os mesmos `askPromote` / `askRemove` de hoje. O diálogo **fecha antes**
  de o `ConfirmDialog` abrir (decisão 6), e a confirmação segue com o texto que já existe.
- [] Task 04: as linhas da pauta ("Esperando vídeo") viram alvo esticado e abrem o diálogo com o
  link "Cadastrar o vídeo de resposta" projetado em `[acoes]`, com o mesmo `routerLink` e o mesmo
  `queryParams: { resposta: id }` da linha (spec 017). Sem segunda forma de montar esse link.
- [] Task 05: `mural-admin.page.spec.ts` — abrir pela linha de votação mostra o corpo; a promoção
  disparada de dentro do diálogo fecha o diálogo e abre a confirmação; confirmar continua movendo
  **um cartão só**, que é a invariante da spec 016; abrir pela pauta mostra o link do vídeo com o
  `resposta` correto na query.
- [] Task 06: `mural-admin.page.scss` — realce de linha, `cursor: pointer` e `focus-visible` nas
  três listas e na pauta, no mesmo tom do resto do painel.

---

# Fase 05: Acabamento e verificação []

- [] Task 01: verificação no Chrome em 360px de largura, nas duas telas: pergunta de 1000
  caracteres rolando dentro do diálogo sem estourar a página, prévia de 3 linhas cortando no
  cartão, e o alvo esticado sem roubar o toque do voto.
- [] Task 02: acessibilidade — tabulação entra no cartão uma vez só, `Esc` fecha, o foco volta para
  o botão que abriu, o `aria-label` do alvo nomeia a pergunta, e o diálogo tem `aria-labelledby`
  apontando para o `<h2>` do título.
- [] Task 03: `npm run lint` e `npm test` limpos, e leitura final do `context.md` para conferir que
  nenhuma decisão mudou no caminho. Se mudou, ela sobe para o topo do `context.md` como alteração
  de escopo, pela regra 5 do fluxo.
