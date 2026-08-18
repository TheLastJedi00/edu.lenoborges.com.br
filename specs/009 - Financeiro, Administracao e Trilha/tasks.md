# Fase 01: Preço fora do público [x]
Branch: `feat/009-preco-fora-do-publico`

Ao fim desta fase nenhum preço existe no bundle, e a landing ainda não tem para onde mandar quem
perguntar quanto custa. É de propósito: a fase é curta e verificável sozinha.

- [x] Task 01: Tirar `price` do modelo de tier. Arquivo: `src/app/models/community.model.ts`. Objetivo:
  `CommunityTier.price` some e entra `priceHint: string`. **Não vira opcional** — campo opcional é
  convite para alguém repreenchê-lo (decisão 1). O mesmo vale para `GrindingArena.price`, pelo ponto em
  aberto 2.
- [x] Task 02: Reescrever o conteúdo dos tiers. Arquivo: `src/app/services/community.service.ts`.
  Objetivo: quatro tiers, com o **Master Dev Tier** novo, sem nenhum número de preço; `priceHint` é
  *"Preço na plataforma"* nos três pagos e *"Gratuito"* no Dev Tier — grátis é ausência de preço, e é o
  CTA (decisão 2). Os `perks` do Master abrem com "Tudo do Ultra Dev Tier" e descrevem as duas aulas
  como treino de **entrevista técnica em inglês**, nunca como curso de inglês.
- [x] Task 03: Atualizar o `badge-ladder`. Arquivo: `src/app/components/badge-ladder/badge-ladder.ts`.
  Objetivo: exibir `priceHint` no lugar de `price`, e trocar o `tier--paid` — que hoje testa
  `price !== 'Gratuito'` — por um campo explícito, já que a string do preço deixou de existir. Com
  quatro cartões, o grid vira carrossel com `scroll-snap` abaixo de 48rem (decisão 9).
- [x] Task 04: Limpar a `/comunidade`. Arquivos: `src/app/pages/comunidade/comunidade.page.html`,
  `.scss`. Objetivo: a linha 122 mostra `grindingArena().price`; sai. A seção da Grinding Arena passa a
  descrever as quatro cadeiras e a cadência sem o valor.
- [x] Task 05 (TDD): Provar que o preço não está no bundle. Arquivos:
  `src/app/pages/landing/landing.page.spec.ts`, `src/app/services/community.service.spec.ts`. Objetivo:
  um teste que varre o conteúdo servido pelo `CommunityService` procurando `/R\$\s*\d/` e falha se
  achar. **Este é o teste que impede a regressão inteira** — sem ele, o primeiro `price: 'R$ 19,99'`
  reintroduzido volta despercebido.
- [x] Task 06: Rodar `npm run build` e conferir no `dist/` que nenhum arquivo contém os valores antigos.
  Objetivo: o teste da Task 05 olha o modelo; este olha o artefato, que é onde a promessa da decisão 1
  vale ou não vale.

# Fase 02: CTA único e público [x]
Branch: `feat/009-cta-gratuito`

- [x] Task 01: Reordenar as chamadas da landing e **tirar a lista de espera**. Arquivos:
  `src/app/pages/landing/landing.page.html`, `.ts`. Objetivo: **Começar gratuitamente** vira o primário
  do hero e abre o diálogo de autenticação na aba de cadastro (`authStore.openAuthDialog('signup')`). O
  WhatsApp vira ghost; o botão "Quero acesso antecipado" e o `app-waitlist-dialog` **saem** (alteração
  de escopo no topo do `context.md`). A frase do CTA é literal e igual em todas as posições (decisão 10).
- [x] Task 02: Reordenar as chamadas da `/comunidade` e tirar a lista de espera. Arquivo:
  `src/app/pages/comunidade/comunidade.page.html`. Objetivo: o hero tem cinco botões; fica um primário
  ("Começar gratuitamente", ou "Ir para o painel" para quem já está logado) e o resto como ghost. **A
  seção final "A Liga ainda está sendo construída" sai inteira**, com o diálogo de lista de espera.
- [x] Task 03: Fechar cada seção de tier com o CTA. Objetivo: quem rola a tabela de tiers termina de ler
  e encontra a ação. Hoje ele termina e encontra a próxima seção.
- [x] Task 04: Atualizar as specs de página. Arquivos: `landing.page.spec.ts`, e a de comunidade se
  houver. Objetivo: cobrir que o primário abre o diálogo na aba de cadastro — e não na de login, que é
  o default do store e o erro fácil.
# Fase 03: Camada de dados [x]
# Fase 03: Camada de dados []
Branch: `feat/009-camada-de-dados`

Nenhuma tela. Ao fim desta fase os três recursos novos do backend têm modelo, service e teste.

- [x] Task 01: Modelar o financeiro. Arquivo: `src/app/models/billing.model.ts`. Objetivo: `BillingTier`
  com `price` em **centavos** (`number`) e `TierCatalog` com `currentTierId`. O comentário registra por
  que centavos: valor monetário em decimal é a armadilha clássica, e a formatação é responsabilidade da
  tela.
- [x] Task 02 (TDD + implementação): O formatador de moeda. Arquivos: `src/app/core/money.ts`,
  `money.spec.ts`. Objetivo: `formatBRL(26000)` → `R$ 260,00`, via `Intl.NumberFormat`. Um lugar só
  (decisão 4) — o `priceLabel` que a API manda é fallback, nunca fonte.
- [x] Task 03 (TDD + implementação): `BillingService`. Arquivos: `src/app/services/billing.service.ts`,
  `.spec.ts`. Objetivo: `GET /billing/tiers`, com o catálogo em cache de sessão (`shareReplay`) — a
  tabela não muda dentro de uma sessão, e refazer a chamada a cada visita à aba é gasto sem retorno.
- [x] Task 04: Modelar a trilha. Arquivo: `src/app/models/track.model.ts`. Objetivo: `BadgeVideo` com
  `title` (o título da plataforma, nunca o do YouTube), `youtubeId`, `order`, e o embed derivado por
  função, não guardado.
- [x] Task 05 (TDD + implementação): `TrackService`. Arquivos: `src/app/services/track.service.ts`,
  `.spec.ts`. Objetivo: `GET /badges/:badgeId/videos`. **O teste central é o do 200 com lista vazia**:
  ele resolve para conteúdo vazio, não para erro (decisão 6). Confundir os dois é o bug mais provável
  desta spec, e o teste é a trava.
- [x] Task 06 (TDD + implementação): `AdminService`. Arquivos: `src/app/services/admin.service.ts`,
  `.spec.ts`. Objetivo: listar usuários com `pageToken`, alterar `grade`, e o CRUD de vídeos mais o
  `PATCH .../order`. Cobrir o 403 com mensagem própria — a claim demora até uma hora para valer, e a
  mensagem tem que dizer isso (decisão 5).
- [x] Task 07: `role` e `isAdmin` no store. Arquivos: `src/app/models/auth.model.ts`,
  `src/app/core/auth/auth.store.ts`, `auth.store.spec.ts`. Objetivo: `role` chega achatado em `Session`
  e em `MemberProfile`; `isAdmin` é `computed`, com a mesma precedência que `grade` já usa (perfil manda
  quando existe). **Nada de decodificar o ID token** (decisão 5).
- [x] Task 08 (TDD + implementação): `adminGuard`. Arquivos: `src/app/core/auth/admin.guard.ts`,
  `.spec.ts`. Objetivo: roda depois do `authGuard` e do `profileCompleteGuard`, e redireciona para
  `/dashboard` quem não é admin. O comentário registra que isto é conveniência: quem protege é o
  backend.
# Fase 04: Financeiro [x]
# Fase 04: Financeiro []
Branch: `feat/009-financeiro`

- [x] Task 01: Ícone do Financeiro. Arquivo: `src/app/components/icons/icon-billing.ts`. Objetivo:
  seguir o traço dos ícones existentes — mesmo `viewBox`, mesmo peso, `currentColor`.
- [x] Task 02: Item no aside. Arquivo: `src/app/components/dashboard-aside/dashboard-aside.ts`.
  Objetivo: "Financeiro" entre Home e Trilha, ativo (sem `disabled`, sem selo "Em breve").
- [x] Task 03: Rota e página. Arquivos: `src/app/app.routes.ts`,
  `src/app/pages/financeiro/financeiro.page.{ts,html,scss}`. Objetivo: filha de `/dashboard`, título
  `Financeiro · Liga Dev`. Três blocos na ordem da decisão 4: plano atual, os quatro tiers, o que o
  próximo degrau abre.
- [x] Task 04: Componente de cartão de tier. Arquivo:
  `src/app/components/tier-card/tier-card.{ts,spec.ts}`. Objetivo: preço formatado, `perks`
  cumulativos com os herdados apagados em vez de repetidos por extenso, e destaque do plano atual.
  Quatro listas idênticas lado a lado no celular viram um muro (decisão 4).
- [x] Task 05: Comparação de upgrade. Objetivo: com `currentTierId`, dizer "o que você ganharia" em vez
  de "o que existe". Transição lateral ao trocar o tier em foco (decisão 8).
- [x] Task 06: Ação de upgrade. Objetivo: abre o WhatsApp com *"Quero o <Tier>"*, reaproveitando o link
  de contato que a landing já monta. **Não existe botão "Assinar"** — botão que promete um fluxo
  inexistente é pior que a ausência dele.
- [x] Task 07: Esqueleto e erro. Objetivo: esqueleto na forma dos cartões enquanto carrega (decisão 9), e
  um estado de erro com repetir. O celular é a tela principal e o salto de layout aparece nela primeiro.
- [x] Task 08 (TDD): Spec da página. Arquivo: `financeiro.page.spec.ts`. Objetivo: quatro tiers
  renderizados, o preço formatado em pt-BR, o plano atual destacado, e o link de upgrade com o nome do
  tier certo.

# Fase 05: Trilha do aluno []
# Fase 05: Trilha do aluno [x]

- [] Task 01: Destravar o item do aside. Arquivo: `dashboard-aside.ts`. Objetivo: "Trilha" perde
  `disabled` e o selo "Em breve" e vira `routerLink`. **O fallback saiu do menu e foi para dentro da
  tela** (decisão 6) — é a mudança central desta fase, e o comentário do componente registra por quê.
- [x] Task 02: Página de seleção. Arquivos: `src/app/app.routes.ts`,
  `src/app/pages/trilha/trilha.page.{ts,html,scss}`. Objetivo: as oito insígnias como cartões
  selecionáveis, com a Elite Four e a Battle Frontier abaixo, separadas pelo mesmo vão do
  `badge-ladder`. **Nenhum cartão é desabilitado**: o aluno pode pular.
- [x] Task 03: Componente de cartão de insígnia. Arquivo:
  `src/app/components/badge-card/badge-card.{ts,spec.ts}`. Objetivo: ícone, título, área, estado
  (conquistada / disponível / sem conteúdo) e contagem de vídeos. Estado informa, nunca impede.
- [x] Task 04: Página da insígnia. Arquivo:
  `src/app/pages/trilha/insignia/insignia.page.{ts,html,scss}`. Objetivo: `/dashboard/trilha/:badgeId`,
  vídeos na ordem que a API mandou — **o front não reordena** (decisão 7). Cada item mostra o título da
  plataforma; o do YouTube não aparece em lugar nenhum.
- [x] Task 05: Estado vazio. Objetivo: a frase literal *"Ainda estamos preparando esse material."*, com
  ilustração e um caminho de volta para escolher outra insígnia. **Não é tela de erro**, e o teste da
  Fase 03 Task 05 é o que garante que não vira uma.
- [x] Task 06: Player. Objetivo: `<iframe>` do YouTube em wrapper 16:9 responsivo, `loading="lazy"`, sem
  autoplay. Título da plataforma acima, sempre.
- [x] Task 07 (TDD): Spec das duas páginas. Objetivo: cobrir o pulo de insígnia (entrar direto na 5 com
  `grade: 0` funciona), a lista vazia virando o aviso, e a ordem preservada exatamente como veio.

# Fase 06: Administração []
Branch: `feat/009-administracao`

- [] Task 01: Ícone e item condicional. Arquivos: `src/app/components/icons/icon-shield.ts`,
  `dashboard-aside.ts`. Objetivo: "Administração" aparece só com `isAdmin()`, no rodapé do menu, acima
  do Sair — é ferramenta, não navegação de aluno.
- [] Task 02: Rotas de admin. Arquivo: `src/app/app.routes.ts`. Objetivo: as quatro rotas de
  `/dashboard/admin`, todas com `adminGuard`.
- [] Task 03: Lista de usuários. Arquivo:
  `src/app/pages/admin/usuarios/usuarios.page.{ts,html,scss}`. Objetivo: paginação por `pageToken`
  (carregar mais, não numerada — o Auth não sabe quantos existem). **Usuário sem perfil aparece com os
  campos nulos e um selo "onboarding pendente"**: é a pessoa que o admin mais precisa ver, e a linha
  não pode sumir nem quebrar.
- [] Task 04: Edição de `grade`. Objetivo: diálogo com o `confirm-dialog` existente, faixa 0 a 13 com o
  rótulo vindo de `core/progress` — nunca reescrever a tabela de números à mão, que é como as duas
  divergem. Só `grade` é editável (decisão 10 do backend).
- [] Task 05: Escolha da insígnia a administrar. Arquivo:
  `src/app/pages/admin/trilha/trilha-admin.page.{ts,html,scss}`. Objetivo: as treze etapas com a
  contagem de vídeos de cada uma.
- [] Task 06: Formulário de vídeo. Arquivo:
  `src/app/components/video-form/video-form.{ts,spec.ts}`. Objetivo: **título obrigatório**, URL do
  YouTube com `inputmode="url"` e `enterkeyhint="done"`, descrição opcional. O formulário **não**
  preenche o título a partir do YouTube — o título é nosso de propósito (decisão 6 do backend), e um
  preenchimento automático faria todo mundo aceitar o do algoritmo.
- [] Task 07: Lista administrável. Arquivo:
  `src/app/pages/admin/trilha/insignia-admin.page.{ts,html,scss}`. Objetivo: criar, editar, remover, e
  os **botões subir/descer sempre visíveis**, com 44px de alvo (decisões 7 e 9). Ações da linha nunca
  atrás de `:hover`.
- [] Task 08: Reordenação otimista. Objetivo: a lista se move na hora, o `PATCH .../order` sai com os
  ids na ordem nova, e a falha reverte com aviso. Uma requisição por gesto, sem debounce — o backend
  escreve em lote atômico, então o rollback é sempre para um estado íntegro.
- [] Task 09: Arrastar como melhoria. Objetivo: só sob `@media (pointer: fine)`, e **nada depende
  dele**. No toque, arrastar disputa com o scroll e essa disputa não tem empate (decisão 7).
- [] Task 10 (TDD): Specs das telas de admin. Objetivo: cobrir o rollback da reordenação, a linha do
  usuário sem perfil, o título obrigatório, e o 403 com a mensagem da claim de até uma hora.

# Fase 07: Animação e mobile []
Branch: `feat/009-animacao-mobile`

Uma fase própria porque, espalhado pelas outras, isto é a primeira coisa que fica pela metade.

- [] Task 01: Tokens de movimento. Arquivo: `src/styles.scss`. Objetivo: durações (120 / 200 / 320ms) e
  easings como variáveis. Sem token, cada componente inventa a sua e a interface fica com cinco
  velocidades.
- [] Task 02: `prefers-reduced-motion` global. Arquivo: `src/styles.scss`. Objetivo: um bloco que zera
  duração e transição em tudo. **Global, não componente a componente** — um componente esquecido anula a
  intenção inteira (decisão 8).
- [] Task 03: Cascata com teto. Arquivo: `src/app/directives/reveal.ts`. Objetivo: `delay` por índice,
  com máximo de 6 passos. A sétima insígnia não pode esperar 700ms para existir.
- [] Task 04: Animações com causa. Objetivo: seleção de insígnia (cresce e o conteúdo entra por baixo),
  conquista (pulso único, **nunca em loop**), reordenação com FLIP, comparação de tier deslizando. Só
  `transform` e `opacity`.
- [] Task 05: Passada de mobile. Objetivo: alvos de 44px, ação primária ancorada embaixo com
  `env(safe-area-inset-bottom)`, uma coluna até 48rem, carrossel com `scroll-snap` nos tiers, nada
  dependente de `:hover`.
- [] Task 06: Esqueletos. Objetivo: substituir todo spinner centralizado por esqueleto na forma do
  conteúdo — tiers, lista de vídeos, lista de usuários.
- [] Task 07: Verificar em aparelho de verdade, ou no throttling do DevTools em 4x de CPU. Objetivo: as
  regras da decisão 8 existem por causa do celular fraco, que é o aparelho do público. Verificar no
  desktop é não verificar.

# Fase 08: Documentação e release []
Branch: `release/009-financeiro-administracao-trilha`

- [] Task 01: Marcar as emendas na spec 008 daqui. Arquivo: `specs/008 - Liga Dev/context.md`.
  Objetivo: a tabela de tiers virou quatro linhas e `price` saiu do modelo. As decisões 5c e 5d
  continuam vigentes e a nota diz isso, para ninguém ler "emendada" como "revogada".
- [] Task 02: Registrar o resultado da execução no `context.md` desta spec, no formato que a 008 usou.
- [] Task 03: `npm run lint`, `npm test` e `npm run build` limpos.
- [] Task 04: Unir as `feat/009-*` na `release/009-financeiro-administracao-trilha`, merge em `dev`, e
  abrir o PR contra a `main`. **O merge na `main` está liberado** (autorizado em 2026-08-18): abre e
  fecha o PR, sem parar para confirmar. Se algum check falhar, o merge espera o conserto — a liberação é
  de aprovação, não de qualidade.
- [] Task 05: Verificar no navegador, logado e deslogado: nenhum preço fora do painel, o CTA único, a
  trilha aberta com o aviso de material em preparo, e o botão Administração invisível para conta comum.
  **Roda no preview do PR, antes do merge da Task 04**, e repete em produção depois. A liberação de
  merge não dispensa a verificação — ela só dispensa a espera por aprovação.
