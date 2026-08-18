# Fase 01: Camada de dados [x]
Branch: `feat/010-camada-de-dados`

Nenhuma tela. Ao fim desta fase o Mural tem modelo, service e teste, e o `tier` chega na sessão.

- [x] Task 01: Modelar o Mural. Arquivo: `src/app/models/mural.model.ts`. Objetivo: `MuralQuestion` com
  `phase`, `voteCount`, `hasVoted`, `isMine`; `MuralState` com `currentWeekId`, `votingWeekId`, `canAsk`
  e `myQuestionId`. O comentário registra que **`canAsk` vem pronto da API** e que o front não
  recalcula a regra a partir do `tier` (decisão 3).
- [x] Task 02: `tier` no modelo de sessão e no store. Arquivos: `src/app/models/auth.model.ts`,
  `src/app/core/auth/auth.store.ts` + spec. Objetivo: `tier` entra achatado como `role` e `grade` já
  entraram. `isPaid` é `computed`. **Nada de derivar `tier` de `grade`, nem o contrário** — é a
  restrição que a spec 008 impõe e a que mais se viola por acidente.
- [x] Task 03 (TDD + implementação): `MuralService`. Arquivos: `src/app/services/mural.service.ts`,
  `.spec.ts`. Objetivo: `GET /mural`, `GET /mural/perguntas?fase=`, `POST`/`PUT` de pergunta,
  `POST`/`DELETE` de voto, `GET /mural/vencedoras`. Cobrir os três erros que a tela precisa distinguir:
  **403 de tier**, **409 de já perguntou** e **409 de semana virada** — três mensagens diferentes, e
  tratá-los como um só é o atalho que arruína a decisão 3.
- [x] Task 04 (TDD + implementação): O contador de virada. Arquivos: `src/app/core/mural/countdown.ts`,
  `.spec.ts`. Objetivo: dias (e horas no último dia) até a virada, a partir do `weekId` que a API
  mandou. **Nunca do relógio do navegador sozinho** (decisão 2). Sem cronômetro de segundos.
- [x] Task 05: Estender o `TrackService`. Arquivo: `src/app/services/track.service.ts` + spec. Objetivo:
  filtrar vídeos por `kind`, e os campos `devTierFree` e `questionId` no modelo. A aba de Perguntas
  Frequentes vazia resolve como conteúdo vazio, **não como erro** — mesmo teste-trava da spec 009.

# Fase 02: O Mural, leitura e voto [x]
Branch: `feat/010-mural`

- [x] Task 01: Ícone e item no aside. Arquivos: `src/app/components/icons/icon-mural.ts`,
  `src/app/components/dashboard-aside/dashboard-aside.ts`. Objetivo: "Mural" depois de Trilha. Ativo
  para todo mundo, inclusive Dev Tier — **quem não escreve ainda vota** (decisão 3).
- [x] Task 02: Rota e casca da página. Arquivos: `src/app/app.routes.ts`,
  `src/app/pages/mural/mural.page.{ts,html,scss}`. Objetivo: três abas — **"Em votação" é a inicial**
  (decisão 1) —, grudadas no topo ao rolar, com o contador de virada ao lado.
- [x] Task 03: Cartão de pergunta. Arquivo:
  `src/app/components/question-card/question-card.{ts,spec.ts}`. Objetivo: ícone da insígnia à
  esquerda, voto à direita no lado do polegar, uma coluna abaixo de 48rem. **Alvo de voto com 44px de
  verdade**, área maior que o desenho (decisão 11).
- [x] Task 04: Voto otimista. Objetivo: pinta e incrementa na hora, requisição atrás, rollback com aviso
  na falha. O comentário registra por que otimista: é a ação mais repetida da tela, e 300ms cinco vezes
  é o que faz um recurso parecer lento.
- [x] Task 05: Aba "Respondidas". Objetivo: vencedoras anteriores com o vídeo de cada uma. É o que faz a
  promessa parecer real — sem ela, "a mais votada ganha um vídeo" é só uma frase.
- [x] Task 06: Estados vazios. Objetivo: semana sem perguntas, e o caso da **primeira semana de vida do
  recurso**, em que "Em votação" fica vazia por sete dias (ponto em aberto 2). É o único lugar onde um
  texto explicando o ciclo se justifica, porque não há nada a aprender usando.
- [x] Task 07 (TDD): Spec da página. Objetivo: aba inicial correta, ordem preservada como veio, voto
  otimista revertendo na falha, e o contador sem depender do relógio local.

# Fase 03: Escrever e o bloqueio de tier [x]
Branch: `feat/010-perguntar`

- [x] Task 01: Formulário de pergunta. Arquivo:
  `src/app/pages/mural/nova-pergunta/nova-pergunta.page.{ts,html,scss}`. Objetivo: **chips de insígnia
  com ícone, não `<select>`** (decisão 6) — cabem no polegar e mostram o ícone que a pessoa já conhece
  da trilha. Reactive form, `title` de 10 a 140, `body` até 1000.
- [x] Task 02: Contador de caracteres tardio. Objetivo: aparece **depois** dos primeiros 100 caracteres.
  Contador desde o primeiro caractere transforma escrever numa prova.
- [x] Task 03: Folha deslizante no celular. Objetivo: o formulário sobe de baixo, com o botão ancorado e
  `env(safe-area-inset-bottom)`. **Não é modal centralizado** — com o teclado aberto sobram três linhas
  visíveis.
- [x] Task 04: O bloqueio do Dev Tier. Objetivo: no lugar do formulário, a frase literal *"O Dev Tier
  vota, mas não pergunta"* e o link para o Financeiro (decisão 3). **Nada de botão que abre um
  formulário e falha ao enviar.** O comentário registra que esconder não é a segurança — quem impede é
  o backend.
- [x] Task 05: A pergunta como rascunho. Objetivo: quem já perguntou vê **a própria pergunta no topo com
  editar**, nunca "limite atingido" (decisão 5). Enquadramento muda o comportamento: um faz perguntar
  rápido e mal, o outro faz voltar e refinar.
- [x] Task 06: A transição da virada. Objetivo: quando a semana vira, o editar some e a pergunta ganha o
  selo "em votação". **Precisa ser visível**, ou a pessoa acha que perdeu o texto.
- [x] Task 07 (TDD): Spec do formulário. Objetivo: chips selecionáveis, validação de tamanho, o bloqueio
  do Dev Tier renderizando no lugar do form, e os três erros da API virando três mensagens diferentes.

# Fase 04: Perguntas Frequentes na trilha [x]
Branch: `feat/010-faq-na-trilha`

- [x] Task 01: Abas na página da insígnia. Arquivo:
  `src/app/pages/trilha/insignia/insignia.page.{ts,html,scss}`. Objetivo: **Aulas** e **Perguntas
  Frequentes**. Duas naturezas — aula se assiste em ordem, resposta se consulta por assunto — e
  misturadas a sequência deixa de ser sequência (decisão 7).
- [x] Task 02: A pergunta acima do player. Objetivo: no vídeo de resposta, mostrar a pergunta original e
  quem perguntou, com link para a aba "Respondidas" do Mural. É metade do valor da aba.
- [x] Task 03: Selo "Livre para todos". Arquivo: `src/app/components/free-badge/free-badge.ts`.
  Objetivo: vídeo `devTierFree` ganha selo **visível, não discreto** (decisão 8) — é o contrapeso do
  único "não" que o produto dá ao Dev Tier, e um "não" sozinho é um paywall.
- [x] Task 04: Vazio que convida. Objetivo: aba sem respostas diz *"Nenhuma pergunta desta insígnia foi
  respondida ainda. Que tal fazer a primeira?"* com link para o Mural.
- [x] Task 05 (TDD): Spec das abas. Objetivo: cada aba lista só o seu `kind`, a ordem de uma não afeta a
  outra, e o vazio resolve como conteúdo e não como erro.

# Fase 05: Administração do Mural [x]
Branch: `feat/010-admin-mural`

- [x] Task 01: Rota e página. Arquivos: `src/app/app.routes.ts`,
  `src/app/pages/admin/mural/mural-admin.page.{ts,html,scss}`. Objetivo: perguntas das duas semanas
  vivas com contagem de votos, sob `adminGuard`.
- [x] Task 02: Moderação. Objetivo: remover pergunta pelo `confirm-dialog` existente, **com o texto da
  pergunta dentro do diálogo**. É irreversível e leva os votos junto — confirmar sem mostrar o que se
  apaga é confirmar no escuro.
- [x] Task 03: A vencedora e o atalho. Objetivo: mostrar a vencedora da semana encerrada com um caminho
  de um toque para cadastrar o vídeo, **já com insígnia e `questionId` preenchidos**. É o fluxo semanal
  do admin e o único que vale otimizar para atalho.
- [x] Task 04: `devTierFree` e `kind` no formulário de vídeo. Arquivo:
  `src/app/components/video-form/video-form.ts`. Objetivo: os dois campos, com `questionId` aceito só
  quando `kind` é `resposta`.
- [x] Task 05: `tier` na tela de usuários. Arquivo: `src/app/pages/admin/usuarios/usuarios.page.ts`.
  Objetivo: editar `tier` ao lado de `grade`, **visivelmente separados e com rótulos que dizem o que
  são** — `tier` é acesso, `grade` é conquista (decisão 9). Encostados sem explicação, viram a mesma
  coisa na cabeça de quem clica.
- [x] Task 06 (TDD): Specs de admin. Objetivo: o diálogo mostrando o texto, o atalho pré-preenchendo os
  dois campos, e a edição de `tier` não tocando `grade`.

# Fase 06: Animação e mobile [x] — as Tasks 02, 03 e 04 ficaram de fora; a 06 é sua
Branch: `feat/010-animacao-mobile`

- [x] Task 01: O voto. Objetivo: pulso único no ícone e o contador subindo com deslocamento curto. **Sem
  loop, sem confete** — animação exagerada em ação repetida cansa em três toques.
- [] Task 02: FLIP na reordenação por voto. Objetivo: quando uma pergunta passa outra, as duas trocam de
  lugar em vez de a lista redesenhar. **Só na recarga da lista, nunca a cada voto** — lista que se
  reordena embaixo do dedo faz votar na pergunta errada.
- [] Task 03: Troca de aba. Objetivo: deslize lateral curto na direção do gesto. As abas são vizinhas no
  tempo, e o movimento diz isso sem texto.
- [] Task 04: A pergunta enviada entra de onde o formulário estava, ligando o ato ao resultado.
- [x] Task 05: Passada de mobile. Objetivo: abas grudadas, alvo de voto de 44px, botão ancorado com
  safe-area, uma coluna até 48rem, esqueleto na forma dos cartões.
- [] Task 06: Verificar com throttling de 4x de CPU, ou em aparelho de verdade. As regras existem por
  causa do celular fraco, que é o aparelho do público.

# Fase 07: Documentação e release []
Branch: `release/010-mural-de-perguntas`

- [] Task 01: Marcar as extensões na spec 009 daqui. Objetivo: trilha com abas, `tier` na tela de
  usuários, Mural no aside.
- [] Task 02: Registrar o resultado da execução no `context.md` desta spec.
- [] Task 03: `npm run lint`, `npm test` e `npm run build` limpos.
- [] Task 04: Verificar no navegador com **duas contas** — uma Dev Tier e uma paga: a Dev Tier vota e vê
  o bloqueio com o link do Financeiro; a paga escreve uma e vê a segunda recusada; o selo "Livre para
  todos" aparece na insígnia adiantada para as duas. **No preview do PR, antes do merge.** É o único
  teste que pega o portão de tier ponta a ponta, e ele depende de duas contas reais.
- [] Task 05: Unir as `feat/010-*` na `release/010-mural-de-perguntas`, merge em `dev`, e abrir o PR
  contra a `main`. **O merge na `main` está liberado** (autorizado em 2026-08-18): abre e fecha o PR,
  sem parar para confirmar. Se algum check falhar, ou se a Task 04 apontar problema, o merge espera — a
  liberação é de aprovação, não de qualidade.
- [] Task 06: Conferir, depois do merge, que o backend da 010 já está em produção. **A ordem entre os
  repositórios importa aqui**: o front do Mural sem as rotas da API do lado de lá é uma tela que só sabe
  dar erro. Backend primeiro, sempre.
