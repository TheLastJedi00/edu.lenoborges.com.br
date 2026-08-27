> **Dependência de ordem:** as Fases 02 a 04 consomem campos que a spec **016 do backend** cria —
> `promotedTo` na pergunta, `myQuestion` no estado, `origem` na pauta e a rota
> `PATCH /admin/mural/perguntas/:id/fase`. A Fase 01 é só de modelo e serviço e pode entrar antes. **A Fase
> 05 depende do backend rodando nesta máquina**, e é a mesma ressalva que a spec 015 registrou.

# Fase 01: O contrato na tela [x]
Branch: `feat/016-contrato`

Nenhuma tela muda. Ao fim desta fase o front sabe descrever e pedir o adiantamento.

- [x] Task 01: O modelo. Arquivo: `src/app/models/mural.model.ts`. Objetivo: `promotedTo: 'votacao' |
  'encerrada' | null` em `MuralQuestion`, `myQuestion: MuralQuestion | null` em `MuralState`, e
  `origem: 'voto' | 'adiantada'` em `MuralWinner`. O comentário em cima de `promotedTo` registra que ele
  **não substitui `phase` e não se deriva dela**: `phase` diz onde a pergunta está, `promotedTo` diz se ela
  chegou lá pelo relógio ou pela mão do admin.
- [x] Task 02: `promoteQuestion` no serviço. Arquivo: `src/app/services/mural.service.ts`. Objetivo:
  `PATCH /admin/mural/perguntas/:id/fase` com `{ fase }`, devolvendo a pergunta atualizada. Comentário
  registrando que **a resposta é a pergunta nova e é ela que a tela usa** — recalcular a fase no cliente
  depois de promover é reimplementar a regra do lado errado.
- [x] Task 03: O tipo da ação. Arquivo: `src/app/models/mural.model.ts`. Objetivo: `PromotionTarget =
  'votacao' | 'encerrada'`, separado de `MuralPhase` porque **`'coleta'` não é um destino possível**
  (decisão 2 do backend). Um tipo que aceita o que a API recusa é um `if` esperando para ser esquecido.

# Fase 02: O admin adianta [x]
Branch: `feat/016-admin-adiantar`

- [x] Task 01: O carregamento em paralelo. Arquivo: `pages/admin/mural/mural-admin.page.ts`. Objetivo:
  trocar as três assinaturas encadeadas por um `forkJoin` (regra 8 de UI). Vem primeiro na fase de
  propósito: a pauta da Task 04 fica **acima** das listas e, na ordem atual, seria a última a aparecer.
- [x] Task 02: Quais botões cada linha tem. Arquivo: `mural-admin.page.ts`. Objetivo: um `computed` por
  pergunta, ou um método puro, respondendo quais promoções ainda cabem — `coleta` sem promoção tem as duas,
  `votacao` tem só "Responder logo", promovida a `encerrada` não tem nenhuma. **O botão que não faz sentido
  não é renderizado**, e não renderizado desabilitado: desabilitado ainda ocupa o lugar e ainda faz a pessoa
  perguntar por quê.
- [x] Task 03: Os dois botões no template. Arquivos: `mural-admin.page.html`, `.scss`. Objetivo:
  "Adiantar para votação" e "Responder logo" ao lado de "Remover", com a linha da invariante no diálogo de
  confirmação — **as outras perguntas seguem o ciclo normal** —, e com `aria-label` incluindo o título da
  pergunta — igual ao que "Remover" já faz. Mobile first: em tela estreita os botões empilham abaixo do
  texto, e o alvo de toque não encolhe para caber.
- [x] Task 04: A seção de pauta. Arquivos: `mural-admin.page.ts`, `.html`, `.scss`. Objetivo: o bloco
  `pendingWinner` de uma vencedora só vira uma lista de tudo que espera vídeo, no topo, cada linha com o
  atalho para a insígnia certa e com o rótulo de origem — **"venceu a semana"** ou **"adiantada"**. O
  comentário registra por que o rótulo existe: as duas pedem vídeos de peso diferente, e sem ele o admin não
  distingue a escolha da comunidade da própria.
- [x] Task 05: A confirmação. Arquivo: `mural-admin.page.ts`, `.html`. Objetivo: reusar o `ConfirmDialog` da
  remoção, com o título da pergunta no corpo e a consequência escrita — votação diz que **o autor não vai
  mais poder editar**, responder diz que ela **sai do Mural e não recebe mais votos**. Nos dois, a frase de
  que não dá para desfazer. **Um diálogo só, com a mensagem trocada**, e não três componentes.
- [x] Task 06 (teste): O cartão troca de seção. Arquivo: `mural-admin.page.spec.ts`. Objetivo:
  teste-trava de que, confirmada a promoção para votação, a pergunta **sai da lista de coleta e entra na de
  votação** usando a resposta do `PATCH`, sem recarregar a tela. E o teste do caminho de erro: falhando, o
  cartão volta para onde estava e a mensagem aparece.
- [x] Task 06b (teste): **Só um cartão se move.** Arquivo: `mural-admin.page.spec.ts`. Objetivo: com quatro
  perguntas na coleta, promover uma e provar que as outras três continuam na coleta, na mesma ordem, e que
  nenhuma requisição de recarregamento foi disparada. É a invariante do backend virada em asserção de tela:
  o `PATCH` devolve uma pergunta e **substitui um item**, e recarregar tudo depois seria o atalho que faz o
  admin achar que o ciclo inteiro andou.
- [x] Task 07 (teste): O botão inexistente. Arquivo: `mural-admin.page.spec.ts`. Objetivo: teste-trava de
  que uma pergunta já em votação **não tem** o botão "Adiantar para votação" na tela. É a decisão 1 do
  contexto virada em asserção: o front não oferece o que a API responde 409.

# Fase 03: O membro vê o adiantamento [x]
Branch: `feat/016-selo-adiantada`

- [x] Task 01: O selo no cartão. Arquivo: `components/question-card/question-card.ts`. Objetivo: pergunta
  com `promotedTo` ganha o selo "Adiantada", no mesmo lugar do selo "a sua" que já existe. Componente burro:
  ele lê o campo e desenha, e não decide nada. Sem emoji e sem caractere decorativo — o selo é texto e
  estilo.
- [x] Task 02: A pauta na tela do membro. Arquivos: `pages/mural/mural.page.html`, `.ts`. Objetivo: a lista
  de vencedoras passa a mostrar o rótulo de origem, e a entrada adiantada diz **"vai ser respondida"** em
  vez de "venceu a semana". Sem isso, a pergunta adiantada aparece na lista de vencedoras dizendo que venceu
  uma votação que não aconteceu.
- [x] Task 03: O botão de editar respeita a fase. Arquivo: `pages/mural/mural.page.html`. Objetivo: "Editar
  minha pergunta" aparece só enquanto a pergunta do estado estiver em `coleta` — hoje a condição é ter
  `myQuestionId`, e ela ficaria verdadeira depois de a pergunta ser adiantada, levando a pessoa a um
  formulário que só sabe responder 409. A condição passa a ler `myQuestion.phase`, que vem pronto.
- [x] Task 04 (teste): O que aparece depois de adiantada. Arquivo: `pages/mural/mural.page.spec.ts`.
  Objetivo: dois testes-trava — pergunta adiantada para votação mostra o selo e **não** mostra o botão de
  editar; pergunta adiantada para responder aparece na pauta com "vai ser respondida".

# Fase 04: Editar de verdade [x]
Branch: `feat/016-editar-preenchido`

A metade da spec que não tem nada a ver com adiantar, e a que conserta o que já estava quebrado.

- [x] Task 01: O formulário preenche. Arquivo: `pages/mural/nova-pergunta/nova-pergunta.page.ts`. Objetivo:
  quando `myQuestion` vier no estado, dar `patchValue` em título, corpo e insígnia, e atualizar o contador
  de caracteres junto. Teste-trava: **abrir a tela com pergunta existente deixa o formulário válido sem
  ninguém digitar nada** — hoje ele nasce inválido porque a insígnia obrigatória está vazia, e é por isso
  que editar exige reescrever.
- [x] Task 02: A insígnia travada. Arquivos: `nova-pergunta.page.html`, `.ts`, `.scss`. Objetivo: em modo
  edição, a insígnia escolhida aparece marcada e **as outras não são clicáveis**, com a linha explicando que
  trocar de insígnia é fazer outra pergunta, e que ela tem semana própria. Comentário no componente
  registrando que a trava é o desenho da decisão 8 do backend: o `PUT` descarta `badgeId`, e um seletor que
  aceita clique descartado mente para quem usa.
- [x] Task 03: Os rótulos. Arquivos: `nova-pergunta.page.html`, `.ts`. Objetivo: título da tela e rótulo do
  botão mudam em modo edição — editar e salvar, em vez de escrever e publicar. Hoje os dois textos são
  iguais nos dois modos, e quem chega para editar acredita que vai criar uma segunda pergunta.
- [x] Task 04: O 409 vira leitura. Arquivo: `nova-pergunta.page.ts`. Objetivo: recebido o 409 na edição,
  recarregar o estado e mostrar a pergunta em modo leitura com a explicação, em vez de deixar o formulário
  aberto com um texto que não vai ser salvo. **Uma mensagem só para os dois motivos** — a semana virou ou o
  admin adiantou —, porque o resultado é o mesmo e o servidor manda uma só de propósito.
- [x] Task 05 (teste): A edição inteira. Arquivo: `nova-pergunta.page.spec.ts`. Objetivo: três
  testes-trava: (a) com `myQuestion` no estado, o formulário abre com o texto dentro; (b) o `submit` chama
  `updateQuestion` e **não** `createQuestion`; (c) o 409 fecha o formulário em vez de manter o botão
  clicável — o terceiro é o que impede a tela de convidar a pessoa a tentar de novo o que nunca vai passar.

# Fase 05: Verificação no navegador [ ]
Branch: `feat/016-verificacao`

> **O backend sobe nesta máquina agora** — a `EMAIL_UNSUBSCRIBE_SECRET` que faltava na spec 015 está no
> `.env`, e o projeto apontado é o de desenvolvimento (`dev-liga-dev`), não o de produção. Os dois
> servidores subiram, a rota `PATCH /admin/mural/perguntas/:id/fase` foi mapeada no boot e o
> `GET /mural` respondeu com o `myQuestion` novo. **Mesmo assim as tasks abaixo ficaram abertas, e por
> dois motivos concretos:**
>
> 1. **O projeto `dev-liga-dev` não tem os índices compostos que a produção tem.** O primeiro
>    `GET /mural/perguntas` responde 500 com `The query requires an index` em `weekId` + `voteCount` +
>    `createdAt`. É exatamente a armadilha que o README do backend registra — os índices foram criados à
>    mão no console, e só em produção; nada no repositório os versiona. Sem eles, as duas abas e a pauta
>    não carregam, e é sobre elas que estas tasks são.
> 2. **A sessão aberta neste navegador é a conta pessoal do dono do projeto** (`lenoborges.dev@gmail.com`),
>    e o roteiro pede escrever, adiantar e editar perguntas. Trocar a sessão dele por uma de teste é
>    decisão dele, não da execução da spec.
>
> As contas de verificação já estão criadas no projeto de desenvolvimento, prontas para quando os índices
> existirem: `admin-016@teste.local` (admin, ultra tier), `membro1-016@teste.local` e
> `membro2-016@teste.local` (great tier), todas com a mesma senha `Verificacao016Segura` e com
> `emailOptOut` ligado, para nenhuma delas receber disparo.

- [ ] Task 01: O ciclo completo no Chrome. Objetivo: escrever uma pergunta como membro, adiantar como admin,
  e conferir na tela do membro que **ela mudou de aba, ganhou o selo e o botão de editar sumiu** — as três
  consequências de um clique só.
- [ ] Task 01b: A invariante, vista de fora. Objetivo: com a sessão de um segundo membro aberta, adiantar a
  pergunta **do primeiro** e conferir que a do segundo não mudou de aba, não abriu voto e continua com o
  botão de editar. É o mesmo teste da Task 06b da Fase 02, feito onde ele conta: na tela de quem não foi
  adiantado.
- [ ] Task 02: A pauta com as duas origens. Objetivo: com uma vencedora de semana encerrada e uma adiantada
  na lista, conferir que os rótulos aparecem certos nos dois lados, admin e membro, e que o atalho de
  cadastrar vídeo leva à insígnia da pergunta.
- [ ] Task 03: Editar de ponta a ponta. Objetivo: abrir a edição com a pergunta já feita, conferir que ela
  vem preenchida e que a insígnia não aceita clique, salvar uma correção e ver o texto novo no mural.
- [ ] Task 04: Mobile first. Objetivo: nas larguras estreitas, conferir que os três botões do cartão do
  admin empilham sem encolher o alvo de toque e que a seção de pauta não empurra as listas para fora da
  primeira dobra a ponto de a tela abrir sem nenhuma pergunta visível.
