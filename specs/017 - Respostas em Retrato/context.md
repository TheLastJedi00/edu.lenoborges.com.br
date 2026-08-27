# Spec 017: Respostas em Retrato

## Objetivo
Duas telas ficaram pela metade quando a spec 010 criou a aba **Perguntas Frequentes**, e a 016 deixou as
duas mais visíveis ao criar a pauta que diz quais perguntas esperam vídeo.

**Em `/dashboard/admin/trilha/:badgeId`, o formulário só sabe publicar aula.** Ele manda `title`,
`youtubeUrl` e `description`, e mais nada — `kind` e `questionId` existem na API desde a 010 e o front nunca
os enviou. O admin que clica em "Cadastrar o vídeo de resposta" na pauta do mural chega numa tela que não
tem onde dizer que aquilo é uma resposta. E se ele colar o link que o YouTube deu, leva um 400: o vídeo de
resposta é um Short, e o backend só passa a entender `youtube.com/shorts/…` na spec 017 dele.

**Em `/dashboard/trilha/:badgeId`, a aba de respostas desenharia o vídeo errado.** A moldura é
`aspect-ratio: 16 / 9`, fixa, e a resposta é um Short — 9:16. Num vídeo em retrato dentro de moldura larga,
o conteúdo vira uma faixa estreita no meio da tela com tarja preta dos dois lados, ocupando um terço do
espaço que ele pediu. E acima dele a tela hoje escreve uma frase genérica — *"Resposta a uma pergunta do
Mural"* — que não diz **qual** pergunta, nem quem perguntou, nem quando.

Esta spec fecha as duas: o balão com a pergunta, a data e o autor acima de cada resposta, o iframe em
retrato, e o formulário do admin sabendo publicar resposta a partir de um link de Shorts.

O par desta spec no backend é a **017**, e as duas entram juntas: `orientation` e `question` chegam prontos
do servidor, e o formulário passa a mandar `kind` e `questionId`.

---

## Numeração
Os números são iguais nos dois repositórios, com a exceção conhecida da 008 (Liga Dev, só no front). 015 é
Encontrar um Membro, 016 é Adiantar e Editar no Mural, 017 é esta.

---

## O que vem pronto do servidor, e por quê

A regra da spec 010 continua sendo o eixo, e aqui ela aparece em dois campos novos:

**`orientation: 'paisagem' | 'retrato'`.** O front **não deriva a proporção do `kind`.** Seria uma linha, e
é justamente por ser uma linha que ela viraria três, espalhadas por template, folha de estilo e teste. O
servidor afirma a orientação, a tela obedece, e o dia em que existir uma resposta longa em paisagem nenhum
arquivo daqui muda.

**`question: { id, title, authorName, askedAt } | null`.** O balão não busca a pergunta: ela chega dentro do
vídeo, fotografada no momento da publicação. Isso significa que **o texto do balão pode não ser o texto atual
da pergunta no mural**, e isso é o comportamento certo — o vídeo respondeu o que foi perguntado.

E significa uma coisa mais prática: **`question` é `null` em todo vídeo publicado antes desta spec**, e em
toda aula. A tela desenha o balão quando ele existe e não desenha quando não existe, sem estado de erro e
sem espaço reservado.

---

## Decisões

### 1. O balão vem acima do vídeo, e a ordem de leitura é a da conversa
A resposta só faz sentido depois da pergunta. O cartão inteiro fica assim, de cima para baixo:

```
┌─────────────────────────────────────┐
│ "Como saber quando usar herança     │   ← o balão: a pergunta, em destaque
│  em vez de composição?"             │
│                                     │
│ Ana Prado · 9 de agosto             │   ← autor e data, na tipografia mono
└──────────╲──────────────────────────┘
            ╲                             ← o rabicho, apontando para o vídeo
   ┌──────────────────┐
   │                  │
   │                  │
   │     9 : 16       │                   ← o iframe em retrato
   │                  │
   │                  │
   └──────────────────┘
```

O rabicho não é enfeite: ele é o que diz que aquele vídeo responde **aquela** pergunta, e não que os dois
estão perto por acaso. Numa lista de oito respostas seguidas, sem ele o leitor precisa contar de cima para
saber a quem cada balão pertence.

O título da plataforma continua existindo e continua vindo primeiro — ele é o que diz do que o vídeo trata,
e a decisão 6 da spec 009 do backend não muda aqui. **A pergunta não substitui o título:** o título é o que
o admin escreveu para a trilha, a pergunta é o que o aluno escreveu para o mural, e a aba fica ilegível
quando os dois viram um só.

### 2. A data é escrita por extenso, e é a da pergunta
`askedAt` vira "9 de agosto", com o ano só quando não for o ano corrente — a mesma forma que o mural já usa.
Nada de "há 3 meses": tempo relativo tem sua utilidade num feed que a pessoa varre todo dia, e a aba de
respostas é consultada por assunto, não por recência. **"Há 3 meses" envelhece dentro da própria frase; "9
de agosto" é a mesma informação daqui a um ano.**

E é a data da **pergunta**, não a da publicação do vídeo. O balão conta quando alguém teve aquela dúvida —
a data em que o Leno gravou não é informação de ninguém.

### 3. O retrato é limitado em largura, e essa é a decisão de layout inteira
Um iframe 9:16 com `width: 100%` numa tela de desktop tem **mil e duzentos pixels de altura.** Ele empurra
tudo para fora da tela, e uma lista com três respostas vira quatro rolagens de página.

Então:

- **No celular**, o retrato ocupa a largura toda, com um teto de altura em `vh` para o vídeo caber na tela
  junto do balão. É o formato nativo do dedo, e é onde o Short vai ser assistido.
- **A partir do tablet**, o retrato para de crescer numa largura fixa e fica alinhado à esquerda, sob o
  rabicho do balão. Não centralizado: alinhado com o balão, com o título e com todo o resto da coluna, que
  é o que preserva a leitura vertical da página.

A aula continua 16:9 e continua ocupando a largura toda. **As duas abas passam a ter formas visivelmente
diferentes, e isso é bom** — a pessoa sabe em qual está antes de ler o rótulo.

### 4. A moldura sai do `kind` e passa a sair de `orientation`
Uma classe por orientação, e a folha de estilo com as duas proporções. Nada de `[style.aspect-ratio]`
calculado no template: proporção é decisão de folha de estilo, e um `style` inline é o lugar onde ela deixa
de ser alterável por media query — exatamente o que a decisão 3 precisa fazer.

### 5. O formulário do admin ganha o modo resposta, e ele chega por link
Publicar uma resposta exige uma pergunta, e a pergunta o admin já escolheu: ele veio da pauta do mural, onde
clicou em "Cadastrar o vídeo de resposta" naquela linha. O link passa a carregar
`?resposta={questionId}`, e a tela da insígnia abre com o formulário **já aberto, já em modo resposta, com a
pergunta fixada no topo dele**.

Foi considerado um seletor de perguntas dentro do formulário. Ele perde por dois motivos: exige uma rota
nova para listar as perguntas em pauta, e cria a chance de o admin escolher a errada numa lista de títulos
parecidos. **O caminho pelo link não tem essa chance — a pergunta é a que ele estava lendo quando clicou.**

O preço está declarado: quem abrir a insígnia direto, sem passar pela pauta, publica aula e só. É aceito
porque a pauta é o fluxo real e é para lá que a tela do mural empurra.

### 6. O modo resposta muda o formulário inteiro, e não só um campo escondido
Não basta mandar `kind` por baixo. Em modo resposta, o formulário:

- mostra **a pergunta, o autor e a data** num bloco fixo no topo, com o mesmo desenho do balão da trilha —
  o admin vê o que o aluno vai ver;
- troca o rótulo do botão de "Publicar" para **"Publicar a resposta"**;
- troca o texto de ajuda do campo de link para dizer que **link de Shorts serve**, que é a informação que
  hoje falta e que causa o 400.

A pergunta fixada **não é editável e não é um campo do formulário.** Ela veio da URL, o servidor vai
verificá-la, e um campo editável ali só criaria a chance de alguém colar um id errado.

### 7. O erro do link ganha o caso do Short, e a mensagem diz o que fazer
O 400 de hoje diz *"Não reconheci esse link do YouTube. Cole a URL do vídeo."* — e era verdade até esta
spec, quando link de Shorts era mesmo irreconhecível. Agora que ele é aceito, a mensagem precisa parar de
sugerir que o problema era o formato do link que o admin acabou de colar corretamente.

A mensagem passa a listar o que serve, incluindo Shorts. **Uma mensagem de erro que não diz o formato aceito
faz a pessoa tentar de novo com a mesma coisa.**

### 8. O painel da insígnia ganha as mesmas duas abas da trilha
Hoje o painel lista os vídeos todos juntos e reordena chamando a API como se fossem Aulas. Enquanto não
existia resposta nenhuma, isso funcionava por sorte. **A primeira resposta publicada quebra a reordenação de
vez**, com 400 em toda seta clicada — o backend valida a lista contra uma aba, e a lista que a tela manda
tem as duas.

Então o painel ganha as abas, lê `?kind=` e reordena passando a aba corrente. É a correção de um bug que
esta spec cria, e por isso ela entra nesta spec e não na próxima.

### 9. A frase genérica sai
*"Resposta a uma pergunta do Mural"* era um marcador de lugar, e o lugar agora tem conteúdo. Ela sai. O que
fica no lugar dela quando `question` for `null` — vídeo antigo, marcado como resposta antes desta spec — é
**nada**: sem balão, sem espaço reservado, sem aviso. Um vídeo assim é indistinguível de uma aula na tela, e
isso é preferível a um balão vazio explicando que faltou dado.

### 10. Nenhuma rota nova, nenhuma tela nova
Duas telas mudam por dentro, uma delas ganha um parâmetro de query, e o roteador não sabe de nada disso.

---

## Telas tocadas

| Tela | O que muda |
|---|---|
| `/dashboard/trilha/:badgeId` | O balão com pergunta, autor e data acima de cada resposta. A moldura passa a sair de `orientation`. A frase genérica sai. |
| `/dashboard/admin/trilha/:badgeId` | Abas Aulas/Respostas. O formulário ganha o modo resposta, aberto por `?resposta={id}`. A mensagem do 400 lista os formatos aceitos. |
| `/dashboard/admin/mural` | Uma linha: o link da pauta passa a carregar `?resposta={question.id}`. |

---

## Fora de escopo

- **Reproduzir o vídeo dentro do balão, sem sair para o YouTube.** Já é assim: o iframe é o player, e nada
  aqui muda o embed.
- **Um seletor de perguntas dentro do formulário.** Ver a decisão 5.
- **Link do balão para a pergunta no mural.** A pergunta que virou vídeo já saiu do mural — a decisão 5 da
  spec 016 a moveu para a pauta —, então o link levaria a uma tela onde ela não está mais. Fica de fora até
  existir uma página de pergunta.
- **Contagem de votos no balão.** Foi considerado e sai: "12 votos" no cartão de uma resposta transforma o
  balão num placar, e a aba de respostas é consultada por assunto, não por popularidade.
- **Mudar o formato do cartão de aula.** A aula continua exatamente como está.
- **Editar a pergunta fixada, ou vincular pergunta a um vídeo já publicado.** O backend não oferece, e a
  tela não inventa.

---

## Specs afetadas

### Spec 009 (Financeiro, Administração e Trilha) — vigente, com uma emenda de tela
O formulário de vídeo continua com o título obrigatório e sem preenchimento automático a partir do YouTube —
a decisão que a 009 tomou continua inteira. O que muda é que ele passa a ter dois modos.

### Spec 010 (Mural de Perguntas) — vigente, com duas emendas de tela
- A aba de respostas passa a ter conteúdo de verdade, e o texto de vazio dela continua igual: ele convida
  para o Mural, e continua sendo o convite certo.
- A frase genérica de resposta sai (decisão 9).

### Spec 016 (Adiantar e Editar no Mural) — vigente, com uma emenda de tela
O link "Cadastrar o vídeo de resposta" da pauta ganha o parâmetro de query. A pauta em si não muda: ela
continua mostrando tudo o que espera vídeo, inclusive o que já foi gravado — o corte por `answerVideoId` é
ponto em aberto no backend e não entra aqui.

### Spec 008 (Liga Dev) — vigente
Nenhuma relação.

---

## Pontos em aberto

1. **O balão deveria aparecer também na pauta do admin, com o mesmo desenho?** Escrito como não por ora — lá
   a pergunta já é o conteúdo principal da linha, e um balão em volta dela seria moldura sem função. O
   desenho do balão fica só na trilha e no formulário em modo resposta.
2. **A aba de respostas deveria ser a primeira quando a insígnia tiver mais resposta que aula?** Não. A
   ordem das abas é fixa e Aulas vem primeiro, porque a trilha é uma sequência e a resposta é consulta. Uma
   ordem que muda sozinha faz a pessoa procurar a aba onde ela estava da última vez.
3. **Um Short numa aba de aula, saindo em paisagem com tarjas pretas — a tela deveria evitar?** Não pode:
   `orientation` vem do servidor e o front obedece. Se isso incomodar na prática, o conserto é no backend, e
   é o ponto em aberto 5 da spec 017 de lá.
4. **Autoplay ou `mute` no iframe do Short?** Escrito como não. Vídeo que começa sozinho numa lista de oito
   é o comportamento que faz a pessoa procurar o botão de parar, e não o de assistir.
5. **O admin deveria conseguir publicar resposta sem vir da pauta?** Se acontecer de a pauta ser perdida —
   o admin fechou a aba, voltou depois —, hoje ele refaz o caminho pelo mural. É um clique a mais num fluxo
   raro. Se virar reclamação, o caminho é o seletor da decisão 5, com a rota nova que ele exige.
