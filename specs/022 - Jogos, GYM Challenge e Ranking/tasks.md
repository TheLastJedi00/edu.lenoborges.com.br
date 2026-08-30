# Spec 022 (front): Jogos, GYM Challenge e Ranking — Tasks

> Regras do repositório que valem em toda task: sem emojis (SVG componentizado), Mobile First,
> nada de travessão nos textos de tela, gradientes e animações em `.scss`, `animate-enter` /
> `animate-leave`, Dumb Components e Smart Pages, `Promise.all` quando a página faz mais de uma
> requisição, e **TDD nos services**.
> Uma branch `feat/` por fase, um commit por task, um push por fase. Testar no Chrome sempre.
> O par no backend é a spec 022 de lá, e as duas entram juntas — as fases 01 a 09 do back precisam
> estar de pé antes da fase correspondente aqui virar tela funcionando.

---

# Fase 01: Modelos, serviços e o nickname no AuthStore [x]

- [x] Task 01: `src/app/models/games.model.ts` — todos os tipos da spec: `ChallengeStatus`,
  `ChallengeState`, `RoundResult`, `RoundQuestion`, `AnswerResult`, `RankingEntry`, `RankingPage`,
  `GymQuestion`, `QuestionDifficulty`, `QuestionCounts`, `ChallengeConfig`, `GeneratedQuestionDraft`.
  Espelham o contrato do adendo A.2 do `context.md`, campo a campo. **Nenhum tipo carrega `correctIndex`
  nas telas de membro** (decisão 13).
- [x] Task 02: `src/app/services/games.service.spec.ts` — **testes antes**, com `HttpTestingController`:
  `listChallenges`, `getChallenge`, `startRound` e `answer` batendo nas URLs certas, e o `answer`
  mandando `{ questionIndex, chosenIndex, clientElapsedMs }` no corpo.
- [x] Task 03: `src/app/services/games.service.ts` — `providedIn: 'root'`, `inject(HttpClient)`,
  no molde do `track.service.ts`.
- [x] Task 04: `src/app/services/ranking.service.spec.ts` e `ranking.service.ts` — `page({ limit, after })`
  com `HttpParams`, devolvendo `{ entries, myPosition, myEntry }`.
- [x] Task 05: `src/app/models/auth.model.ts` — `nickname: string | null` no `MemberProfile`. Vem do
  `GET /me` pelo caminho que o `xp` da spec 019 já usa.
- [x] Task 06: `src/app/services/profile.service.ts` + `.spec.ts` — `setNickname(nickname)` chamando
  `PUT /me/nickname`, e o `409` propagado como erro tipado para a tela distinguir "nome em uso" de
  "você já tem um".
- [x] Task 07: `src/app/core/auth/auth.store.ts` + `.spec.ts` — expor o signal `nickname` e o
  `setNickname(value)` local, no molde do `setXp` da spec 019.

---

# Fase 02: O aside, o hub e as rotas [x]

- [x] Task 01: `src/app/components/dashboard-aside/dashboard-aside.ts` — o item Jogos perde o `disabled`,
  o `aria-disabled`, a classe `aside__item--disabled` e o selo "Em breve", ganha o `icon-games` e o
  `routerLink` para `/dashboard/jogos`. A posição é **depois de Trilha, antes de Mural** (decisão 8).
- [x] Task 02: `dashboard-aside.spec.ts` — atualizar. O teste que hoje afirma o item desabilitado passa a
  afirmar o link ativo, na posição certa.
- [x] Task 03: `src/app/app.routes.ts` — o nó `jogos` dentro de `dashboard`, com as quatro rotas filhas
  (`''`, `desafios`, `desafio/:badgeId`, `ranking`), todas `loadComponent` e com `title`. Guards herdados
  do pai (`authGuard`, `profileCompleteGuard`) mais o `nicknameGuard` da Fase 03.
- [x] Task 04: `src/app/pages/jogos/jogos.page.ts` + `.html` + `.scss` — o hub com os três cards da
  decisão 1: GYM Challenge, Duels (desabilitado, "Em breve") e Ranking da Liga. Página burra, sem
  requisição nenhuma. `icon-games` e `icon-ranking` já existem; **o card de Duels precisa de um ícone
  novo componentizado** em `src/app/components/icons/`, nunca de um emoji.
- [x] Task 05: `jogos.page.spec.ts` — os três cards, o Duels sem `routerLink` e com `aria-disabled`,
  e os dois links ativos apontando certo.

---

# Fase 03: O modal de Gamertag e o guard [x]

- [x] Task 01: `src/app/components/nickname-dialog/nickname-dialog.ts` + `.scss` — modal bloqueante no molde
  do `legal-block-dialog`. Reactive form com `Validators.pattern(/^[A-Za-z0-9_-]{3,20}$/)`, o aviso de que
  o nome é único e **não poderá ser alterado depois**, e o estado de erro do `409` (decisão 16).
  Componente burro: recebe `pending`/`error` e emite `submit`.
- [x] Task 02: `nickname-dialog.spec.ts` — botão travado enquanto inválido, mensagem de erro no `409`,
  `animate-enter` / `animate-leave` presentes, e o foco preso no modal.
- [x] Task 03: `src/app/core/games/nickname.guard.ts` + `.spec.ts` — lê o `AuthStore`; com `nickname` nulo,
  abre o modal e só libera a navegação depois do `204` (adendo A.4). **Um guard, não um `if` em quatro
  páginas** — a quinta página nasceria sem ele.
- [x] Task 04: `src/app/pages/perfil/perfil.page.*` — o campo Gamertag na aba Meu Perfil, `disabled`
  quando já preenchido, com o texto explicando a imutabilidade. Atualizar `perfil.page.spec.ts`.

---

# Fase 04: O card do GYM Challenge e a lista de desafios [x]

- [x] Task 01: `src/app/components/gym-challenge-card/gym-challenge-card.ts` + `.scss` — o componente burro
  dos quatro estados da decisão 3 (`em-breve`, `xp-insuficiente`, `disponivel`, `conquistada`), com
  `input()` / `output()`, `ChangeDetectionStrategy.OnPush` e template inline se couber. Recebe o
  `ChallengeState` pronto e emite o clique. Usado em dois lugares (aqui e na trilha), e é por isso que ele
  não faz requisição.
- [x] Task 02: `gym-challenge-card.scss` — a barra de progresso de XP com `width` proporcional e
  `max-width: 100%`, o brilho pulsante em `box-shadow` dourado do estado disponível (uma vez a cada 3s),
  e a borda dourada fixa do conquistado. Um `input()` `emphasis` controla o
  `animation-iteration-count` para o uso na trilha (decisão 7). **`prefers-reduced-motion` desliga tudo.**
- [x] Task 03: `src/app/components/round-dots/` — as 3 bolinhas de rodada (aprovada / pendente / atual),
  componentizadas porque aparecem no card, na lista e na tela do desafio.
- [x] Task 04: `gym-challenge-card.spec.ts` — os quatro estados, o card de "em breve" não clicável, o texto
  de XP faltante calculado a partir do que o servidor mandou, e o `prefers-reduced-motion`.
- [x] Task 05: `src/app/pages/jogos/desafios/desafios.page.ts` + `.html` + `.scss` — smart page: chama
  `GET /games/challenges` e renderiza as 8 insígnias com o card. Ícone da insígnia reaproveitado da trilha.
- [x] Task 06: `desafios.page.spec.ts` — carregamento, estado de erro, e o clique navegando para
  `/dashboard/jogos/desafio/:badgeId`.

---

# Fase 05: A tela do desafio [x]

- [x] Task 01: `src/app/pages/jogos/desafio/desafio.page.ts` — o esqueleto com o `signal<Fase>` das cinco
  fases (`aviso` → `pronto` → `jogando` → `feedback` → `resultado`) e o `@switch` no template
  (adendo A.6). **Cinco booleanos produzem o estado inválido com dois `true`**, que aparece como duas
  telas sobrepostas.
- [~] Task 02 (**feito em outro lugar**): a tela intersticial da decisão 4 ficou **dentro do template de
  `desafio.page.html`**, e não num `challenge-warning/` próprio. Ela não é reusada em lugar nenhum, não
  tem estado próprio — o checkbox é um signal da página, que precisa dele para destravar o botão — e um
  componente para um bloco de uma tela só seria um `input` e um `output` para atravessar. O título
  "Não se sabote, se permita errar primeiro.", o texto e o checkbox "Eu li e entendi" que destrava o botão.
  **Nada é gravado** — nem servidor, nem `localStorage` (decisão 12). Ela aparece antes de toda rodada.
- [x] Task 03: os dois testes-trava vivem em `desafio.page.spec.ts`, pela mesma razão: botão travado sem
  o checkbox, e o checkbox voltando a desmarcado a cada nova rodada.
- [x] Task 04: `src/app/components/challenge-timer/` — o timer visual: `setInterval` de 100ms alimentando um
  signal, começando em 50s, azul acima de 30s, amarelo entre 10 e 30, vermelho abaixo de 10. Discreto no
  topo. **É só pintura** (decisão 5).
- [x] Task 05: `src/app/pages/jogos/desafio/answer-clock.ts` + `.spec.ts` — a medição, separada do timer
  visual: um `performance.now()` quando a questão é pintada e outro no clique, `Math.round` na diferença.
  **Nunca derivada do contador visual**, que acumula erro de `setInterval` e é estrangulado em aba de fundo
  (adendo A.5).
- [~] Task 06 (**feito em outro lugar**): o enunciado e as quatro alternativas ficaram no template da
  página, e não num `question-view/`. Mesma razão da Task 02, mais uma: o clique numa alternativa precisa
  parar o `AnswerClock`, que é da página — um componente no meio emitiria o índice e a medição
  aconteceria tarde demais, depois de mais um ciclo de detecção. Coluna no mobile,
  2x2 no desktop, alvo de toque de 48px, texto que quebra em linhas (decisão 14). Emite o índice escolhido.
- [x] Task 07: `question-view.scss` — o feedback da decisão 15: escolhida certa pulsa verde, escolhida errada
  pulsa vermelho com a correta destacada, o `+XP` sobe em fade, tudo em 200ms. Botão inferior ancorado com
  `env(safe-area-inset-bottom)`.
- [x] Task 08: `desafio.page.ts` — a fase `jogando`: `POST .../start`, as 10 questões em memória, uma por
  vez, `POST .../answer` a cada clique com o `clientElapsedMs`, o feedback por 1.5s e o avanço.
  `authStore.setXp(totalXp)` com o valor do servidor — **nunca `xp + xpAwarded`** (adendo A.8).
- [x] Task 09: `src/app/components/round-result/` — a fase `resultado`: "Você acertou 8 de 10!", o XP da
  rodada, e o botão da próxima rodada, do "Tentar Novamente" ou do "Insígnia Conquistada!". Sem confete;
  a conquista ganha o pulso dourado de 500ms no ícone (decisão 15).
- [x] Task 10: O selo "Modo Treino: Sem XP" perto do timer quando o `start` ou o `answer` devolve
  `replay: true`, e o acerto sem a animação de subida de XP (decisão 17).
- [x] Task 11: `desafio.page.spec.ts` — o fluxo completo com o service mockado: aviso obrigatório, as 10
  questões, o `clientElapsedMs` sendo enviado, a aprovação, a reprovação, o replay sem XP, e os três erros
  da API (`403` sem questões, `403` sem XP, `409` de rodada em andamento).

---

# Fase 06: O Ranking [x]

- [x] Task 01: `src/app/components/podium/` — os três cards do pódio da decisão 6: dourado, prateado e
  bronze, lado a lado no desktop e empilhados no mobile. **Cores sólidas, nada pisca, sem loop.**
- [x] Task 02: `src/app/components/position-delta/` — o selo de evolução diária (↑ verde / ↓ vermelho),
  que **só aparece quando há variação**. Pequeno, discreto e autoexplicativo. As setas são SVG
  componentizado, não caractere de emoji.
- [x] Task 03: `src/app/pages/jogos/ranking/ranking.page.ts` + `.html` + `.scss` — o pódio, a lista do 4º em
  diante com linhas alternadas, a linha do membro logado destacada em azul sutil onde quer que ela esteja,
  e a linha fixa de "Sua posição" no topo. **Todo nome exibido é o `nickname`.**
- [x] Task 04: Paginação por "Carregar mais" com o cursor `after`, acumulando no signal — nunca paginação
  por número de página.
- [x] Task 05: `ranking.page.scss` — a entrada em cascata com `appReveal`, **com teto de 6 linhas**
  (decisão 15), e `prefers-reduced-motion` desligando.
- [x] Task 06: `ranking.page.spec.ts` — a ordem, o destaque da própria linha, o "Carregar mais" pedindo a
  página seguinte, e a posição do membro no topo mesmo estando na página 3.

---

# Fase 07: A emenda na trilha [x]

- [x] Task 01: `src/app/pages/trilha/insignia/insignia.page.ts` — passa a chamar
  `GET /games/challenges/:badgeId` junto do `GET /badges/:badgeId/videos`, **num `Promise.all`**
  (regra 8 do `clauderc`).
- [x] Task 02: `insignia.page.html` — o `gym-challenge-card` com `emphasis` ligado, na aba Aulas,
  **depois de tudo, inclusive das respostas posicionadas na trilha** da spec 021 (adendo A.7).
  Não aparece na aba Perguntas Frequentes.
- [x] Task 03: `insignia.page.spec.ts` — o card presente e em último lugar, a aba Perguntas sem ele, e a
  falha do `GET /games/challenges/:badgeId` **não derrubando a lista de vídeos** — o card some, a trilha fica.

---

# Fase 08: Administração de questões [~]

- [x] Task 01: `src/app/services/admin.service.ts` + `.spec.ts` — **estendido, não duplicado**: as oito
  rotas de `/admin/badges/:badgeId/questions` e `/challenge-config` entram no serviço de admin que já
  existe (adendo A.3).
- [x] Task 02: `src/app/pages/admin/questoes/questoes-admin.page.ts` — as treze insígnias como cards
  selecionáveis, no molde exato de `pages/admin/trilha/trilha-admin.page.ts` (decisão 9).
- [x] Task 03: `src/app/app.routes.ts` — `admin/questoes` e `admin/questoes/:badgeId` com `adminGuard`,
  no molde das rotas de `admin/trilha`.
- [x] Task 04: `src/app/pages/admin/admin.page.*` — o cartão de entrada para a nova seção.
- [x] Task 05: `src/app/pages/admin/questoes/insignia-questoes.page.ts` + `.html` + `.scss` — a página da
  insígnia: contadores por dificuldade no topo, barra de progresso 73/90, a mensagem verde de
  "Desafio pronto para publicação!" quando as três faixas fecham 30, e as três abas de filtro.
- [x] Task 06: `src/app/components/question-editor/` — o formulário de questão (enunciado, 4 alternativas,
  radio da correta), reactive form, usado tanto no "Adicionar Questão" quanto na edição inline e no
  passo 2 do modal de IA. **Um componente, três usos** — três cópias divergiriam na primeira validação nova.
- [x] Task 07: A lista de questões: enunciado truncado em 2 linhas, dificuldade, as 4 alternativas com a
  correta em verde, e as ações Editar e Excluir. A exclusão passa pelo `ConfirmDialog` que já existe.
- [x] Task 08: A seção de configuração no topo (decisão 11): input de XP mínimo, o status
  "Pronto" / "Incompleto (faltam X questões)" e o botão Salvar Configuração. **Mesma página**, não uma rota
  separada — a configuração sem o banco embaixo não tem contexto.
- [ ] Task 09 (**pendente**): `insignia-questoes.page.spec.ts` — os contadores, o filtro por aba, o CRUD
  completo com o service mockado, e o estado "pronto para publicação". A tela está de pé e compila; o
  arquivo de teste dela não foi escrito.

---

# Fase 09: Geração com IA [~]

- [x] Task 01: `src/app/components/ai-generate-dialog/ai-generate-dialog.ts` + `.scss` — o modal de dois
  passos da decisão 10. Passo 1: textarea do prompt, select de dificuldade, select de quantidade
  (10 / 20 / 30) e o botão Gerar.
- [x] Task 02: O estado de loading com **esqueleto de questões**, não spinner — a espera da API é longa e
  o esqueleto diz o que está vindo.
- [x] Task 03: Passo 2 — a lista revisável, cada questão com o `question-editor` da Fase 08, o checkbox de
  seleção e o botão de excluir individual. Sem "regenerar" por questão (ponto em aberto 4, fechado: não).
- [x] Task 04: A barra de ação fixa no rodapé: "Selecionadas: 28/30" e o botão "Salvar Selecionadas"
  chamando `POST .../questions/bulk`.
- [x] Task 05: O aviso de descarte ao fechar com rascunho não salvo, usando o `ConfirmDialog` existente —
  **não** o `unsavedChangesGuard`, que é de rota e aqui não há troca de rota (adendo A.9).
- [ ] Task 06 (**pendente**): `ai-generate-dialog.spec.ts` — os dois passos, a edição antes de salvar, a
  contagem de selecionadas, o corpo do `bulk` levando só as marcadas, e o aviso de descarte no
  fechamento. O modal está de pé e compila; o arquivo de teste dele não foi escrito.

---

# Fase 10: Acessibilidade, movimento e fechamento []

- [x] Task 01: Varredura de `prefers-reduced-motion` em todos os `.scss` desta spec — card, timer, feedback,
  conquista e cascata do ranking. É a regra de todas as specs, e é a que mais escapa em `.scss` novo.
- [x] Task 02: Acessibilidade do questionário: as alternativas são `<button>` com `aria-pressed`, o
  resultado é anunciado em `aria-live="polite"`, o timer é `aria-hidden` (é decoração, e um contador lido
  em voz alta a cada segundo torna a tela inutilizável no leitor de tela).
- [ ] Task 03 (**pendente**): passada mobile no Chrome, largura de 360px: alvo de toque de 48px nas alternativas, o botão
  inferior com `env(safe-area-inset-bottom)`, o pódio empilhado e a tabela do ranking sem estouro horizontal.
- [x] Task 04: Conferir que nenhuma tela desta spec grava em `localStorage` (decisão 12) e que nenhuma
  calcula XP ou conhece `correctIndex` fora do que o servidor mandou (decisão 13).
- [~] Task 05: `npm test` **limpo (648 testes)** e `ng build` passando. **A passada no Chrome não foi feita: a extensão do navegador não está conectada nesta máquina.** O fluxo:
  aside → hub → gamertag → desafios → uma rodada completa → ranking → trilha com o card → admin de questões.
- [x] Task 06: Marcar as emendas nas specs afetadas: **008** (Jogos sai do "Em breve"), **009** (trilha e
  administração estendidas), **019** (XP com duas fontes) e **021** (o card é o último item da aba Aulas).
