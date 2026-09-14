# Spec 025 (front): Melhoria da Arena de Treinamento — Tasks

> Regras do repositório que valem em toda task: sem emojis (SVG componentizado), Mobile First,
> nada de travessão nos textos de tela, gradientes e animações em `.scss`, `animate-enter` /
> `animate-leave`, Dumb Components e Smart Pages, `Promise.all` quando a página faz mais de uma
> requisição, e **TDD nos services**.
> Uma branch `feat/` por fase, um commit por task, um push por fase. Testar no Chrome sempre.
> O par no backend é a spec 025 de lá, e as duas entram juntas — as fases do back precisam estar
> de pé antes da fase correspondente aqui virar tela funcionando.

---

# Fase 01: Modelos e serviços [x]

Ao fim desta fase a integração conhece os campos novos e a geração por IA. Nenhuma tela muda de aparência.

- [x] Task 01: `src/app/models/training.model.ts` — em `Training`, remover `steps` e adicionar `objective: string` e `hints: readonly string[]`, com o comentário dizendo o que mudou: não é mais o passo a passo da execução, é a dica de raciocínio que custa 1 XP para abrir. **Não adicionar `createdAt`/`updatedAt`** — a API não os expõe.
  `CreateTrainingRequest` e `UpdateTrainingRequest` trocam `steps` por `hints` e ganham `objective`.
  Adicionar `GenerateTrainingsRequest` (`prompt`, `difficulty: QuestionDifficulty`, `count`) e `GeneratedTrainings` (`trainings: readonly TrainingInput[]`, `discarded: number`), espelhando `GenerateQuestionsRequest`/`GeneratedQuestions` em `games.model.ts`. O rascunho **não tem `id`**, porque nada foi gravado.
- [x] Task 02: `src/app/services/training.service.spec.ts` e `.ts` — **teste antes**: `complete(id, hintsUsed)` bate em `POST /trainings/:id/complete` com `{ hintsUsed }` no corpo. Atualizar o comentário do método: o XP agora depende das dicas, e o `xp` pintado na tela continua vindo da resposta e nunca de uma soma local.
- [x] Task 03: `src/app/services/admin.service.spec.ts` e `.ts` — **teste antes**: `generateTrainings(badgeId, body)` disparando `POST /admin/badges/:badgeId/trainings/generate`, no molde do `generateQuestions` logo acima.

---

# Fase 02: Gestão pelo Admin e Geração por IA [x]

Ao fim desta fase o admin cria treinamentos no formato novo e tem o botão de gerar com IA.

- [x] Task 01: `components/training-form/` (`.ts`, `.html`, `.spec.ts`) — trocar o `FormArray` `steps` por `hints` e adicionar o input de texto `objective` (obrigatório, 3 a 300).
  **O `FormArray` continua sendo array e não textarea**, pelo mesmo motivo da spec 023: mover a dica três para cima é reordenar dois controles.
  **A trava do último item continua**: o backend mantém o `@ArrayMinSize(1)` (decisão 1 do back), e deixar o formulário chegar a zero dicas seria oferecer um botão de salvar que devolve 400. Com uma dica na tela, a saída é apagar o texto dela. Renomear os membros: `passos` vira `dicas`, `adicionarPasso`/`removerPasso` viram `adicionarDica`/`removerDica`.
  Os rótulos na tela viram "Dicas" e "Objetivo", com um texto curto explicando que cada dica revelada custa 1 XP ao membro — quem escreve o desafio precisa saber disso.
- [x] Task 02: `components/training-card/training-card.html` e `pages/admin/trilha/insignia-admin.page.html` — o contador "N passos" vira "N dicas" (com o singular certo). São as duas telas que leem `steps.length` fora do formulário, e sem esta task elas quebram em tempo de compilação do template.
- [x] Task 03: `components/ai-generate-trainings-dialog/` (`.ts`, `.html`, `.scss`, `.spec.ts`) — o modal de dois passos, decalcado do `AiGenerateDialog` da spec 022: passo 1 com prompt, dificuldade e contagem; passo 2 com os rascunhos marcados por padrão, editáveis e removíveis; `ConfirmDialog` ao fechar com rascunho na tela; `descartadas` visível; `503` com a mensagem que oferece a saída ("cadastre os treinamentos à mão").
  **É um componente novo e não o `AiGenerateDialog` parametrizado**: aquele importa o `QuestionEditor` e fala de alternativas e `correctIndex`; generalizá-lo para dois formatos de rascunho custaria mais do que a duplicação do casco. O `.spec.ts` do novo trava o fluxo dos dois passos.
  Emite `saved` com os rascunhos aprovados. **Ele não grava nada** — quem grava é a página.
- [x] Task 04: `pages/admin/trilha/insignia-admin.page.ts` + `.html` + `.spec.ts` — botão "Gerar com IA" na área de Arena de Treinamento, abrindo o modal dentro de um `@if`.
  No `saved`, salvar os aprovados com `Promise.all` de `POST /admin/badges/:badgeId/trainings` (não existe rota de `bulk`), recarregar a lista e mostrar o erro parcial se alguma falhar — salvar cinco e perder duas em silêncio é o pior desfecho possível aqui.

---

# Fase 03: Experiência do Membro (Modal de Treinamento) [x]

Ao fim desta fase o modal oculta as dicas, cobra 1 XP por dica e recalcula o prêmio.

- [x] Task 01: `components/training-dialog/training-dialog.ts` —
  - `dicasReveladas = signal(0)`. O componente é destruído junto com o `<dialog>` da página (spec 023), então reabrir já nasce zerado — **não inventar um `effect` de reset**, que seria uma segunda fonte de verdade para a mesma coisa.
  - `premioAtual = computed(() => Math.max(0, training().xpAmount - dicasReveladas()))`.
  - `podeRevelar = computed(() => !training().completed && dicasReveladas() < training().hints.length)`.
  - O cabeçalho passa a exibir o prêmio atual, e o botão de concluir também.
  - `concluir` passa a ser `output<number>()` e emite `dicasReveladas()`.
- [x] Task 02: `training-dialog.html` + `.scss` —
  - O `objective` em destaque, logo abaixo da descrição, com rótulo próprio.
  - A lista de dicas: **a dica fechada não renderiza o texto**, só o botão. `@if (i < dicasReveladas() || concluido())` em volta do conteúdo — **nunca `filter: blur()`**, que deixa o texto no DOM para o leitor de tela e para o inspecionar elemento, e transforma a cobrança de XP numa censura que qualquer um contorna.
  - O botão "Revelar próxima dica (-1 XP)" é um só e sequencial; some quando `podeRevelar()` é falso.
  - Desafio concluído mostra todas as dicas abertas e nenhum botão de revelar.
  - A revelação anima pelo `animate-enter` que já existe, e a animação respeita `prefers-reduced-motion`.
- [x] Task 03: `training-dialog.spec.ts` — revelar aumenta o contador e derruba o prêmio; o prêmio não passa de zero por baixo; o botão some na última dica; **o texto da dica fechada não está no DOM** (é o teste que protege a mecânica inteira); concluído mostra tudo aberto sem botão; concluir emite o número certo.
- [x] Task 04: `pages/trilha/insignia/insignia.page.ts` + `.spec.ts` — `concluirTreinamento(dicasUsadas: number)` repassa para `trainings.complete(id, dicasUsadas)`.
  **O `AuthStore` continua recebendo `resultado.xp`, o valor do servidor** — nunca uma soma local, nem do `xpAmount`, nem do prêmio calculado na tela. Concluir de novo paga zero, e a soma acertaria no primeiro clique de cada desafio e erraria em todos os seguintes (decisão da spec 023, e o comentário do método já diz isso).

---

# Fase 04: Acessibilidade e fechamento [x]

- [x] Task 01: Revisar o modal com leitor de tela. Com a dica fechada fora do DOM, não há `aria-hidden` a colocar; o que falta é o botão de revelar anunciar o que vai acontecer (`aria-label` com o custo) e a dica revelada entrar numa região com `aria-live="polite"`, senão quem não vê a tela não sabe que algo apareceu.
- [x] Task 02: Conferir o `prefers-reduced-motion` na animação de revelação e no modal de geração.
- [x] Task 03: `npm test` limpo e `ng build` passando.
  799 testes verdes (Karma em Chrome headless) e `ng build` sem erro. **A Arena não foi aberta no
  navegador contra a API de verdade**: ela exige sessão, e subir o backend local depende de
  credencial do Firebase (e o emulador, de Java, que não está instalado nesta máquina). O que foi
  verificado no Chrome de verdade é o bundle servindo e a suíte, que renderiza o modal inteiro.
