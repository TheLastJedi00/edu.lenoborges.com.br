# Spec 022: Jogos, GYM Challenge e Ranking

> **Emendada pela spec 023 (Arena de Treinamento).** O card do GYM Challenge continua sendo o
> último item da aba Aulas, e agora ele vem **depois dos desafios da Arena**. A ordem é a da
> jornada: assistir, praticar, provar. O `emphasis` e o comportamento do card não mudaram.

## Objetivo
A tela de Jogos existe na promessa da spec 008 — "jogos e ranking" aparecem nos `perks` de todos os
tiers, no vocabulário de GYM Battle, e em nenhuma tela. O aside tem um item desabilitado com "Em breve",
e o resto é imaginação.

Esta spec põe três coisas na tela:

| Onde | O quê |
|---|---|
| `/dashboard/jogos` | Hub com três opções: GYM Challenge, Duels (em breve) e Ranking |
| `/dashboard/jogos/desafio/:badgeId` | O GYM Challenge: questionário de 10 perguntas por rodada, três rodadas |
| `/dashboard/jogos/ranking` | Ranking da Liga: lista ordenada por XP com pódio |
| `/dashboard/trilha/:badgeId` | O card do GYM Challenge ao final da lista de vídeos |

E dá ao admin uma seção nova:

| Onde | O quê |
|---|---|
| `/dashboard/admin/questoes` | Escolha da insígnia para gerenciar questões |
| `/dashboard/admin/questoes/:badgeId` | Banco de questões: CRUD manual + geração com IA |

O par desta spec no backend é a **022**, e as duas entram juntas.

---

## Numeração
Os números são iguais nos dois repositórios, com a exceção conhecida da 008 (Liga Dev, só no front). 021
é Respostas na Trilha, 022 é esta.

---

## Decisões

### 1. O hub de Jogos é uma página com três cards, não três rotas no aside
A tela de jogos é **uma rota** no aside (`/dashboard/jogos`) que abre um hub com três opções:

| Card | Estado | Destino |
|---|---|---|
| **GYM Challenge** | Ativo | `/dashboard/jogos/desafios` → lista de insígnias com estado |
| **Duels** | Desabilitado, "Em breve" | — |
| **Ranking da Liga** | Ativo | `/dashboard/jogos/ranking` |

**Duels é um card desabilitado de propósito.** A tela de Jogos é a casa de tudo o que é competição, e
mostrar a terceira porta fechada — como o aside fazia com a Trilha antes da spec 009 — diz que tem
mais coisa vindo sem prometer data. É um item do aside a menos e uma tela de contexto a mais: quem
entra em "Jogos" vê o mapa inteiro, e não um item solto.

### 2. A lista de GYM Challenges é a trilha, mas com olhar diferente
`/dashboard/jogos/desafios` mostra as **8 insígnias** (as mesmas da trilha, posições 1-8) com o
estado do desafio de cada uma para o membro logado. **Não é uma cópia da trilha**: a trilha mostra
vídeos e progresso de conteúdo; aqui mostra desafios e progresso de conquista.

Cada insígnia aparece como um card com:

- Ícone da insígnia (o mesmo componente da trilha).
- Nome da insígnia.
- O estado do desafio: **Em breve**, **XP insuficiente** ou **Disponível** / **Conquistada**.
- Indicador de rodadas: 3 bolinhas mostrando aprovado/pendente.

### 3. Os três estados do card do GYM Challenge, e o brilho do disponível
São os mesmos três estados da decisão 5 do backend, traduzidos em visual:

**Em breve:**
- Card cinza, opacidade reduzida.
- Texto "GYM Battle dessa Insígnia em breve".
- Sem ação — o card não é clicável.

**XP insuficiente:**
- Card ativo, com o ícone da insígnia.
- **Barra de progresso de XP**: fundo cinza representando o total necessário, preenchida em azul pela
  proporção do XP atual do membro. `width: (currentXp / requiredXp) * 100%`, com `max-width: 100%`.
- Texto: "Você precisa treinar mais para conquistar essa Insígnia! Faltam **{requiredXp - currentXp} XP**."
- O card é clicável e leva ao detalhe do desafio com a mesma mensagem expandida.

**Disponível:**
- Card com **borda brilhante** — uma animação CSS sutil de `box-shadow` pulsando em dourado, uma vez
  a cada 3 segundos, respeitando `prefers-reduced-motion`.
- Botão proeminente: **"Iniciar GYM Challenge"**.
- Se o membro já iniciou e está no meio de uma rodada, o botão diz **"Continuar GYM Challenge"**.

**Conquistada:**
- Card com borda dourada fixa (sem animação).
- Selo de ✓ com "Insígnia Conquistada".
- As três bolinhas de rodada todas verdes.

### 4. O GYM Challenge em si: uma tela de questionário
`/dashboard/jogos/desafio/:badgeId` é a tela onde o membro joga. Ela tem quatro fases visuais:

**Aviso obrigatório (aparece SEMPRE, antes de cada rodada):**

Uma tela intersticial com o título em destaque:

> **"Não se sabote, se permita errar primeiro."**

E um texto curto abaixo:

> Esse desafio é seu — é sobre o que **você** sabe, não sobre o que uma IA sabe. Conhecimento se
> constrói errando o suficiente para aprender, e não acertando tudo de primeira. Se permita errar,
> se permita duvidar, e resista à tentação de pedir a resposta para o ChatGPT. O XP que você ganha
> aqui só tem valor se for honesto — e o único a se enganar seria você mesmo.

Um checkbox **"Eu li e entendi"** desbloqueia o botão "Iniciar Rodada". **A tela aparece toda vez** —
não é um aceite que se marca uma vez e some. Cada rodada de cada insígnia passa por ela. A repetição
é deliberada: é um ritual, não burocracia. Ele coloca o membro no estado mental certo.

O checkbox não é gravado em lugar nenhum — nem no servidor, nem no `localStorage`. Fechar a página
e voltar mostra a tela de novo.

**Antes de começar (depois do aviso):**
- Nome da insígnia, ícone, e o número da rodada atual ("Rodada 1: Fácil").
- Indicador de 3 rodadas com o progresso.
- Botão "Iniciar Rodada" (ou "Iniciar Rodada 2: Média", etc.).

**Durante a rodada:**
- **Uma pergunta por vez**, centralizada na tela.
- Enunciado da pergunta em destaque.
- Quatro alternativas como botões, dispostas em coluna no mobile e 2x2 no desktop.
- **Timer visual regressivo** — não é o cálculo real (que é do servidor), é indicação de urgência:
  começa preenchido e vai esvaziando. Cor muda de azul (> 30s) para amarelo (10-30s) para vermelho
  (< 10s).
- Indicador de progresso: "Questão 4 de 10".
- **Ao responder:** a alternativa escolhida fica verde (certa) ou vermelha (errada), a resposta
  correta é destacada em verde, e o XP ganho aparece ao lado. Após 1.5s, passa para a próxima.

**Ao fim da rodada:**
- Resultado: "Você acertou 8 de 10!" com o XP total ganho nessa rodada.
- Se aprovado (≥ 7): mensagem de sucesso, a bolinha da rodada fica verde, e aparece o botão para a
  próxima rodada (ou "Insígnia Conquistada!" se for a 3ª).
- Se reprovado (< 7): mensagem de incentivo, botão "Tentar Novamente".
- **Nenhuma animação de confete** — a conquista da insígnia é a exceção, e ela ganha uma animação
  de brilho e pulso no ícone (a mesma regra 5 da spec 009 do front: movimento com causa).

### 5. O timer é visual E de medição — validação dupla com o servidor
O front mostra um timer visual para criar urgência **e mede o tempo real de resposta** do membro.
São dois papéis num mesmo relógio:

**O papel visual:** O timer começa em **50 segundos** (uma referência ao 50 XP máximo, não ao
cálculo) e decrementa. Cor muda de azul (> 30s) para amarelo (10-30s) para vermelho (< 10s). É
urgência, não cálculo.

**O papel de medição:** Quando a pergunta aparece na tela, o front inicia um cronômetro
(`performance.now()` ou `Date.now()`). Quando o membro clica na alternativa, o front para o
cronômetro e envia o **`clientElapsedMs`** junto da resposta no `POST .../answer`.

O servidor tem os seus próprios timestamps (`servedAt` e `submittedAt`), e faz um diff entre os
dois tempos. **Quando o `clientElapsedMs` é menor que o tempo do servidor, o tempo do cliente é
quem prevalece** — a diferença é latência de rede, e o membro não pode ser penalizado por ela.

O `clientElapsedMs` é medido com `Math.round()` (inteiro em milissegundos) e enviado como número.
**O front não calcula XP, não conhece a fórmula e não exibe o número 50.** Ele mede o tempo e o
servidor decide o que fazer com ele. É a mesma regra da spec 019: o servidor afirma, a tela obedece.

### 6. O Ranking é lista, não grid — e o pódio é destaque visual
`/dashboard/jogos/ranking` é uma página com duas seções, e **todos os nomes exibidos são o
`nickname` (gamertag)**, não o nome real.

**Pódio (top 3):**
- Três cards destacados, lado a lado no desktop e empilhados no mobile.
- **1º lugar**: borda e fundo dourado, texto maior.
- **2º lugar**: borda e fundo prateado.
- **3º lugar**: borda e fundo bronze.
- Cada card mostra: posição, nickname, XP e contagem de insígnias com ícone de medalha.
- **Indicador de evolução**: abaixo do nickname, um pequeno selo (bullet) verde ou vermelho
  mostrando a evolução diária (ex: "↑ 3 posições hoje" ou "↓ 1 posição"). Aparece apenas se houver
  variação. (Mobile-first: pequeno, discreto e autoexplicativo).

**Lista geral (do 4º em diante):**
- Tabela simples, linhas alternando fundo sutil.
- Colunas: posição (com o indicador de evolução embaixo ou ao lado no desktop), nickname, XP,
  insígnias (número + ícone).
- **O membro logado é destacado** — sua linha tem fundo azul sutil, esteja onde estiver na lista.
- Paginação com botão "Carregar mais" ao final — não paginação por número de página.

**A posição do membro logado aparece no topo**, mesmo que ele esteja na página 3. Uma linha fixa acima
da tabela: "Sua posição: **#47** (↑ 2 hoje) · **340 XP** · **3 insígnias**".

### 7. O GYM Challenge no final da trilha da insígnia
Na página `/dashboard/trilha/:badgeId`, o card do GYM Challenge aparece **depois do último vídeo**,
na aba Aulas. É o mesmo componente dos três estados da decisão 3, renderizado inline.

A diferença do contexto: na trilha, o card **disponível** brilha com mais destaque, porque o membro
acabou de consumir o conteúdo — é o momento certo de dizer "agora é hora de provar o que aprendeu".
O brilho é o mesmo da decisão 3, com `animation-iteration-count` maior (contínuo enquanto visível,
com `prefers-reduced-motion` respeitado).

### 8. O Jogos entra no aside, e substitui o "Em breve" que já estava lá
O item "Jogos" no aside do dashboard ganha ícone (o `icon-games` que já existe), perde o `disabled`
e o selo "Em breve", e leva a `/dashboard/jogos`.

A posição no aside: **depois de Trilha, antes de Mural**. Trilha é conteúdo, Jogos é prática, Mural
é discussão — a ordem conta a história do ciclo de aprendizado.

### 9. A tela do admin de questões segue o padrão da administração de vídeos
`/dashboard/admin/questoes` mostra as treze insígnias (todas, não só as 8) como cards selecionáveis,
exatamente como `/dashboard/admin/trilha`. Clicar abre `/dashboard/admin/questoes/:badgeId`.

A página de questões da insígnia tem:

**Contadores no topo:**
- "Fáceis: 30/30 ✓ · Médias: 28/30 ⚠ · Difíceis: 15/30 ⚠ · Total: 73/90"
- Barra de progresso geral mostrando 73/90.
- Quando todas as faixas atingem 30: mensagem verde "Desafio pronto para publicação!".

**Filtro por dificuldade:**
- Três abas: Fácil, Média, Difícil.

**Lista de questões:**
- Cada questão mostra: enunciado (truncado em 2 linhas), dificuldade, as 4 alternativas com a correta
  destacada em verde.
- Ações: Editar (abre formulário inline) e Excluir (com confirmação).

**Botão de ação duplo:**
- "Adicionar Questão" → formulário manual.
- "Gerar com IA" → modal de geração.

### 10. A geração com IA é um modal em dois passos: gerar e revisar
**Passo 1 — Gerar:**
- Campo de texto para o **prompt** do admin (ex: "Gere questões sobre herança e polimorfismo em Java,
  com foco em quando usar cada um e exemplos práticos").
- Select de **dificuldade**: Fácil, Média ou Difícil.
- Select de **quantidade**: 10, 20 ou 30.
- Botão "Gerar Questões".
- Estado de loading com esqueleto de questões enquanto a API responde.

**Passo 2 — Revisar:**
- Lista das questões geradas, cada uma com:
  - Enunciado editável (textarea).
  - Alternativas editáveis (4 inputs).
  - Resposta correta selecionável (radio buttons nos 4 índices).
  - Checkbox de seleção (para incluir ou excluir).
  - Botão de excluir individual.
- Barra de ação fixa no rodapé:
  - "Selecionadas: 28/30"
  - Botão "Salvar Selecionadas" → `POST /admin/badges/:badgeId/questions/bulk`.

O admin pode editar qualquer campo antes de salvar. **O rascunho não é salvo em lugar nenhum** — fechar
o modal perde o que não foi salvo, e o modal avisa disso com `canDeactivate` / confirmação.

### 11. A configuração do desafio é uma seção no topo da página de questões
Acima da lista de questões, um bloco com:

- **XP mínimo para participar**: input numérico, com o valor atual.
- **Status**: "Pronto" (≥ 90 questões) ou "Incompleto (faltam X questões)".
- Botão "Salvar Configuração".

Não é uma página separada — é uma seção da mesma página, porque a configuração sem o banco de questões
embaixo não tem contexto.

### 12. Zero `localStorage` para questões, respostas ou estado do desafio
O estado do GYM Challenge vem do servidor, em toda abertura, e vai para o servidor, em toda interação.
É a mesma decisão 11 da spec 019: **dado de jogo não mora no navegador do jogador.** O que mora
localmente pode ser alterado localmente, e questões de prova são o pior caso.

### 13. O front não conhece a fórmula de XP nem o `correctIndex`
Dois números que o front **não** sabe:

- **50** (XP por acerto). Ele recebe `xpAwarded` na resposta de cada questão.
- **`correctIndex`**. Ele recebe `correct: boolean` e, se a tela precisar destacar a alternativa certa,
  ela vem no corpo da resposta como `correctAlternativeIndex`.

É a mesma regra da spec 019 aplicada a um domínio mais sensível: num questionário, a resposta certa
no tráfego é cola.

### 14. Mobile é o desenho principal do GYM Challenge
O questionário é feito para ser jogado no celular:

- As 4 alternativas são botões em **coluna** (um por linha), com texto que quebra em linhas.
- Alvo de toque de **48px** mínimo por alternativa.
- O timer visual é discreto no topo, não um elemento que compete com a pergunta.
- O botão "Próxima" (quando a resposta já foi dada) fica **ancorado na parte inferior**, ao alcance
  do polegar.
- `env(safe-area-inset-bottom)` em todo botão grudado embaixo.

### 15. Animações com causa, e o pódio não pisca
Seguindo a regra da spec 009:

| Momento | Animação | Tipo |
|---|---|---|
| Resposta certa | Alternativa pulsa verde, +XP sobe em fade | feedback, 200ms |
| Resposta errada | Alternativa pulsa vermelho, correta pulsa verde | feedback, 200ms |
| Rodada aprovada | Bolinha da rodada preenche com brilho | estado, 320ms |
| Insígnia conquistada | Ícone pulsa com brilho dourado, uma vez | celebração, 500ms |
| Entrada no ranking | Linhas entram com `appReveal` em cascata | entrada, com teto de 6 |
| Pódio | Nada pisca. Cores sólidas, sem loop. | — |

`prefers-reduced-motion` desliga tudo, como em todas as specs.

### 16. O modal de Gamertag (Nickname) é obrigatório para jogar
Jogos e ranking não usam o `name` do perfil — usam um `nickname` único (gamertag). Se o membro não
tiver preenchido esse campo no seu perfil (na aba Meu Perfil), o front levanta um **modal bloqueante**
ao tentar acessar `/dashboard/jogos` ou qualquer sub-rota.

**O modal diz:**
- "Você precisa de um Gamertag para entrar na Liga."
- "Ele será seu nome público no Ranking e nos Jogos. Escolha bem: ele deve ser único e **não poderá
  ser alterado depois**."
- Input com validação (apenas letras, números, hífens e underscores).
- Estado de erro se o `PUT /me/nickname` voltar `409 Conflict` (nome já em uso).

Até salvar com sucesso, o membro não entra na rota de jogos. Uma vez salvo, o modal nunca mais
aparece, e o campo no Meu Perfil fica disabled.

### 17. Replay de rodada aprovada
O membro pode refazer uma rodada já aprovada para treinar, mas a decisão 21 do backend dita que isso
não rende XP. O front lida com isso de duas formas:
- Visualmente: ao iniciar uma rodada já aprovada, aparece um selo "Modo Treino: Sem XP" perto do timer.
- O endpoint `/start` e `/answer` respondem normalmente, mas `xpAwarded` será sempre `0`. A UI de acerto
  mostra "Correto!" sem a animação de subir o XP.

---

## Telas

| Rota | O que é |
|---|---|
| `/dashboard/jogos` | Hub: GYM Challenge, Duels (em breve), Ranking |
| `/dashboard/jogos/desafios` | Lista de insígnias com estado do desafio |
| `/dashboard/jogos/desafio/:badgeId` | O questionário em si |
| `/dashboard/jogos/ranking` | Ranking da Liga com pódio |
| `/dashboard/trilha/:badgeId` | Card do GYM Challenge ao final dos vídeos (emenda) |
| `/dashboard/admin/questoes` | Escolha de insígnia para gerenciar questões |
| `/dashboard/admin/questoes/:badgeId` | Banco de questões + geração IA + config |

---

## Rotas e guards

| Rota | Guard |
|---|---|
| `/dashboard/jogos` | auth + perfil completo |
| `/dashboard/jogos/desafios` | auth + perfil completo |
| `/dashboard/jogos/desafio/:badgeId` | auth + perfil completo |
| `/dashboard/jogos/ranking` | auth + perfil completo |
| `/dashboard/admin/questoes` | auth + perfil completo + **admin** |
| `/dashboard/admin/questoes/:badgeId` | auth + perfil completo + **admin** |

---

## Fora de escopo

- **Duels.** O card existe no hub, desabilitado. A mecânica é outra spec.
- **Ranking por insígnia (ranking filtrado por quem tem a insígnia X).** O ranking é global.
- **Chat ou comentários no ranking.** É uma lista, não uma rede social.
- **Compartilhar resultado nas redes.** Funcionalidade de engajamento, e ela depende de metadata OG
  que o SSR não tem.
- **Som.** Feedback sonoro no acerto/erro é uma boa ideia e é escopo de UX que esta spec não cobre.
- **Player na tela de desafio.** O GYM Challenge não tem vídeo. Quem quer rever o conteúdo volta
  para a trilha.
- **Drag and drop na reordenação de questões.** Questões não têm ordem — são sorteadas aleatoriamente.
- **Editar questão depois de alguém ter respondido.** A questão editada vale para as próximas rodadas;
  respostas passadas ficam como estão.

---

## Specs afetadas

### Spec 008 (Liga Dev) — vigente, com emenda
A tela de Jogos sai do "Em breve" e ganha rota, hub e duas funcionalidades. O aside muda de ícone
inativo para item ativo.

### Spec 009 (Financeiro, Administração e Trilha) — vigente, estendida
A trilha ganha o card do GYM Challenge ao fim dos vídeos. A administração ganha a seção de questões.

### Spec 019 (Vídeos Assistidos e XP) — vigente, com emenda
O selo de XP no painel agora reflete XP de duas fontes. O componente `XpCount` não muda — ele continua
recebendo `xp` pronto do `AuthStore`. O que muda é que o número sobe mais rápido.

### Spec 021 (Respostas na Trilha) — vigente
O card do GYM Challenge na trilha fica **depois das respostas posicionadas na trilha**. É o último
item da aba Aulas, sempre.

---

## Pontos em aberto — resolvidos

> Todos os pontos abaixo foram respondidos e as decisões correspondentes foram incorporadas ao corpo
> da spec. A seção permanece como registro.

1. ~~**O GYM Challenge deveria ter uma tela de "regras" antes de começar?**~~ **Fechado: sim.** Foi
   adicionada uma tela de aviso intersticial com mensagem sobre honestidade intelectual (Decisão 4).
2. ~~**O ranking deveria mostrar a evolução (subiu 3 posições)?**~~ **Fechado: sim.** Adicionado um selo
   (bullet component) indicando subida ou descida diária abaixo do gamertag (Decisão 6).
3. ~~**O card de "XP insuficiente" na trilha deveria ter link para a lista de vídeos?**~~ **Fechado: não.**
   Não precisa.
4. ~~**A geração por IA deveria ter "regenerar" por questão individual?**~~ **Fechado: não.** Apenas fluxo em lote.

---

## Adendo de levantamento (2026-08-30) — o que faltava para o `tasks.md` fechar

> Escrito ao levantar as tasks. As decisões acima permanecem vigentes; o que segue preenche o que a
> implementação teria que adivinhar.

### A.1 A tabela do Objetivo perdeu uma rota que a decisão 1 criou
O Objetivo lista três rotas de membro e a decisão 1 cria uma quarta: `/dashboard/jogos/desafios`, a
lista de insígnias com estado. A tabela **Telas** já a tem. A lista completa é a de lá.

### A.2 O contrato com a API, item a item
O front não inventa forma nenhuma. O que ele consome, com o nome que o backend dá:

| Onde | Chamada |
|---|---|
| Hub `/jogos` | nada — é estático |
| `/jogos/desafios` | `GET /games/challenges` |
| `/jogos/desafio/:badgeId` | `GET /games/challenges/:badgeId`, `POST .../start`, `POST .../answer` |
| `/jogos/ranking` | `GET /ranking?limit=&after=` |
| Trilha (emenda) | `GET /games/challenges/:badgeId`, junto do `GET /badges/:badgeId/videos` num `Promise.all` |
| Modal de gamertag | `PUT /me/nickname` |
| Admin de questões | as oito rotas de `/admin/badges/:badgeId/questions` e `/challenge-config` |

O `POST .../answer` manda `{ questionIndex, chosenIndex, clientElapsedMs }` e recebe
`{ correct, correctAlternativeIndex, xpAwarded, replay, roundComplete?, roundPassed?, badgeUnlocked?, totalXp? }`.
O `totalXp` é o que atualiza o `AuthStore` — **o front nunca soma XP localmente**, pela mesma razão da
spec 019: remarcar não paga, e a soma local acerta no primeiro e erra em todos os seguintes.

### A.3 Onde cada peça mora no repositório
A spec não nomeia arquivos, e o padrão do repositório já responde:

- `src/app/services/games.service.ts` e `ranking.service.ts` — as chamadas de membro.
- `src/app/services/admin.service.ts` — **estendido**, não duplicado: as rotas de questões são de
  admin e o serviço de admin já existe.
- `src/app/models/games.model.ts` — todos os tipos desta spec, incluindo os do ranking.
- `src/app/components/gym-challenge-card/` — o componente dos três estados, usado em dois lugares
  (decisão 3 e decisão 7). É burro: recebe o estado pronto e emite o clique.
- `src/app/pages/jogos/` com `jogos.page.ts` (hub), `desafios/`, `desafio/` e `ranking/`.
- `src/app/pages/admin/questoes/` com `questoes-admin.page.ts` e `insignia-questoes.page.ts`, no
  molde exato de `pages/admin/trilha/`.
- `src/app/components/nickname-dialog/` — no molde de `legal-block-dialog`, que é o outro modal
  bloqueante do produto.

### A.4 O guard do nickname é um guard, não um `if` em quatro páginas
`src/app/core/games/nickname.guard.ts`, aplicado no nó `jogos` das rotas. Ele lê o `AuthStore`; se
`nickname` é nulo, abre o `NicknameDialog` e só libera a navegação quando o `PUT /me/nickname` volta
`204`. Um `if` dentro de cada página seria quatro cópias da mesma regra, e a quinta página nasceria
sem ela.

O `nickname` precisa existir no `MemberProfile` do `auth.model.ts` — vem do `GET /me`, e é o
`AuthStore` que o carrega. É o mesmo caminho do `xp` da spec 019.

### A.5 O timer visual e o cronômetro de medição são dois relógios, e um deles não pode ser o `setInterval`
A decisão 5 dá dois papéis ao timer. Na implementação eles são **duas coisas separadas**:

- O **visual** é um `setInterval` de 100ms alimentando um `signal` — pode atrasar, pode ser
  estrangulado pelo navegador em aba de fundo, e nada disso importa porque ele só pinta uma barra.
- A **medição** é um único `performance.now()` no momento em que a questão é pintada e outro no
  clique. **Nunca derivada do contador visual**, que acumula erro de `setInterval` e seria roubado do
  membro justamente na aba que o navegador estrangulou.

O `clientElapsedMs` vai como `Math.round(fim - inicio)`, e o servidor o valida contra o próprio
relógio (decisão 3 do backend). Um valor absurdo não é um erro de tela: o servidor simplesmente usa o
tempo dele.

### A.6 O `desafio/:badgeId` é uma máquina de estados de tela, e ela mora num signal
Cinco fases: `aviso` → `pronto` → `jogando` → `feedback` → `resultado`. Um `signal<Fase>` na página,
e o template escolhe com `@switch`. A alternativa — cinco booleanos — produz o estado inválido em que
dois deles são `true`, e ele aparece como duas telas sobrepostas.

**Recarregar a página no meio de uma rodada volta para `aviso`.** A rodada continua viva no servidor,
o `GET /games/challenges/:badgeId` diz onde ela está, e o membro passa pelo aviso de novo — que é o
comportamento certo pela decisão 4, não um efeito colateral.

### A.7 O card na trilha entra depois de tudo, e a spec 021 diz o que é "tudo"
Na aba Aulas de `/dashboard/trilha/:badgeId`, o card do GYM Challenge é o último item **depois das
respostas posicionadas na trilha**. Ele não entra na aba Perguntas Frequentes. A página passa a fazer
duas requisições e elas vão num `Promise.all` — regra 8 do `clauderc`.

### A.8 O `XpCount` não muda, e é bom que não mude
A spec 019 deu ao componente um `xp` pronto vindo do `AuthStore`. O GYM Challenge é uma segunda fonte
do mesmo número, e o componente não precisa saber disso. O que a tela do desafio faz é chamar
`authStore.setXp(totalXp)` com o valor que o servidor devolveu — nunca `xp + xpAwarded`.

### A.9 O que o admin perde ao fechar o modal de IA
A decisão 10 diz que o rascunho não é salvo e que o modal avisa. O aviso é o `ConfirmDialog` que já
existe, disparado no fechamento quando há questões geradas e não salvas — não o `unsavedChangesGuard`,
que é de rota e aqui não há troca de rota.
