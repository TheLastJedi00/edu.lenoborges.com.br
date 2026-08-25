# Fase 01: Camada de dados [x]
Branch: `feat/012-notificacoes-camada-de-dados`

Nenhuma tela. Ao fim desta fase a notificação tem modelo, service, store e teste — e nada aparece ainda.

- [x] Task 01: Modelar a notificação. Arquivo: `src/app/models/notification.model.ts`. Objetivo:
  `AppNotification` com `id`, `kind: 'video' | 'pergunta'`, `title`, `badgeId`, `createdAt`. O comentário
  registra que **a lista já vem só com as não lidas** e que o front não filtra nada (decisão 8 do
  backend) — é a regra que mais tende a ser reimplementada "por segurança".
- [x] Task 02 (TDD + implementação): `NotificationService`. Arquivos:
  `src/app/services/notification.service.ts`, `.spec.ts`. Objetivo: `GET /notificacoes`,
  `POST /notificacoes/:id/lida`, `POST /notificacoes/lidas`. **Lista vazia é sucesso, não erro** — o
  mesmo teste-trava da trilha e do Mural.
- [x] Task 03 (TDD + implementação): O store do sino. Arquivos:
  `src/app/core/notifications/notifications.store.ts`, `.spec.ts`. Objetivo: signal com a lista,
  `unreadCount` como `computed`, `hasUnread` como `computed`. `markRead(id)` é **otimista**: tira da
  lista na hora e devolve se a requisição falhar (decisão 12). `markAllRead()` esvazia e devolve tudo se
  falhar.
- [x] Task 04 (TDD + implementação): Falhar carregando não é erro de tela. Objetivo: `GET` falhando
  deixa a lista vazia e **nenhum estado de erro visível** (decisão 12). Teste-trava: 500 na carga não
  produz mensagem nem quebra o `hasUnread`.
- [x] Task 05 (TDD + implementação): Formatar a hora. Arquivos:
  `src/app/core/notifications/notification-time.ts`, `.spec.ts`. Objetivo: `14:32` hoje, `ontem 14:32`
  ontem, `12/08` antes (decisão 7). Testes com data fixa injetada, **nunca com `new Date()` solto** — um
  teste que depende da hora de execução quebra sozinho de madrugada.
- [x] Task 06 (TDD + implementação): Resolver insígnia a partir do `badgeId`. Arquivos:
  `src/app/services/community.service.ts` (ou helper ao lado), `.spec.ts`. Objetivo: nome e ícone vindos
  do `trackStages` que já existe (decisão 8 desta spec / spec 008). **Nenhuma segunda tabela de
  insígnias** — a terceira cópia dos treze ids é a que vai divergir.

# Fase 02: O sino [x]
Branch: `feat/012-sino`

- [x] Task 01: Ícone. Arquivo: `src/app/components/icons/icon-bell.ts`. Objetivo: SVG no padrão dos
  outros ícones — `currentColor`, `aria-hidden`, sem tamanho fixo embutido.
- [x] Task 02: Componente do sino com contador. Arquivo:
  `src/app/components/notification-bell/notification-bell.{ts,spec.ts}`. Objetivo: botão com
  `aria-expanded`, `aria-controls` e `aria-label` por extenso ("Notificações, 3 não lidas" — decisão 4).
  Contador `1`–`9` e **`9+`** acima disso. Zero não lidas: sem ponto, sem brilho.
- [x] Task 03: O balanço e o brilho. Objetivo: `~700ms` de balanço a cada **8s**, brilho laranja pulsando
  no mesmo compasso, **só com não lidas** (decisão 2). O comentário registra por que periódico e não
  contínuo — a versão contínua é o que qualquer um escreveria primeiro, e é a que ensina a ignorar o
  ícone.
- [x] Task 04 (TDD): `prefers-reduced-motion`. Objetivo: sem balanço e sem brilho; **o contador fica**
  (decisão 3). Teste-trava: o número continua acessível com a mídia ligada.
- [x] Task 05: Os dois lugares. Arquivos: `src/app/pages/dashboard/dashboard-shell.ts`,
  `src/app/components/dashboard-aside/dashboard-aside.ts`. Objetivo: sino na `.mobile-header` à direita e
  no `.aside__head` no desktop (decisão 1). **Visível também com o aside recolhido** — teste-trava, é o
  jeito mais fácil de perder o recurso inteiro no desktop sem perceber.
- [x] Task 06: Parar o balanço ao abrir. Objetivo: painel aberto, sino parado. Chamado atendido não
  continua chamando.

# Fase 03: O painel [x]
Branch: `feat/012-painel`

- [x] Task 01: Casca do painel. Arquivo:
  `src/app/components/notification-panel/notification-panel.{ts,spec.ts}`. Objetivo: cartão ancorado ao
  sino, `slide down` de ~180ms, **sobreposto e sem empurrar o conteúdo** (decisão 5). Sombra dura, como o
  resto do sistema.
- [x] Task 02: Fechar. Objetivo: `Esc`, clique fora e navegação fecham. Foco volta para o sino ao fechar
  com `Esc` — sem isso, quem navega por teclado é jogado para o começo da página.
- [x] Task 03: A lista. Objetivo: rolagem interna com altura máxima de ~24rem. Cada linha: ícone da
  insígnia, título em **duas linhas com `line-clamp`**, hora à direita (decisão 6). **Nada de `substring`
  no TypeScript** — teste-trava: o título chega inteiro ao componente.
- [x] Task 04: O check de cada linha. Arquivos: `src/app/components/icons/icon-check.ts` (já existe),
  `notification-panel.ts`. Objetivo: botão no canto direito, depois da hora, `aria-label`
  "Marcar como lida". **Botão irmão da linha, nunca dentro dela** (decisão 6) — teste-trava: o clique no
  check **não** abre o modal e **não** navega.
- [x] Task 05: Marcar uma como lida, otimista. Objetivo: a linha sai da lista na hora, o contador cai, e
  tudo volta se a requisição falhar (decisões 9 e 12). Saída curta, para a lista não se reorganizar
  embaixo do dedo no gesto seguinte — mesmo cuidado que o Mural tomou ao não reordenar no voto.
- [x] Task 06: Estado vazio. Objetivo: "Nada novo por aqui", discreto. O painel abre igual — abrir e não
  ver nada acontecer é pior que abrir e ler que não há nada. **Marcar a última como lida cai neste
  estado sem fechar o painel.**
- [x] Task 07: "Marcar todas como lidas". Objetivo: no rodapé, só quando houver algo. Otimista, com
  rollback na falha (decisão 9).
- [x] Task 08: Carga. Arquivo: `dashboard-shell.ts`. Objetivo: `GET /notificacoes` na inicialização da
  casca e de novo ao abrir o painel. **Nenhum `setInterval`** (decisão 11) — teste-trava, porque o
  intervalo é o primeiro reflexo de quem for "melhorar" isso depois.
- [x] Task 09 (TDD): Spec do painel. Objetivo: abre e fecha, lista renderizada na ordem que veio,
  contador batendo com a lista, o check tirando **só uma** e devolvendo na falha, "marcar todas"
  esvaziando, e a falha de carga **sem** estado de erro.

# Fase 04: O modal e o destino [x]
Branch: `feat/012-modal`

- [x] Task 01: Modal da notificação. Arquivo:
  `src/app/components/notification-dialog/notification-dialog.{ts,spec.ts}`. Objetivo: título completo,
  **uma frase** no formato fixo da decisão 8, **um botão só**. Reusa o diálogo existente, com foco preso
  e `Esc`.
- [x] Task 02: Os dois destinos. Objetivo: vídeo → `/dashboard/trilha/{badgeId}`; pergunta →
  `/dashboard/mural?ordem=recentes` (decisão 10). Navegar fecha o modal **e** o painel.
- [x] Task 03: Marcar como lida ao abrir o modal. Objetivo: é o abrir do modal que marca, **não o abrir
  do painel** (decisão 9). Teste-trava: abrir o painel e fechar sem tocar em nada **não** marca nada —
  sem histórico, o que some aqui some para sempre.
- [x] Task 04: A frase e a insígnia. Objetivo: "Vídeo novo na Insígnia do Git e GitHub." /
  "Pergunta nova no Mural, na Insígnia da Lógica." — nome vindo do `trackStages` (Fase 01, Task 06).
- [x] Task 05 (TDD): Spec do modal. Objetivo: as duas frases, os dois destinos, e a marcação acontecendo
  uma vez só.

# Fase 05: O Mural por mais recentes [x]
Branch: `feat/012-mural-recentes`

- [x] Task 01 (TDD + implementação): `ordem` no `MuralService`. Arquivos:
  `src/app/services/mural.service.ts`, `.spec.ts`. Objetivo: `listQuestions(fase, ordem?)` repassando
  `ordem=recentes`. **Sem o parâmetro, a chamada de hoje não muda** — teste-trava.
- [x] Task 02 (TDD + implementação): O query param na página. Arquivos:
  `src/app/pages/mural/mural.page.{ts,html}`, `.spec.ts`. Objetivo: `?ordem=recentes` abre em **"Esta
  semana"** com as mais novas em cima. Sem o parâmetro, a aba inicial continua sendo "Em votação"
  (decisão 1 da spec 010) — teste-trava, porque trocar a aba padrão silenciosamente quebraria o Mural
  para quem chega pelo menu.

# Fase 06: Mobile e movimento [ ]
Branch: `feat/012-mobile`

- [x] Task 01: O painel como folha. Objetivo: abaixo de 48rem, largura cheia com margem pequena, ancorado
  no topo, altura máxima **70svh** (decisão 13). `svh` e não `vh` — a barra do navegador do celular come
  a diferença.
- [x] Task 02: Alvos de toque. Objetivo: **44px de verdade** no sino, em cada linha e **no check**, com
  área maior que o desenho. O sino fica na barra do topo, que é a pior região para o polegar; o alvo
  compensa o que a posição não pode. **Linha e check são dois alvos vizinhos** (decisão 13): conferir no
  aparelho que tocar o check não abre o modal, porque é aqui que 44px deixa de ser régua e vira função.
- [x] Task 03: Rolagem presa ao painel. Objetivo: rolar dentro da lista não rola a página atrás
  (`overscroll-behavior: contain`). Sem isso, chegar ao fim da lista arrasta o painel inteiro no celular.
- [ ] Task 04: Verificação em aparelho real. Objetivo: as regras de movimento existem por causa do
  celular fraco; conferir no desktop é não conferir. **Incluir Safari do iPhone**, pelo mesmo motivo da
  spec 011.

# Fase 07: Documentação e release [ ]
Branch: `feat/012-docs`

- [x] Task 01: `README.md`. Objetivo: o recurso em duas linhas — dois eventos, sem tempo real, sem
  histórico.
- [x] Task 02: Atualizar a linha da spec 010. Objetivo: onde estiver escrito que **não existe canal de
  notificação no produto**, corrigir apontando para esta spec. Enquanto a frase antiga estiver lá, ela
  contradiz o produto.
- [x] Task 03: `npm test` (Karma) verde e `ng build` limpo.
- [ ] Task 04: Verificação com duas contas em produção. Objetivo: publicar um vídeo com o admin e ver o
  sino tocar na conta do membro. **Conferir que o admin não recebe a própria notificação** (decisão 5 do
  backend) — é o detalhe que faz o recurso parecer quebrado no primeiro uso.
- [ ] Task 05: Verificação com leitor de tela. Objetivo: o `aria-label` do sino diz a contagem por
  extenso, o painel é alcançável por teclado, e o foco volta ao sino ao fechar. **Cada linha são duas
  paradas de `Tab`** — a linha e o check —, e o check se anuncia como "Marcar como lida", não como um
  botão sem nome.

---

## Resultado da execução (2026-08-25)

Cinco fases inteiras e a sexta em três de quatro tasks. **296 testes verdes** no Karma (eram 279) e
`ng build` limpo. No backend, **242 testes** e 31 suítes.

### O que ficou de fora, e por quê

- **Verificação em aparelho real** (Fase 06, Task 04). As regras de movimento existem por causa do
  celular fraco, e o Safari do iPhone é onde elas se provam. Conferir no desktop é não conferir.
- **Verificação com duas contas em produção** (Fase 07, Task 04). Precisa de uma conta de admin e uma de
  membro em ambiente real, com o backend implantado. É a única prova de que o admin **não** recebe a
  própria notificação — o detalhe que faria o recurso parecer quebrado no primeiro uso.
- **Verificação com leitor de tela** (Fase 07, Task 05). Os `aria-label` e a ordem de `Tab` estão
  cobertos por teste; ouvir o resultado é outra coisa.

### Duas coisas que a execução decidiu, e valem registrar

**O conjunto virou um componente só, o `NotificationCenter`.** A spec falava em pôr *o sino* em dois
lugares, mas sino, painel e modal são inseparáveis: o painel se ancora no sino, e o modal nasce da linha
do painel. Colocar as três peças à mão em cada host duplicaria o cabeamento e deixaria os dois lados
livres para divergir. O estado das não lidas mora no store, que é singleton, então as duas instâncias
mostram sempre a mesma contagem — e só uma delas está visível de cada vez.

**Fechar o painel devolve o foco ao sino, e navegar fecha o painel.** Nenhuma das duas estava escrita
como decisão; as duas apareceram montando. Sem devolver o foco, o `Esc` joga quem usa teclado para o
topo da página, porque o elemento focado deixou de existir. E um painel que sobrevive à navegação fica
pairando sobre a tela nova, ancorado a um sino que pode nem estar mais no mesmo lugar.
