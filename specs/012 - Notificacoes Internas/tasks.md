# Fase 01: Camada de dados [ ]
Branch: `feat/012-notificacoes-camada-de-dados`

Nenhuma tela. Ao fim desta fase a notificação tem modelo, service, store e teste — e nada aparece ainda.

- [ ] Task 01: Modelar a notificação. Arquivo: `src/app/models/notification.model.ts`. Objetivo:
  `AppNotification` com `id`, `kind: 'video' | 'pergunta'`, `title`, `badgeId`, `createdAt`. O comentário
  registra que **a lista já vem só com as não lidas** e que o front não filtra nada (decisão 8 do
  backend) — é a regra que mais tende a ser reimplementada "por segurança".
- [ ] Task 02 (TDD + implementação): `NotificationService`. Arquivos:
  `src/app/services/notification.service.ts`, `.spec.ts`. Objetivo: `GET /notificacoes`,
  `POST /notificacoes/:id/lida`, `POST /notificacoes/lidas`. **Lista vazia é sucesso, não erro** — o
  mesmo teste-trava da trilha e do Mural.
- [ ] Task 03 (TDD + implementação): O store do sino. Arquivos:
  `src/app/core/notifications/notifications.store.ts`, `.spec.ts`. Objetivo: signal com a lista,
  `unreadCount` como `computed`, `hasUnread` como `computed`. `markRead(id)` é **otimista**: tira da
  lista na hora e devolve se a requisição falhar (decisão 12). `markAllRead()` esvazia e devolve tudo se
  falhar.
- [ ] Task 04 (TDD + implementação): Falhar carregando não é erro de tela. Objetivo: `GET` falhando
  deixa a lista vazia e **nenhum estado de erro visível** (decisão 12). Teste-trava: 500 na carga não
  produz mensagem nem quebra o `hasUnread`.
- [ ] Task 05 (TDD + implementação): Formatar a hora. Arquivos:
  `src/app/core/notifications/notification-time.ts`, `.spec.ts`. Objetivo: `14:32` hoje, `ontem 14:32`
  ontem, `12/08` antes (decisão 7). Testes com data fixa injetada, **nunca com `new Date()` solto** — um
  teste que depende da hora de execução quebra sozinho de madrugada.
- [ ] Task 06 (TDD + implementação): Resolver insígnia a partir do `badgeId`. Arquivos:
  `src/app/services/community.service.ts` (ou helper ao lado), `.spec.ts`. Objetivo: nome e ícone vindos
  do `trackStages` que já existe (decisão 8 desta spec / spec 008). **Nenhuma segunda tabela de
  insígnias** — a terceira cópia dos treze ids é a que vai divergir.

# Fase 02: O sino [ ]
Branch: `feat/012-sino`

- [ ] Task 01: Ícone. Arquivo: `src/app/components/icons/icon-bell.ts`. Objetivo: SVG no padrão dos
  outros ícones — `currentColor`, `aria-hidden`, sem tamanho fixo embutido.
- [ ] Task 02: Componente do sino com contador. Arquivo:
  `src/app/components/notification-bell/notification-bell.{ts,spec.ts}`. Objetivo: botão com
  `aria-expanded`, `aria-controls` e `aria-label` por extenso ("Notificações, 3 não lidas" — decisão 4).
  Contador `1`–`9` e **`9+`** acima disso. Zero não lidas: sem ponto, sem brilho.
- [ ] Task 03: O balanço e o brilho. Objetivo: `~700ms` de balanço a cada **8s**, brilho laranja pulsando
  no mesmo compasso, **só com não lidas** (decisão 2). O comentário registra por que periódico e não
  contínuo — a versão contínua é o que qualquer um escreveria primeiro, e é a que ensina a ignorar o
  ícone.
- [ ] Task 04 (TDD): `prefers-reduced-motion`. Objetivo: sem balanço e sem brilho; **o contador fica**
  (decisão 3). Teste-trava: o número continua acessível com a mídia ligada.
- [ ] Task 05: Os dois lugares. Arquivos: `src/app/pages/dashboard/dashboard-shell.ts`,
  `src/app/components/dashboard-aside/dashboard-aside.ts`. Objetivo: sino na `.mobile-header` à direita e
  no `.aside__head` no desktop (decisão 1). **Visível também com o aside recolhido** — teste-trava, é o
  jeito mais fácil de perder o recurso inteiro no desktop sem perceber.
- [ ] Task 06: Parar o balanço ao abrir. Objetivo: painel aberto, sino parado. Chamado atendido não
  continua chamando.

# Fase 03: O painel [ ]
Branch: `feat/012-painel`

- [ ] Task 01: Casca do painel. Arquivo:
  `src/app/components/notification-panel/notification-panel.{ts,spec.ts}`. Objetivo: cartão ancorado ao
  sino, `slide down` de ~180ms, **sobreposto e sem empurrar o conteúdo** (decisão 5). Sombra dura, como o
  resto do sistema.
- [ ] Task 02: Fechar. Objetivo: `Esc`, clique fora e navegação fecham. Foco volta para o sino ao fechar
  com `Esc` — sem isso, quem navega por teclado é jogado para o começo da página.
- [ ] Task 03: A lista. Objetivo: rolagem interna com altura máxima de ~24rem. Cada linha: ícone da
  insígnia, título em **duas linhas com `line-clamp`**, hora à direita (decisão 6). **Nada de `substring`
  no TypeScript** — teste-trava: o título chega inteiro ao componente.
- [ ] Task 04: O check de cada linha. Arquivos: `src/app/components/icons/icon-check.ts` (já existe),
  `notification-panel.ts`. Objetivo: botão no canto direito, depois da hora, `aria-label`
  "Marcar como lida". **Botão irmão da linha, nunca dentro dela** (decisão 6) — teste-trava: o clique no
  check **não** abre o modal e **não** navega.
- [ ] Task 05: Marcar uma como lida, otimista. Objetivo: a linha sai da lista na hora, o contador cai, e
  tudo volta se a requisição falhar (decisões 9 e 12). Saída curta, para a lista não se reorganizar
  embaixo do dedo no gesto seguinte — mesmo cuidado que o Mural tomou ao não reordenar no voto.
- [ ] Task 06: Estado vazio. Objetivo: "Nada novo por aqui", discreto. O painel abre igual — abrir e não
  ver nada acontecer é pior que abrir e ler que não há nada. **Marcar a última como lida cai neste
  estado sem fechar o painel.**
- [ ] Task 07: "Marcar todas como lidas". Objetivo: no rodapé, só quando houver algo. Otimista, com
  rollback na falha (decisão 9).
- [ ] Task 08: Carga. Arquivo: `dashboard-shell.ts`. Objetivo: `GET /notificacoes` na inicialização da
  casca e de novo ao abrir o painel. **Nenhum `setInterval`** (decisão 11) — teste-trava, porque o
  intervalo é o primeiro reflexo de quem for "melhorar" isso depois.
- [ ] Task 09 (TDD): Spec do painel. Objetivo: abre e fecha, lista renderizada na ordem que veio,
  contador batendo com a lista, o check tirando **só uma** e devolvendo na falha, "marcar todas"
  esvaziando, e a falha de carga **sem** estado de erro.

# Fase 04: O modal e o destino [ ]
Branch: `feat/012-modal`

- [ ] Task 01: Modal da notificação. Arquivo:
  `src/app/components/notification-dialog/notification-dialog.{ts,spec.ts}`. Objetivo: título completo,
  **uma frase** no formato fixo da decisão 8, **um botão só**. Reusa o diálogo existente, com foco preso
  e `Esc`.
- [ ] Task 02: Os dois destinos. Objetivo: vídeo → `/dashboard/trilha/{badgeId}`; pergunta →
  `/dashboard/mural?ordem=recentes` (decisão 10). Navegar fecha o modal **e** o painel.
- [ ] Task 03: Marcar como lida ao abrir o modal. Objetivo: é o abrir do modal que marca, **não o abrir
  do painel** (decisão 9). Teste-trava: abrir o painel e fechar sem tocar em nada **não** marca nada —
  sem histórico, o que some aqui some para sempre.
- [ ] Task 04: A frase e a insígnia. Objetivo: "Vídeo novo na Insígnia do Git e GitHub." /
  "Pergunta nova no Mural, na Insígnia da Lógica." — nome vindo do `trackStages` (Fase 01, Task 06).
- [ ] Task 05 (TDD): Spec do modal. Objetivo: as duas frases, os dois destinos, e a marcação acontecendo
  uma vez só.

# Fase 05: O Mural por mais recentes [ ]
Branch: `feat/012-mural-recentes`

- [ ] Task 01 (TDD + implementação): `ordem` no `MuralService`. Arquivos:
  `src/app/services/mural.service.ts`, `.spec.ts`. Objetivo: `listQuestions(fase, ordem?)` repassando
  `ordem=recentes`. **Sem o parâmetro, a chamada de hoje não muda** — teste-trava.
- [ ] Task 02 (TDD + implementação): O query param na página. Arquivos:
  `src/app/pages/mural/mural.page.{ts,html}`, `.spec.ts`. Objetivo: `?ordem=recentes` abre em **"Esta
  semana"** com as mais novas em cima. Sem o parâmetro, a aba inicial continua sendo "Em votação"
  (decisão 1 da spec 010) — teste-trava, porque trocar a aba padrão silenciosamente quebraria o Mural
  para quem chega pelo menu.

# Fase 06: Mobile e movimento [ ]
Branch: `feat/012-mobile`

- [ ] Task 01: O painel como folha. Objetivo: abaixo de 48rem, largura cheia com margem pequena, ancorado
  no topo, altura máxima **70svh** (decisão 13). `svh` e não `vh` — a barra do navegador do celular come
  a diferença.
- [ ] Task 02: Alvos de toque. Objetivo: **44px de verdade** no sino, em cada linha e **no check**, com
  área maior que o desenho. O sino fica na barra do topo, que é a pior região para o polegar; o alvo
  compensa o que a posição não pode. **Linha e check são dois alvos vizinhos** (decisão 13): conferir no
  aparelho que tocar o check não abre o modal, porque é aqui que 44px deixa de ser régua e vira função.
- [ ] Task 03: Rolagem presa ao painel. Objetivo: rolar dentro da lista não rola a página atrás
  (`overscroll-behavior: contain`). Sem isso, chegar ao fim da lista arrasta o painel inteiro no celular.
- [ ] Task 04: Verificação em aparelho real. Objetivo: as regras de movimento existem por causa do
  celular fraco; conferir no desktop é não conferir. **Incluir Safari do iPhone**, pelo mesmo motivo da
  spec 011.

# Fase 07: Documentação e release [ ]
Branch: `feat/012-docs`

- [ ] Task 01: `README.md`. Objetivo: o recurso em duas linhas — dois eventos, sem tempo real, sem
  histórico.
- [ ] Task 02: Atualizar a linha da spec 010. Objetivo: onde estiver escrito que **não existe canal de
  notificação no produto**, corrigir apontando para esta spec. Enquanto a frase antiga estiver lá, ela
  contradiz o produto.
- [ ] Task 03: `npm test` (Karma) verde e `ng build` limpo.
- [ ] Task 04: Verificação com duas contas em produção. Objetivo: publicar um vídeo com o admin e ver o
  sino tocar na conta do membro. **Conferir que o admin não recebe a própria notificação** (decisão 5 do
  backend) — é o detalhe que faz o recurso parecer quebrado no primeiro uso.
- [ ] Task 05: Verificação com leitor de tela. Objetivo: o `aria-label` do sino diz a contagem por
  extenso, o painel é alcançável por teclado, e o foco volta ao sino ao fechar. **Cada linha são duas
  paradas de `Tab`** — a linha e o check —, e o check se anuncia como "Marcar como lida", não como um
  botão sem nome.

---

## Resultado da execução

_A preencher ao fim, no formato das specs 009, 010 e 011: o que ficou de fora e por quê, e o que a
execução decidiu que vale registrar._
