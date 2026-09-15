# Spec 025: Melhoria da Arena de Treinamento

## Objetivo
A Arena de Treinamento agora apresenta os desafios focados no raciocínio, separando a execução em **Desafio** (contexto) e **Objetivo** (resultado esperado). 
Em vez de visualizar todos os passos abertos de uma vez, os membros verão os passos como **Dicas** ("Hints") ocultas. Revelar uma dica é uma ação voluntária que custa **1 XP** descontado da recompensa final do desafio. O administrador terá uma opção de gerar os treinamentos utilizando a IA (Gemini), cujos prompts são ajustados para focar no pensamento lógico e não no código em si (ex: "Precisamos criar uma variável do tipo int para receber a idade do usuário").

O par desta spec no back é a **025**, e as duas entram juntas. *(Nota: A numeração pulou a 024 no backend porque a 024 de frontend era local, assim mantemos sincronia).*

---

## Emendas posteriores

**A spec 027 adicionou o envio de resultado na Arena.** O modal de Treinamento agora exibe uma área para submissão da resposta, seja em código para Dev Tier, ou com foto para Great Dev Tier e superiores. O payload de `complete` incorpora `mainCode` e `resultImageUrl`.

---

## Decisões

### 1. Novo Formulário e Geração de IA no Painel de Admin
No painel do administrador (`/dashboard/admin/trilha/:badgeId`):
- O formulário de Treinamento troca a lista `Passos` por `Dicas` e introduz um campo novo de texto `Objetivo` (Objective). 
- Um novo botão **"Gerar com IA"** é incluído na área de Arena de Treinamento. O botão abre um modal que pede o prompt (tema), a dificuldade e a quantidade — **3, 5 ou 10**, num `select` como o da spec 022, e o teto de 10 é do backend porque um treinamento é bem maior que uma questão.
- **O modal é o mesmo desenho de dois passos do `AiGenerateDialog` da spec 022**, mas é um componente novo (`ai-generate-trainings-dialog`) e não aquele parametrizado: o da 022 importa o `QuestionEditor` e fala de alternativas e `correctIndex`, e generalizá-lo para dois formatos de rascunho custaria mais do que a duplicação do casco. Passo 1 gera, passo 2 revisa, e só o passo 2 grava. Os rascunhos nascem marcados, o admin **desmarca** o que não presta, edita o que quer e só então salva — e fechar com rascunho na tela pergunta antes, pelo `ConfirmDialog` que já existe, porque o rascunho não mora em lugar nenhum.
- **Nada é gravado pela geração.** O que salva é a página, disparando um `POST /admin/badges/:badgeId/trainings` por rascunho aprovado em `Promise.all` — não existe rota de `bulk` para treinamentos e esta spec não cria uma. A `position` é calculada no servidor, então a ordem final é a de chegada; reordenar é a rota de reorder, que já existe.
- O `discarded` que a API devolve **aparece na tela**: um rascunho de 3 quando se pediu 5 parece limite do produto em vez de um modelo que errou o formato.

### 2. Dicas Ocultas e Custo de XP no Frontend (Modal do Membro)
No modal do Treinamento visualizado pelo membro:
- A seção "Passos" muda para uma aba ou lista de **Dicas**.
- O **Objetivo** é destacado perto da descrição do Desafio.
- **Dicas ocultas: o texto não vai para o DOM.** O que a dica fechada mostra é um botão, e nada mais. **`filter: blur()` não serve aqui**, e essa é a decisão que mais importa desta spec: o texto continua no HTML, o leitor de tela lê, o "inspecionar elemento" mostra, e a mecânica inteira de 1 XP vira uma censura que qualquer um contorna — sem erro, sem log, e sem ninguém perceber. O `@if (i < dicasReveladas())` resolve a acessibilidade e a mecânica no mesmo `if`, e nenhum `aria-hidden` é necessário.
- **Ação de revelar:** um botão sequencial, "Revelar próxima dica (-1 XP)", e não um botão por dica. Sequencial porque a ordem das dicas é a ordem do raciocínio, e abrir a quinta antes da primeira entrega o final da história por 1 XP. O botão some quando todas estão abertas.
- **Estado local, e ele reseta.** As dicas reveladas vivem num `signal` do `training-dialog`, que é destruído quando o modal fecha — a página o instancia dentro de um `@if`, pela decisão da spec 023. Fechar e reabrir zera o contador, e **isso é aceito de propósito**: persistir exigiria uma escrita por dica revelada, três vezes mais cara para cobrar 1 XP, e o servidor já não tem como conferir esse número de qualquer forma (decisão 2 do back). Quem fecha o modal e volta ganha as dicas de graça; é um vazamento conhecido e barato, e fechá-lo custaria mais do que ele vale.
- **Desafio já concluído não mostra preço nenhum.** Sem XP a perder, as dicas aparecem todas abertas e o botão de revelar não existe — cobrar por uma dica de um desafio que já pagou seria cobrar por nada.
- Ao clicar em "Concluir Desafio", o corpo do `POST /trainings/:trainingId/complete` leva `{ hintsUsed }` e o back-end calcula o XP real. O `xp` que a tela pinta continua vindo **da resposta**, nunca de uma soma local (spec 023).

### 3. Feedback Visual de XP Dinâmico
- O cabeçalho do Modal, que antes mostrava `30 XP` fixo, deve ser dinâmico. 
- Exemplo visual: "Prêmio Máximo: 30 XP" -> "Prêmio Atual: 28 XP" (se 2 dicas foram reveladas).
- O botão "Concluir Desafio" também deve refletir o valor atualizado.

---

## Modificações em Interfaces

### O modelo `Training`
O modelo do front se chama `Training` (`src/app/models/training.model.ts`), é `readonly` campo a campo e **espelha o que a API devolve**, sem inventar campo nenhum. O que muda:

```typescript
export interface Training {
  readonly id: string;
  readonly badgeId: string;
  readonly title: string;
  readonly description: string;
  readonly objective: string;          // novo
  readonly hints: readonly string[];   // no lugar de `steps`
  readonly videoUrl: string | null;
  readonly xpAmount: number;
  readonly position: number;
  readonly completed: boolean;
}
```

**Não entram `createdAt` nem `updatedAt`**: o `TrainingDto` do backend não os expõe, e um campo que o servidor não manda é `undefined` na primeira vez que alguém tentar formatá-lo. `videoUrl` é `string | null`, e não opcional — a API manda `null` explícito quando não há anexo, e `completed` é o campo que muda de membro para membro.

`CreateTrainingRequest` e `UpdateTrainingRequest` trocam `steps` por `hints` e ganham `objective`. Nasce `GenerateTrainingsRequest` (`prompt`, `difficulty`, `count`) e `GeneratedTrainings` (`trainings`, `discarded`), no molde de `GenerateQuestionsRequest`/`GeneratedQuestions` em `games.model.ts`.

A assinatura de `TrainingService.complete` passa a ser `complete(trainingId, hintsUsed)`, mandando `{ hintsUsed }` no corpo. A resposta (`TrainingCompletionResult`) não muda.

---

## Specs afetadas

Pela regra do `clauderc.md`, cada decisão superada recebeu o bloco de `Deprecated` **no próprio
arquivo da spec antiga**, apontando para esta. Nenhuma spec inteira cai.

### Spec 023 (Arena de Treinamento) — decisões 2 e 4 **parcialmente Deprecated**
Cai o que era `steps`: o item "Passos" do modal (decisão 2) e o campo "Passos" do formulário do admin
(decisão 4). No lugar entram as **Dicas** fechadas a 1 XP cada e o campo **Objetivo**. Continua
vigente tudo o mais daquela spec, e é bastante: a posição na trilha entre os vídeos e o GYM
Challenge, o modal que **não fecha** ao concluir, a trava de tier nos comentários, as setas de
reordenação, a cascata da exclusão e o painel centralizado de comentários do admin. O bloco de
`Deprecated` está no topo do `context.md` dela.

### Spec 022 (Jogos, GYM Challenge e Ranking) — vigente
O `AiGenerateDialog` dela **não muda**: esta spec escreve um componente novo ao lado, pelo motivo da
decisão 1. O card do GYM Challenge segue como último item da aba Aulas.

### Spec 019 (Vídeos Assistidos e XP) — vigente, com uma ressalva registrada
O XP continua vindo **da resposta do servidor** e nunca de soma local. O que muda é que o valor pago
por um treinamento deixou de ser o `xpAmount` do card: ele é o `xpAmount` menos as dicas reveladas, e
quem auditar o total precisa saber disso antes de acusar divergência.
