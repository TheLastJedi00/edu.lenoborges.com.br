# Fase 01: Modelo e domínio []
Branch: `feat/008-modelo`

A base primeiro. Enquanto esta fase não fecha, nenhuma tela tem o que exibir.

- [] Task 01: Renomear os conceitos no modelo. Arquivo: `src/app/models/community.model.ts`.
  Objetivo: `GradeProgress` vira `BadgeProgress` (`totalBadges`, `freeBadges`); `TrackStage` ganha
  `phase: 'gym' | 'elite' | 'frontier'` para as três naturezas de etapa conviverem na mesma
  lista sem `if` espalhado por componente. O comentário de topo do arquivo cita a Seita Dev e é o
  primeiro a mudar.
- [] Task 02: Ampliar o `TrackIconId`. Arquivo: `src/app/models/community.model.ts`. Objetivo:
  acrescentar `firebase`, `supabase`, `docker` e `ia`. `sql` e `stacks` ficam no tipo por ora, órfãos
  e documentados como tal — apagar agora quebraria o build antes de a Fase 02 reescrever os dados.
- [] Task 03: Criar o tipo da Elite Four. Arquivo: `src/app/models/community.model.ts`. Objetivo: as
  quatro fases (`oitavas`, `quartas`, `semifinais`, `final`) precisam de nome exibível e ordem. Sem
  isso a fase vira string solta e a ordem vira posição de array.
- [] Task 04: Mapear `grade` para nome. Arquivo novo:
  `src/app/core/progress/progress.ts`. Objetivo: uma função pura que recebe `grade: 0..13` e devolve
  o que exibir (rótulo, natureza, quantas insígnias faltam). É o único lugar que sabe a tabela da
  decisão 4 — hoje o `grade-badge` reimplementaria isso sozinho, e o dashboard de novo.
- [] Task 05 (TDD): Testar o mapa de progresso. Arquivo: `src/app/core/progress/progress.spec.ts`.
  Objetivo: cobrir as fronteiras, que são onde erro de faixa mora: `0` (nenhuma insígnia), `8` (todas,
  antes da Elite Four), `9` (venceu as Oitavas), `12` (campeão), `13` (pós-game) e valor fora da faixa.

# Fase 02: Conteúdo da trilha []
Branch: `feat/008-trilha`

O dado antes das telas. É a fase com mais texto e menos código.

- [] Task 01: Reescrever a identidade. Arquivo: `src/app/services/community.service.ts`. Objetivo:
  `name`, `tagline`, `summary` e `status` deixam de falar em Seita e passam a falar em Liga Dev. O
  `summary` descreve a trilha inteira e é onde a metáfora precisa ficar clara sem virar piada interna.
- [] Task 02: Substituir os 33 Graus pelas 8 Insígnias. Arquivo:
  `src/app/services/community.service.ts`. Objetivo: `grades: { totalGrades: 33, freeGrades: 5 }` vira
  `badges: { totalBadges: 8, freeBadges: 2 }`, conforme a decisão 5.
- [] Task 03: Remontar as etapas da trilha. Arquivo: `src/app/services/community.service.ts`.
  Objetivo: as 12 etapas atuais viram 8 GYM Battles + 4 Elite Battles + a Battle Frontier, na ordem da decisão
  2 e da decisão 3. **Banco de dados deixa de ser etapa** e seus tópicos entram na Insígnia do Spring
  Boot; `Stacks` sai, porque era visão geral e a lista de insígnias já é a visão geral.
- [] Task 04: Reescrever as faixas como três tiers. Arquivos:
  `src/app/services/community.service.ts`, `src/app/models/community.model.ts`. Objetivo: as duas
  faixas viram **Dev Tier** (Gratuito), **Great Dev Tier** (R$ 19,99) e **Ultra Dev Tier**
  (R$ 199,99), conforme a decisão 5. O `CommunityTier.range` (`'Grau 1 ao 5'`) deixa de fazer sentido
  como faixa de grau e passa a descrever o que o tier entrega. Os `perks` precisam ser **cumulativos e
  ditos como tal** — cada tier começa por "tudo do anterior, mais", senão a tabela lê como
  alternativas em vez de degraus. **Não inventar categoria de material**: o Great entrega a
  continuação da mesma plataforma, não um conteúdo novo (decisão 5).
- [] Task 04b: Tornar a escassez do Ultra visível na tabela. Arquivos:
  `src/app/services/community.service.ts` e a página que exibe as faixas. Objetivo: o salto de
  R$ 19,99 para R$ 199,99 é de dez vezes, e três preços em sequência fazem o terceiro parecer
  arbitrário (decisão 5b). O que explica o número é o teto físico — quatro cadeiras, quatro Grindings
  por mês — e ele precisa aparecer **na própria faixa**, não só no bloco da Grinding Arena mais
  abaixo. Quem compara preço não rola a página antes de comparar.
- [] Task 05: Renomear o Conclave para Grinding Arena. Arquivos:
  `src/app/services/community.service.ts`, `src/app/models/community.model.ts`. Objetivo: a interface
  `Conclave` vira `GrindingArena`, `title: 'O Conclave'` vira `'A Grinding Arena'`, e o `summary`
  deixa de dizer "a mentoria da Seita". `duration` e `cadence` passam a falar em Grinding — "Um
  Grinding por semana", "2 horas por Grinding". **Não usar "Elite" no texto**: a palavra pertence ao
  endgame (decisão 1).
- [] Task 05b: Ligar a Grinding Arena ao Ultra Dev Tier. Arquivos:
  `src/app/services/community.service.ts`, e a página que exibe os dois. Objetivo: a mentoria deixa de
  ser um produto solto ao lado das faixas e vira **o** benefício do tier mais alto. O bloco próprio
  continua existindo, porque ele carrega `seats`, `duration` e `cadence` que nenhuma faixa comporta —
  mas o Ultra Dev Tier precisa apontar para ele, e o `price` de R$ 150,00 deixa de viver em dois
  lugares com risco de divergir.
- [] Task 06: Atualizar os testes do serviço. Arquivo:
  `src/app/services/community.service.spec.ts`. Objetivo: ele afirma coisas sobre Graus e sobre a
  Seita; passa a afirmar sobre Insígnias e sobre a Liga.

# Fase 03: Componentes []
Branch: `feat/008-componentes`

Dumb components, pela regra 7 do `clauderc.md`: quem busca dado é a página.

- [] Task 01: Trocar o selo de progresso. Arquivos: `src/app/components/grade-badge/` renomeado para
  `badge-count/`. Objetivo: "Grau 3 / 33" vira "Insígnia 3 / 8", e o componente passa a lidar com os
  estados que o número sozinho não expressa: durante a Elite Four ele mostra a Elite Battle, e na Battle Frontier mostra
  o título. O `aria-label` precisa acompanhar, senão o leitor de tela continua anunciando Graus.
- [] Task 02: Trocar a régua de progressão. Arquivos: `src/app/components/grade-ladder/` renomeado
  para `badge-ladder/`. Objetivo: a régua de 33 passos vira 8 insígnias mais as quatro Elite Battles. São
  duas naturezas diferentes no mesmo desenho, e a segunda é mata-mata, não escada.
- [] Task 03: Ajustar a timeline da trilha. Arquivo:
  `src/app/components/track-timeline/track-timeline.ts`. Objetivo: exibir GYM Battle e Elite Battle
  com pesos visuais diferentes, usando o `phase` da Fase 01 Task 01. As quatro fases finais não são
  "mais quatro etapas": são o prêmio, e a tela precisa dizer isso sem texto.
- [] Task 04: Criar os quatro ícones que faltam. Arquivos:
  `src/app/components/icons/icon-firebase.ts`, `icon-supabase.ts`, `icon-docker.ts`, `icon-ia.ts`.
  Objetivo: SVG componentizado, nunca emoji (regra 1 do `clauderc.md`).
- [] Task 05: Atualizar os testes de componente. Arquivos: `badge-count.spec.ts`,
  `badge-ladder.spec.ts`. Objetivo: o `grade-badge.spec.ts` atual tem seis asserções sobre Graus.
  Cobrir também os estados de Elite Four e Battle Frontier, que são novos e é onde o componente vai errar.

# Fase 04: Páginas e vocabulário []
Branch: `feat/008-paginas`

A varredura. É onde o rebranding aparece para quem usa.

- [] Task 01: Página da comunidade. Arquivos: `src/app/pages/comunidade/comunidade.page.html`,
  `.ts`, `.scss`. Objetivo: nove ocorrências de Seita no HTML e as três de Grau. É a página que
  explica a metáfora inteira, então não é substituição de palavra: o texto precisa ser relido.
- [] Task 02: Landing. Arquivos: `src/app/pages/landing/landing.page.html`, `.ts`, `.scss`.
  Objetivo: seis ocorrências no HTML, três no SCSS (nomes de classe) e uma no TS. O botão "Entrar na
  Seita Dev" do menu é o mais visível do site.
- [] Task 03: Dashboard. Arquivos: `src/app/pages/dashboard/dashboard-shell.ts`,
  `dashboard.page.html`, `dashboard.page.ts`. Objetivo: o `aria-label` do logo, o título e a mensagem
  do diálogo de logout. É aqui que o selo de progresso aparece, então é a tela que mais depende da
  Fase 03.
- [] Task 03b: Preparar o painel para o teto de avanço. Arquivos:
  `src/app/pages/dashboard/dashboard.page.html`, `.ts`. Objetivo: pela decisão 5d existe **uma regra
  só** — acessa-se o que já foi conquistado, e a assinatura compra avançar além disso. A tela precisa
  saber exibir insígnia conquistada acesa e a seguinte apagada, com o selo intacto ao lado. Hoje todos
  os cartões estão em "EM BREVE", então o desenho já sabe exibir cartão desabilitado; o que falta é o
  motivo ser outro. **Não criar estado de assinatura** (ponto em aberto 1): esta task deixa a tela
  capaz de receber o número, sem inventar de onde ele vem. E o cartão do WhatsApp **nunca** entra na
  regra: ele é habilitado em qualquer estado.
- [] Task 03c: Deixar o teto de avanço no mesmo lugar do mapa de progresso. Arquivo:
  `src/app/core/progress/progress.ts`. Objetivo: `tetoDeAvanco = assinaturaAtiva ? 13 : max(2, grade)`
  (decisão 5d) fica junto da tabela de `grade`, que é o único módulo que já sabe as faixas. Cobrir com
  teste as combinações que definem a regra: gratuito com 0, cancelado com 1 (ainda alcança a 2),
  cancelado com 6 (congelado) e assinante com 6. **A função recebe `assinaturaAtiva` como parâmetro**
  e não consulta nada — quando a cobrança existir, ela só passa a receber `true` de outro lugar.
- [] Task 04: Diálogos de auth e waitlist. Arquivos:
  `src/app/components/auth-dialog/auth-dialog.ts`, `src/app/components/waitlist-dialog/`. Objetivo: o
  spec do auth-dialog tem **17 ocorrências** de Seita, o maior número do projeto — a maioria em nome
  de teste e em texto esperado.
- [] Task 05: Completar perfil. Arquivo:
  `src/app/pages/completar-perfil/completar-perfil.page.html`. Objetivo: o texto de onboarding fala em
  entrar para a comunidade.
- [] Task 06: Títulos de rota. Arquivo: `src/app/app.routes.ts`. Objetivo: três `title` com Seita
  Dev. Eles são o que aparece na aba do navegador e no histórico, então valem mais que o tamanho da
  mudança sugere.
- [] Task 07: Comentários de ambiente. Arquivos: `src/environments/environment.ts`,
  `environment.production.ts`. Objetivo: os dois descrevem o link do WhatsApp como "grupo oficial da
  Seita Dev". O link em si não muda; se o nome do grupo mudar no WhatsApp, é tarefa de usuário.
- [] Task 08: Varredura final. Objetivo: `grep -ri "seita\|grau\|conclave" src` precisa voltar vazio.
  Existe como task própria porque as sete anteriores vão deixar sobra — sempre deixam.

# Fase 05: Backend []
Branch: `feat/008-grade` (no repositório `../eduleno-back`)

Duas constantes e um default. É toda a superfície de backend desta spec.

- [] Task 01: Ampliar a faixa de `grade`. Arquivo:
  `src/profile/entities/profile.entity.ts`. Objetivo: `GRADE_MIN` de `1` para `0` e `GRADE_MAX` de
  `33` para `13`, com o comentário explicando a tabela da decisão 4 — o número sozinho não conta que
  `12` é campeão.
- [] Task 02: Nascer sem insígnia. Arquivo: `src/auth/auth.service.ts`. Objetivo: o `grade: 1` do
  `createProfileFor` vira `grade: 0`. Nascer com uma insígnia seria dar uma conquista de graça.
- [] Task 03: Atualizar os testes que fixam o padrão. Arquivos:
  `src/auth/auth.service.spec.ts`, `src/profile/profile.repository.spec.ts`. Objetivo: vários
  `profileVazio` e asserções assumem `grade: 1`.
- [] Task 04: Corrigir a documentação da faixa. Arquivos: `README.md`, `CLAUDE.md`,
  `specs/007 - Firestore e Firebase Auth/context.md`. Objetivo: os três descrevem `grade` como `1 a
  33`. Na spec 007, corrigir a linha da decisão 7 e apontar para esta spec, sem reescrever o resto —
  a 007 continua vigente.
- [] Task 05 (usuário): Zerar o `grade` dos perfis de teste no Firestore. Objetivo: os dois perfis
  existentes nasceram com `grade: 1`, que sob o modelo novo significa "conquistou a Insígnia da
  Lógica". É o ponto em aberto 3 do `context.md`.

# Fase 06: Documentação []
Branch: `feat/008-docs`

- [] Task 01: Marcar a spec 003 como Deprecated. Arquivo: `specs/003 - Comunidade/context.md`.
  Objetivo: ela definiu a Seita Dev, os 33 Graus, as faixas e o Conclave. Referenciar esta spec, sem
  reescrever o conteúdo dela.
- [] Task 02: Registrar o vocabulário. Arquivo: `specs/008 - Liga Dev/context.md`, seção nova
  "Vocabulário final". Objetivo: a tabela antes/depois da decisão 6, fechada com os nomes que a Fase
  02 escolheu para a faixa gratuita e para o endgame. Quem chegar depois precisa de um lugar só para
  descobrir como se chama cada coisa.

# Fase 07: Release e verificação []
Branch: `release/008-liga-dev`

- [] Task 01: Rodar a suíte e o build nos dois repositórios. Objetivo: `ng test` e `ng build` no
  front, `jest` e `nest build` no back.
- [] Task 02: Conferir no navegador, em mobile primeiro (regra 2 do `clauderc.md`). Objetivo: landing,
  comunidade, onboarding e dashboard. O selo de progresso precisa ser conferido em mais de um valor de
  `grade` — pelo menos `0`, `8` e `12` —, e trocar `grade` à mão no Firestore é o jeito de fazer isso.
- [] Task 03: Conferir o que não é texto. Objetivo: título da aba em cada rota, `aria-label` do logo
  do dashboard e o rótulo do selo lido por leitor de tela. São as três coisas que uma varredura visual
  não pega.
- [] Task 04: Abrir o release e mergear em `dev` nos dois repositórios, na ordem back e depois front.
  Objetivo: o front lê `grade` da API; subir o front primeiro exibiria "Insígnia 1 / 8" para quem o
  backend ainda considera Grau 1.
