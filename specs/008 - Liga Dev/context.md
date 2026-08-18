# Spec 008: Liga Dev

## Objetivo
Trocar a metáfora central do produto. A comunidade deixa de ser a **Seita Dev** e passa a ser a
**Liga Dev**; os **33 Graus** dão lugar a **8 Insígnias**; e quem conquista as oito entra no
**Elite Four**, uma sequência de quatro Elite Battles que termina no título.

A trilha de conteúdo não é reinventada — ela é remontada. Os assuntos que já estavam lá continuam lá,
redistribuídos em oito GYM Battles, quatro Elite Battles e uma Battle Frontier.

**Esta spec é quase inteiramente de front.** O backend muda uma constante e um valor padrão.

---

## Numeração

Esta spec existe no repositório do **front** e leva o número **008** para casar com a numeração do
backend, do mesmo jeito que a 005 existe nos dois lados com o mesmo número. O front pula da 005 para a
008 porque a 006 e a 007 foram inteiramente de backend.

---

## A metáfora, e o que ela empresta

O paralelo é Pokémon, e ele é explícito: conquistar oito insígnias para então disputar a Liga. O que
vem junto de graça é a legibilidade — quase todo mundo entende "faltam três insígnias" sem precisar
de explicação, e "Grau 17 de 33" nunca disse nada sozinho.

O que vem junto de risco é a comparação inevitável. Isso decide, mais para baixo, por que o endgame
**não** se chama Liga.

---

## Decisões

### 1. Cada etapa tem um tipo, e o tipo tem nome
Não existem só "etapas" com pesos diferentes: existem **três naturezas**, e cada uma se chama alguma
coisa.

| Natureza | Nome do tipo | Quantas |
|---|---|---|
| Conquistar insígnia | **GYM Battle** | 8 |
| Disputar o endgame | **Elite Battle** | 4 |
| Depois do título | **Battle Frontier** | 1 |

O conjunto das quatro Elite Battles é a **Elite Four**.

Isso resolve, de lado, o problema que abriu esta decisão. "Liga Dev" é a marca — todo mundo que entra.
Se o endgame também se chamasse Liga, a mesma palavra significaria duas coisas em telas vizinhas:
"você é da Liga Dev" (todos) e "você entrou na Liga" (poucos). Com **Elite Four** o endgame ganha nome
próprio, e ganha o nome canônico: em Pokémon a Elite Four é exatamente isto — as quatro batalhas
depois das oito insígnias, antes do título.

E são quatro de verdade. O nome não é empréstimo temático: é contagem.

> **Nota de leitura.** As quatro fases se chamam Oitavas, Quartas, Semifinais e Final, que é
> vocabulário de chave de mata-mata — "oitavas" pressupõe dezesseis competidores. Numa jornada
> individual isso é metáfora, não aritmética. Funciona porque a escada é reconhecível, mas quem
> escrever a cópia deve tratar as fases como degraus nomeados, e não insistir na chave literal.

### 2. As oito Insígnias
Ordem é dado, não enfeite: ela é a promessa da trilha, e continua sendo.

| # | Insígnia | Cobre |
|---|---|---|
| 1 | **Insígnia da Lógica** | Lógica de programação com Java |
| 2 | **Insígnia da POO** | Orientação a objetos com Java |
| 3 | **Insígnia do Git e GitHub** | Versionamento e colaboração |
| 4 | **Insígnia do Spring Boot** | API REST **e banco de dados: SQL puro e JPA** |
| 5 | **Insígnia do HTML e CSS** | Marcação e estilo |
| 6 | **Insígnia do JavaScript e TypeScript** | Linguagem do front |
| 7 | **Insígnia do Angular** | Aplicação de front |
| 8 | **Insígnia do NestJS** | Back-end em Node |

Duas notas sobre a tabela:

- **Banco de dados entra na Insígnia do Spring Boot**, e cobre **SQL puro e JPA**. Hoje é a etapa 4 da
  trilha, com identidade própria. Ensinar persistência junto com a API é mais honesto do que ensinar
  SQL no vazio, e evita uma nona insígnia que quebraria o "conquiste as oito". Os dois níveis
  precisam aparecer nos tópicos: uma insígnia que promete banco e entrega só `@Entity` esconde o que
  está acontecendo embaixo, e uma que entrega só SQL não prepara para o Spring.
- **O artigo foi corrigido** onde a lista original trazia "Insígnia do Lógica" e "Insígnia do POO".
  Vira "da Lógica" e "da POO". Detalhe pequeno que aparece em toda tela.

### 3. A Elite Four, quatro Elite Battles
```
Oitavas     -> Vercel
Quartas     -> Firebase e Supabase
Semifinais  -> Docker
Final       -> Google Cloud Platform
```

A progressão tem uma leitura própria, e vale escrevê-la: sai do deploy mais simples que existe
(Vercel), passa por backend gerenciado, chega em containers e termina em nuvem de verdade. É a mesma
escada que a trilha antiga tinha em "Cloud Computing" e "DevOps", agora com nome e uma ordem que
justifica cada degrau.

**Battle Frontier: IA Aplicada ao Desenvolvimento.** Fora da chave de propósito — não é degrau para o
título, é o que se faz depois dele. O nome carrega isso sozinho para quem reconhece a referência: a
Battle Frontier é conteúdo de pós-game, opcional e sem fim definido.

### 4. `grade` vira 0 a 13, e continua sendo um número
`profiles.grade` é hoje `1..33`. Passa a ser:

| `grade` | Significa |
|---|---|
| `0` | Entrou, nenhuma insígnia ainda |
| `1`–`8` | Insígnias conquistadas |
| `9` | Venceu as Oitavas |
| `10` | Venceu as Quartas |
| `11` | Venceu as Semifinais |
| `12` | **Campeão** — venceu a Final |
| `13` | Pós-game |

`grade` é **contagem de etapas concluídas**, não a etapa em curso. `grade: 12` é campeão, não
"chegou na final".

O campo continua sendo um número, e é isso que faz esta spec caber no backend em uma constante. A
alternativa considerada — `badges: string[]` mais `ligaPhase` — permitiria ordem livre e "quais
faltam", ao custo de mudar o documento, o `ProfileDto` e o `SessionResponseDto`. **A ordem aqui não é
livre**, então a estrutura mais rica pagaria por uma liberdade que o produto não oferece.

O **default muda de `1` para `0`**. Hoje quem se cadastra nasce no Grau 1, o que fazia sentido quando
o primeiro grau era "estar aqui". Com insígnias, nascer com uma seria dar uma conquista de graça.

### 5. Três tiers, com nome de Poké Ball
As faixas deixam de ser duas e passam a ser três, nomeadas na progressão que qualquer jogador
reconhece sem legenda — Poké Ball, Great Ball, Ultra Ball:

| Tier | Preço | Entrega |
|---|---|---|
| **Dev Tier** | Gratuito | Insígnias 1 e 2 (Lógica e POO) na plataforma, com jogos e ranking daquele trecho; comunidade no WhatsApp; conteúdo público do YouTube |
| **Great Dev Tier** | **R$ 19,99** | Tudo acima **+ a plataforma da Insígnia 3 em diante**: trilha até a 8, a Elite Four, os jogos, os vídeos e o ranking completo |
| **Ultra Dev Tier** | **R$ 199,99** | Tudo acima **+ a Grinding Arena** |

**"Materiais intermediários" não é um produto à parte.** É o próprio acesso à plataforma depois da
segunda insígnia — os mesmos jogos, vídeos e ranking que o Dev Tier já conhece, agora sem o teto da
segunda insígnia. Isso importa para a cópia: o Great não vende um material novo, **vende a
continuação**. Quem escrever a página não deve inventar uma categoria de conteúdo que não existe.

**O corte é duplo, e de propósito.** O Dev Tier corta por profundidade — Lógica e POO livres, o resto
da trilha atrás da assinatura. O Great e o Ultra se separam por recurso, não por conteúdo: quem paga o
Great tem a trilha inteira; o Ultra acrescenta a única coisa que não escala, que é a hora do Leno na
Grinding Arena.

A linha do gratuito cai num ponto defensável: quem passa por Lógica e POO já sabe programar, e já sabe
se quer continuar. Cobrar antes disso é cobrar de quem ainda não consegue avaliar o que está
comprando. A proporção também é generosa perto do que existia — 5 de 33 era 15%, 2 de 8 é 25%.

Os tiers são **cumulativos**, e a tabela precisa deixar isso explícito na tela: cada linha diz "tudo
acima, mais". Faixa que parece alternativa em vez de degrau faz o leitor comparar o que não é
comparável.

### 5b. O salto de preço é 10x, e a página precisa explicá-lo
R$ 19,99 para R$ 199,99 é uma razão de dez. Isso **não é um problema de precificação, é um problema de
apresentação** — e vale escrever por que.

O Great é software: escala sem custo marginal, e por isso pode custar quase nada. O Ultra contém duas
horas semanais de uma pessoa, para no máximo quatro alunos. Não é uma versão melhor do Great; é outra
categoria de coisa, com um teto físico de vagas. Uma tabela que só mostra três preços em sequência faz
o terceiro parecer arbitrário; uma que deixa a escassez visível — quatro cadeiras, quatro Grindings
por mês — faz o número se explicar sozinho.

Duas consequências registradas por serem escolhas, e não acidentes:

- **A mentoria subiu de R$ 150,00 para R$ 199,99.** Ela deixou de ser comprável isolada: quem quiser
  os Grindings agora leva a plataforma junto. É aumento de 33% para quem só queria a mentoria.
- **O Great precisa de valor próprio, não de ser degrau.** A R$ 19,99 contra R$ 199,99, quase ninguém
  vai ler o Great como "caminho até o Ultra" — vai ler como o plano, e o Ultra como exceção. Isso é
  saudável, desde que a página não posicione o Great como consolação.

### 5c. Assinatura mensal. Cancelar tira o acesso, nunca o progresso
Os dois preços são **mensais**. E quem cancela **não perde dado**: perde acesso até voltar a pagar.

Isso não é um detalhe de cobrança, é uma regra sobre o que `grade` significa. **Insígnia é conquista,
não aluguel.** Quem chegou à Insígnia do Angular e cancelou continua com `grade: 7` no perfil, e volta
exatamente de onde parou quando reassinar. O que a assinatura aluga é a plataforma — vídeos, jogos,
ranking, Grindings —, não o histórico.

A consequência para o desenho é que **progresso e acesso são dois estados independentes**, e a tela
precisa saber exibir a combinação estranha: alguém com sete insígnias e sem acesso. Hoje ela não
saberia, porque o dashboard trata `grade` como se implicasse tudo.

**Isto restringe o futuro, e é de propósito:** nenhuma implementação de assinatura pode derivar
`grade` do estado de pagamento, nem zerá-lo no cancelamento. O caminho contrário — derivar acesso a
partir de `grade` — também está errado, e é o mais tentador de programar.

> **Fora de escopo, e explicitamente:** não existe estado de assinatura no modelo hoje. Esta spec não
> o cria. O que ela faz é fixar a regra antes de alguém precisar dela, para a decisão não ser tomada
> por acidente dentro de um `if`.

### 5d. A assinatura compra avanço, não retenção
Existe **uma regra só**, e ela vale para todo mundo:

> **Você sempre acessa o conteúdo das insígnias que já conquistou. A assinatura compra o direito de
> avançar além delas.**

Não há dois casos, há um com números diferentes:

| Situação | Acessa | Pode avançar até |
|---|---|---|
| Dev Tier, gratuito | Insígnias 1 e 2 | a Insígnia 2 |
| Great ou Ultra ativo | tudo que conquistou | sem teto |
| Cancelou com 6 insígnias | Insígnias 1 a 6 | congelado na 6 |
| Cancelou com 0 insígnias | nada além da comunidade | nada |

Quem cancelou com seis insígnias **não volta para duas**: ele fica com seis, vê que tem seis, e acessa
os vídeos, jogos e ranking daquele trecho. O que ele perde é a sétima — o avanço, não o passado. É a
mesma lógica de quem nunca pagou, com outro número.

**Isto é melhor do que a versão anterior desta decisão, e vale dizer por quê.** A primeira redação
dizia que o membro sem acesso ficava só com o WhatsApp, e daí saía uma assimetria esquisita: o
ex-assinante receberia menos que o novato. A regra acima não tem esse buraco porque não trata
"cancelado" como uma categoria — trata como um número congelado. **Não existe estado de punição, só um
teto que parou de subir.**

Duas consequências de desenho:

- **O dashboard abre sempre**, sem tela de bloqueio nem redirecionamento para pagamento. O membro vê o
  próprio selo, os cartões do que conquistou habilitados, e o resto apagado.
- **O grupo do WhatsApp nunca é gateado.** É a única porta que leva a pessoas em vez de a conteúdo, e
  quem parou de pagar volta pela comunidade, não por e-mail de retenção. Para um membro com `grade: 0`
  — que é o estado de todo perfil hoje — ele é, na prática, a única coisa habilitada no painel.

O contraste é o argumento: seis insígnias acesas ao lado da sétima apagada diz o que uma tela de
paywall não diz. **O progresso está guardado; o que parou foi o avanço.**

**O mecanismo é um guard, e não um campo novo.** São dois portões com chaves diferentes, e essa é a
parte que se erra ao implementar:

| Portão | Chave |
|---|---|
| Rever conteúdo de insígnia já conquistada | `grade` — não passa por assinatura |
| Entrar na trilha ou nos jogos da **próxima** insígnia | assinatura ativa, ou o teto gratuito |

Um guard nas rotas de trilha e jogos — quando elas existirem — **já congela o progresso sozinho**.
Insígnia se conquista fazendo trilha e jogo; sem entrar neles, `grade` não sobe. Ninguém precisa
zerar, travar ou marcar nada no cancelamento: o número para de subir porque a porta que o faz subir
fechou.

Daí sai o teto, derivado e não armazenado:

```
tetoDeAvanco = assinaturaAtiva ? 13 : max(2, grade)
```

O `max(2, grade)` é o que faz os dois casos serem o mesmo caso. Quem nunca pagou tem `grade: 0` e
alcança 2, que é a franquia do Dev Tier. Quem cancelou com 6 já passou dela e fica em 6. E quem
cancelou com 1 ainda pode conquistar a 2, porque a franquia gratuita não é consumida por ter assinado
um dia.

### 6. O que a troca de vocabulário atinge, por inteiro
O rebranding não é achar e trocar. Estes são os termos com dono:

| Antes | Depois | Onde dói |
|---|---|---|
| Seita Dev | Liga Dev | 40+ ocorrências, incluindo `<title>` de rota e `aria-label` |
| Grau / Graus | Insígnia / Insígnias | `grade-badge`, `grade-ladder`, `community.model.ts` |
| Grau N de 33 | Insígnia N de 8 | selo do dashboard |
| Conclave | **Grinding Arena** | a mentoria em grupo pequeno |
| Iniciado (faixa gratuita) | **Dev Tier** | `tiers[].id` |
| (faixa paga, sem nome) | **Great Dev Tier** e **Ultra Dev Tier** | `tiers[].id` |
| (não existia) | GYM Battle, Elite Battle, Battle Frontier | tipo de cada etapa |

**Sobre a Grinding Arena.** "Conclave" é vocabulário de seita e não sobrevive à troca. O nome novo
junta o lugar e a atividade num termo só, e as duas metades trabalham:

- **Arena** fica dentro do universo de batalha que o resto do vocabulário construiu, e é a palavra que
  o público brasileiro de Pokémon usa para o campo onde se enfrenta o líder.
- **Grinding**, em jogo, é repetição deliberada para subir de nível — não é o momento épico, é o que
  se faz antes dele. Descreve com precisão o que a mentoria vende: duas horas por semana corrigindo
  exercício com quatro pessoas na sala. É um nome que promete esforço em vez de atalho, o que combina
  com o resto da cópia do produto.

Cada encontro semanal é **um Grinding**. "Quatro Grindings por mês" lê melhor que "quatro aulas" e não
deixa ninguém esperando palestra.

> **Guardrail para a cópia, e ele é específico.** A Grinding Arena é o único termo do vocabulário que
> nomeia um lugar de batalha sem ser uma etapa da trilha. O risco é o texto sugerir que **é ali que a
> insígnia é conquistada** — não é: insígnia se conquista numa GYM Battle, e a Grinding Arena é
> benefício do Ultra Dev Tier, paralelo e opcional. Frases como "venha para a Arena conquistar sua
> insígnia" precisam ser evitadas deliberadamente, porque são as que soam mais naturais e são
> justamente as erradas.

### 7. Ícones: quatro faltam, um é reaproveitável
Existem hoje em `components/icons/`: `java`, `git-github`, `spring`, `html-css`, `ts-js`, `angular`,
`nestjs`, `vercel`, `gcp`, `devops`, `sql`, `stacks`.

- **As oito insígnias estão cobertas** (Lógica e POO usam `java`; JS/TS usa `ts-js`, que já existe e
  nunca tinha sido usado na trilha).
- **Faltam quatro:** `firebase`, `supabase`, `docker` e um de IA para o pós-game.
- `icon-devops` pode virar a base do `docker`, ou ser aposentado — a regra 1 do `clauderc.md` do front
  proíbe emoji e exige SVG componentizado, então cada um é um componente novo.
- `icon-sql` e `icon-stacks` perdem o uso na trilha. Não precisam ser apagados, mas ficam órfãos e é
  bom saber disso antes de alguém procurar por que existem.

---

## Fora de escopo
- **Conquistar insígnia de verdade.** Não existe mecânica de avaliação, jogo ou progressão automática
  nesta spec: `grade` continua sendo um número que alguém escreve. O que muda é o que ele significa e
  como é exibido.
- Trocar o domínio, o logotipo ou a paleta. A identidade visual continua; só o vocabulário muda.
- Página própria por insígnia, ou por Elite Battle.
- Ranking, pontuação e jogos. Continuam prometidos no texto, como já eram.
- Migrar conteúdo de vídeo ou material didático.
- Qualquer mudança no fluxo de autenticação, que a spec 007 acabou de reescrever.

---

## Specs afetadas

### Spec 003 (Comunidade) — Deprecated
Ela definiu a Seita Dev, os 33 Graus, as faixas de preço e o Conclave. Praticamente todo o vocabulário
que ela estabeleceu é substituído aqui. A estrutura de dados do front (`community.model.ts`) muda de
forma junto: `GradeProgress` vira contagem de insígnias e `TrackStage` ganha o conceito de fase.

### Spec 007 (Firestore e Firebase Auth) — vigente, com uma correção pontual
`profiles.grade` muda de faixa, não de forma: continua `number`. A decisão 7 da 007 documenta a faixa
`1..33` como invariante que passou do banco para a aplicação, e é essa linha que precisa ser
atualizada — não a spec inteira. **Não é caso de Deprecated pela regra 6 do `clauderc.md`:** nenhuma
coleção muda de estrutura, nenhum campo é criado, removido ou trocado de tipo.

### Spec 002 (Foco Educacional) — vigente
A landing do professor não é a comunidade. Ela menciona a Seita Dev e recebe a troca de nome, mas o
currículo do Leno não muda.

---

## Pontos em aberto

1. **O estado de assinatura, e só ele.** A decisão 5d fecha o resto: o teto de avanço é derivado de
   `grade` mais "assina ou não", e o congelamento acontece por guard, sem campo de teto e sem rotina
   de cancelamento. O que falta no modelo é apenas o booleano da assinatura — que esta spec não cria,
   porque não há cobrança para alimentá-lo.

   > **Correção.** A primeira redação deste ponto afirmava que o teto **não** podia ser derivado de
   > `grade`, e por isso pedia um segundo campo persistido. Estava errado: com `max(2, grade)` os dois
   > casos viram um só. O erro foi tratar "cancelado" como estado a registrar, quando ele é só a
   > ausência de um booleano.
2. **Os perfis que já existem.** Os dois perfis de teste no Firestore nasceram com `grade: 1`, que sob
   o modelo novo significa "conquistou a Insígnia da Lógica" — uma conquista que ninguém teve. Como o
   projeto é de teste, a Fase 05 zera esses valores. Se algum deles precisar sobreviver, é o momento
   de dizer.

---

## Vocabulário final (2026-08-17)

Fechado ao fim da execução. Um lugar só para descobrir como cada coisa se chama.

| Termo | O que é | Onde vive no código |
|---|---|---|
| **Liga Dev** | A comunidade. Todo mundo que entra. | `community.service.ts`, `identity.name` |
| **Insígnia** | Uma das oito conquistas da trilha. | `trackStages` com `phase: 'gym'` |
| **GYM Battle** | O tipo de etapa em que se conquista insígnia. | `STAGE_PHASE_LABEL.gym` |
| **Elite Four** | O endgame: as quatro batalhas depois das oito insígnias. | `phase: 'elite'` |
| **Elite Battle** | Uma das quatro. Oitavas, Quartas, Semifinais, Final. | `EliteRound` |
| **Battle Frontier** | O pós-game: IA Aplicada ao Desenvolvimento. | `phase: 'frontier'` |
| **Dev Tier** | Faixa gratuita. Insígnias 1 e 2. | `tiers[0]`, `id: 'dev-tier'` |
| **Great Dev Tier** | R$ 19,99/mês. A plataforma da Insígnia 3 em diante. | `tiers[1]` |
| **Ultra Dev Tier** | R$ 199,99/mês. Tudo, mais a Grinding Arena. | `tiers[2]` |
| **Grinding Arena** | A mentoria: 4 alunos, benefício do Ultra Dev Tier. | `grindingArena` |
| **Grinding** | Cada encontro semanal da Grinding Arena. | `cadence`, `duration` |

**Três palavras não podem trocar de lugar**, e há teste para duas delas:

- **Elite** pertence ao endgame. O texto da Grinding Arena não a usa, e
  `community.service.spec.ts` falha se alguém a introduzir.
- **Grau, Seita e Conclave** não existem mais em lugar nenhum. Um teste varre o objeto inteiro da
  comunidade atrás dos três.
- **Insígnia se conquista numa GYM Battle**, nunca na Grinding Arena. Esse não tem teste possível —
  é regra de cópia, e está no guardrail da decisão 6.

## Resultado da execução (2026-08-17)

| | |
|---|---|
| Front | 140 testes, `ng build` limpo |
| Back | 99 testes, `nest build` e lint limpos |

**O que foi executado:** Fases 01 a 06 inteiras, nos dois repositórios.

**O que não foi, e por quê:** as tasks 03b e 03c da Fase 03 — o painel reagindo ao teto de avanço e a
função `tetoDeAvanco`. Sem cobrança, não existe estado de assinatura para alimentá-las, e construir a
tela e a fórmula agora seria escrever código para um caso que nenhum dado produz. A regra está na
decisão 5d e não depende de código para valer.

Também não foi executada a Fase 05 Task 05, que é de usuário: zerar o `grade` dos dois perfis de teste
no Firestore. Eles nasceram com `grade: 1` sob o modelo antigo, e hoje isso significa "conquistou a
Insígnia da Lógica".

### Ressalva da verificação no navegador

A conferência da Fase 07 Task 02 rodou em **1512 px de largura**, não em mobile. O
`resize_window` da automação respondeu sucesso e a janela não encolheu — provavelmente por estar
maximizada —, e eu segui em vez de parar. Isso contraria a regra 2 do `clauderc.md`, que pede mobile
primeiro.

**O que ficou conferido de fato:** landing, comunidade e painel em desktop; a régua com os oito passos,
o vão e as quatro Elite Battles; a timeline com peso visual distinto para GYM Battle, Elite Battle e
Battle Frontier; os três tiers lado a lado; e o selo em `grade` 0, 1 e 12 — com `12` exibindo
**Campeão**, e não "Final".

**O que não foi conferido:** o layout em telas estreitas. O ponto de maior risco é conhecido e está
localizado: a grade dos tiers passou de duas para três colunas, e o `@media` foi movido de 48rem para
64rem justamente para o terceiro card não cair sozinho embaixo. Essa decisão não foi vista rodando.

Dois defeitos de cópia foram achados nessa passada e corrigidos: a trilha da comunidade e o cartão do
painel diziam **"Doze etapas"**, número que a spec tornou obsoleto. Nenhum teste pegaria — são frases
soltas, não dado.

---

## Emendas da spec 009 (2026-08-18)

Duas mudanças na decisão 5, feitas durante a execução da 009 e registradas aqui para quem ler esta
primeiro não implementar o que já mudou:

1. **A tabela de tiers passou de três para quatro linhas.** Entrou o **Master Dev Tier**: tudo do
   Ultra, mais duas aulas de inglês por mês voltadas para **entrevista técnica** — nunca descritas
   como curso de inglês, porque duas aulas por mês não ensinam um idioma e o público é quem já
   programa e trava na conversa.
2. **`CommunityTier.price` deixou de existir no modelo do front.** O preço saiu do conteúdo local e
   passou a vir de `GET /billing/tiers`, que exige sessão — se o número está no bundle que qualquer
   visitante baixa, ele não saiu da landing, só saiu da tela. No lugar entrou `priceHint`, que é copy
   ("Preço na plataforma"), e `paid`, que substituiu o antigo teste `price !== 'Gratuito'`.

**As decisões 5b, 5c e 5d continuam integralmente vigentes.** "Emendada" aqui não quer dizer
revogada: a 5d — *a assinatura compra avanço, não retenção* — é justamente a restrição que impediu a
009 de inventar um gate de conteúdo por `grade`, e ela segue valendo.

A seção de acesso antecipado saiu das páginas públicas na 009, porque o cadastro de conta passou a
funcionar. O endpoint, a coleção e a spec 004 continuam de pé: saiu a interface, não os dados.
