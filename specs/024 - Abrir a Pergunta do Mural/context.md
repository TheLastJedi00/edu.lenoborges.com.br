# Spec 024: Abrir a Pergunta do Mural

## Objetivo
Hoje a pergunta do Mural não abre. No mural do membro, o cartão mostra título, autor e o corpo
inteiro despejado embaixo; no painel do admin, as linhas de "Em votação", "Esta semana" e da pauta
mostram **só o título e o autor**, e o contexto que a pessoa escreveu não aparece em lugar nenhum.
O `body` chega da API em todas essas telas e é descartado na renderização.

Esta spec faz o cartão abrir. Clicar no cartão, no mural ou no painel, abre um diálogo com a
pergunta inteira: insígnia, título, contexto completo, quem escreveu, quando escreveu, quantos
votos tem, em que fase está e o caminho para a resposta quando ela já existe.

**Esta spec não tem par no backend.** `MuralQuestionDto` já carrega `body`, `createdAt`,
`authorUid`, `voteCount`, `phase`, `promotedTo` e `answerVideoId`, e `WinnerDto` embute o mesmo
DTO. Nenhuma rota nova, nenhum campo novo, nenhuma requisição a mais: a pergunta que o diálogo
mostra é a que **já está em memória** na lista.

---

## Decisões

### 1. É diálogo, e não rota
Abrir a pergunta é um desvio de leitura de dez segundos no meio de uma lista rolada. Uma rota
`/dashboard/mural/perguntas/:id` faria o retorno custar um `history.back()` que devolve a lista no
topo, sem a rolagem, sem a aba escolhida e, no painel, sem as três seções que o `forkJoin` acabou
de montar.

É o mesmo julgamento do `MemberCardDialog` (spec 019) e do `TrainingDialog` (spec 023), e o
diálogo se parece com eles de propósito: `<dialog>` nativo, `showModal()`, fecha por `Esc`, por
clique fora e pelo botão do rodapé.

O `open(question)` é **método**, e não input, pela mesma razão escrita no `LegalAcceptDialog`: em
zoneless, um host que renderiza o diálogo dentro de um `@if` e chama `open()` numa microtask chama
antes de o componente existir. O componente fica sempre renderizado, no fim do template.

### 2. Um componente só, para o membro e para o admin
`QuestionDetailDialog` é **burro** e é o mesmo nas duas telas. Ele recebe a pergunta e desenha; não
busca nada, não vota, não promove e não remove.

O que difere entre as duas telas são as **ações**, e elas entram por projeção de conteúdo
(`<ng-content select="[acoes]">`) no rodapé. O mural não projeta nada; o painel projeta os botões
de adiantar e remover que já existem na linha. Um input `admin: boolean` que ligasse botões por
dentro faria o componente conhecer as duas telas, e a terceira tela seria o terceiro `if`.

### 3. O cartão inteiro é o alvo, sem aninhar botão dentro de botão
O pedido é clicar no cartão. Mas o cartão já tem dois elementos interativos por dentro, o voto e o
nome do autor, e `<button>` dentro de `<button>` é HTML inválido, com comportamento que muda entre
navegadores.

O padrão é o alvo esticado: o título vira um `<button class="card__abrir">` cujo `::after` cobre o
cartão (`position: absolute; inset: 0`), e o voto e o nome do autor sobem com `position: relative;
z-index: 1`. Resultado: um alvo do tamanho do cartão, **um** item na ordem de tabulação nomeado
pelo título ("Abrir a pergunta: ..."), e os dois botões de dentro continuam clicáveis e continuam
sendo eles mesmos no leitor de tela.

O cartão ganha `cursor: pointer` e um realce de `:hover` e de `:focus-within`. Sem o realce, o alvo
esticado é invisível e ninguém descobre que dá para clicar, que é exatamente o defeito de hoje.

### 4. O corpo é prévia no cartão e inteiro no diálogo
`QUESTION_BODY_MAX` é 1000 caracteres. Hoje o cartão imprime os 1000, e uma pergunta longa empurra
as outras cinco para fora da tela em 360px: a lista deixa de ser lista.

No cartão o corpo passa a ser prévia de **3 linhas** (`-webkit-line-clamp: 3`), e é o diálogo que
mostra o texto inteiro. Sem o corte, "abrir para ler" não significa nada, porque já estava tudo
lá; com o corte, o clique tem para onde levar.

O texto é puro, e continua puro: interpolação normal com `white-space: pre-wrap`, para preservar as
quebras de linha que a pessoa digitou. **Nada de `innerHTML` e nada de `bypassSecurityTrustHtml`**
aqui, pela razão que já está escrita no `CreateQuestionDto` do backend, decisão 10 da spec 010: o
campo é texto puro justamente para que a superfície de XSS não apareça no primeiro pedido de "deixa
o código em `<pre>`".

Pergunta sem contexto não vira buraco: o diálogo escreve "Quem perguntou não escreveu mais
contexto." Ausência dita é informação; espaço em branco é tela quebrada.

### 5. O diálogo lê, e não vota
O voto continua no cartão, no lado do polegar, onde a spec 010 o pôs por ser o toque mais repetido
do app.

Não é economia de botão: o diálogo recebe uma **fotografia** da pergunta, e um voto disparado de
dentro dele teria que atualizar a lista, o contador da fotografia e o rollback dos dois em caso de
falha. Seriam duas implementações do voto otimista, e a segunda divergiria da primeira no primeiro
`catch`. O diálogo mostra o contador como número estático, e quem fecha cai de volta no cartão com
o botão de voto embaixo do dedo.

Pela mesma razão, o diálogo não ganha um "Editar minha pergunta" próprio: quando a pergunta é do
próprio membro e está em coleta, ele mostra o selo "a sua", e o botão fixo de editar continua sendo
o da página, que é o único lugar que sabe navegar para o formulário.

### 6. Um modal por vez: o nome do autor fecha a pergunta e abre o cartão
O nome do autor continua clicável dentro do diálogo, com a mesma regra da spec 019: é botão só
quando `authorUid` existe, e a comparação é com nulo, nunca com o valor sentinela do backend.

Clicar **fecha o diálogo da pergunta e abre o cartão do membro**. Dois `<dialog>` empilhados no top
layer funcionam, mas o `Esc` fecha o de cima e deixa o de baixo aberto atrás, e ninguém consegue
prever qual dos dois vai fechar. Um por vez custa um clique a mais para voltar e não custa nenhuma
dúvida.

### 7. No painel, quem abre são as três listas e a pauta
`/dashboard/admin/mural` ganha o mesmo alvo esticado em "Em votação", em "Esta semana" e nas linhas
da pauta. A pauta é a que mais importa: é dela que sai a decisão de gravar o vídeo, e hoje o admin
escolhe a partir de um título de até 140 caracteres, sem ler o contexto que a pessoa escreveu.

Na pauta, o link "Cadastrar o vídeo de resposta" continua na linha **e** aparece projetado no
rodapé do diálogo, porque ler a pergunta e decidir gravar são o mesmo movimento. Nas linhas de
votação e coleta, adiantar e remover são projetados no rodapé com o mesmo `ConfirmDialog` de
sempre: o diálogo da pergunta fecha antes de a confirmação abrir, pela decisão 6.

### 8. Na aba "Respondidas", a linha também abre
A aba de vencedoras hoje mostra título, autor e votos. Ela passa a abrir o mesmo diálogo, que é o
único lugar onde a pergunta respondida aparece por extenso, com o link "Ver a resposta na trilha"
no rodapé quando `answerVideoId` existe.

Semana em branco continua sendo semana em branco: sem pergunta, não há alvo, não há cursor de
clique e não há o que abrir.

### 9. O título da insígnia sai de um lugar só
`QuestionCard` já converte `badgeId` em título de insígnia por um `computed` sobre
`CommunityService.trackStages()`. O diálogo precisa do mesmo rótulo, e uma segunda cópia daquele
`find` seria a terceira quando o painel quiser o mesmo.

A conversão vira `tituloDaInsignia(stages, badgeId)` em `src/app/core/mural/`, função pura, com o
mesmo fallback de hoje: id não encontrado devolve o próprio id, porque um rótulo feio é melhor que
um cartão sem assunto. O cartão passa a chamá-la, e o `computed` dele fica de uma linha.

### 10. Fase por extenso, e vinda do dado
O diálogo escreve em que fase a pergunta está: "recebendo perguntas", "em votação" ou "encerrada",
mais o selo "adiantada" quando `promotedTo` existe.

O texto sai de `phase` e de `promotedTo`, que chegam prontos do servidor. **Nada aqui compara
`weekId` com relógio nenhum**: a fase é o maior entre a conta do relógio e o piso da promoção, e
essa conta tem um dono só, do outro lado. Derivar aqui é o mesmo erro registrado na spec 016, com
o mesmo sintoma: um cartão desenhado como coleta com voto aberto por baixo.

### 11. A data é a de quem perguntou, e sai de `core/datas`
O diálogo mostra `createdAt` com `dataPorExtenso`, o mesmo formato do balão da resposta na trilha
(spec 017). **Não é o `weekId`**: aquele é o domingo que abre a semana, e a pergunta pode ter
nascido na quinta. No painel, a linha da semana continua mostrando o `weekId`, que lá é a
identidade do ciclo e não a data do texto.

---

## Fora de escopo
- Rota, endpoint ou campo novo no backend. Tudo que o diálogo mostra já chega nas listagens.
- Votar, editar, adiantar ou remover **por dentro** do diálogo sem passar pelas ações que já
  existem (decisões 5 e 7).
- Responder a pergunta pelo diálogo: cadastrar o vídeo de resposta continua sendo o fluxo da spec
  017, pelo link da pauta.
- Busca, filtro ou paginação das listas do Mural.
