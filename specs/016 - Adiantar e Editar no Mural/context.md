# Spec 016: Adiantar e Editar no Mural

## Objetivo
Duas telas do Mural têm um buraco cada, e os dois buracos são sobre tempo.

**Em `/dashboard/admin/mural`, o admin só sabe remover.** A tela mostra as duas semanas vivas e a vencedora
que virou pauta, e o único botão de cada cartão é "Remover". Quando o Leno lê uma pergunta ótima na
segunda-feira, não existe nada a fazer além de esperar seis dias para o voto abrir e mais sete para ela
sair do mural. A tela ganha **duas ações por cartão**: adiantar para votação, e responder logo.

O caso que dói é a semana magra: **com três perguntas no mural, o ciclo de 14 dias não está protegendo
disputa nenhuma — está só fazendo o aluno esperar.** E a ação é sempre de uma pergunta só: a votação das
outras segue exatamente como estava.

**Em `/dashboard/mural`, "Editar minha pergunta" abre um formulário em branco.** O botão existe, a rota
`PUT` existe no backend desde a spec 010, e mesmo assim editar hoje é reescrever: o campo do título abre
vazio, o corpo abre vazio, e a insígnia — que é obrigatória e que o `PUT` nem envia — abre sem seleção. A
pessoa que quis corrigir uma vírgula digita tudo de novo, escolhe a insígnia de novo, e o que ela escolher
ali é ignorado.

O par desta spec no backend é a **016**, e as duas entram juntas: `GET /mural` passa a devolver a pergunta
inteira, e é dela que o formulário se preenche.

---

## Numeração
Os números são iguais nos dois repositórios. 013 é Meu Perfil, 014 é Disparo de E-mails, 015 é Encontrar um
Membro, 016 é esta.

---

## O que vem pronto do servidor, e por quê

Esta é a regra que a spec 010 estabeleceu e que aqui volta a ser o eixo: **o front não calcula fase.** A
`phase` de cada pergunta chega derivada, e agora ela pode ter sido adiantada pelo admin — o que significa
que uma pergunta com o `weekId` da semana corrente pode legitimamente estar em votação.

Qualquer tentativa de a tela inferir isso do `weekId`, do `currentWeekId` ou do contador de virada produz o
mesmo erro: **um cartão desenhado como coleta com voto aberto por baixo.** Então a tela lê `phase` e
`promotedTo`, os dois campos que a API devolve, e nunca deduz um do outro nem do relógio.

---

## Decisões

### 1. As duas ações do admin ficam no cartão, e não num menu
Cada linha do admin ganha os botões que ainda fazem sentido para aquela pergunta:

| Onde a pergunta está | Botões |
|---|---|
| Coleta, sem promoção | **Adiantar para votação** · **Responder logo** · Remover |
| Votação | **Responder logo** · Remover |
| Já adiantada para responder | Remover |

Um menu de três pontinhos esconderia as ações atrás de um toque e de uma decisão ("o que tem aqui dentro?"),
e a tela do admin é onde ele varre trinta linhas procurando uma. **O que se procura não pode estar
escondido.**

A tabela é a decisão 2 do backend desenhada: **o botão que não faz sentido não existe**, em vez de existir e
responder 409. Um botão que sempre falha é pior que botão nenhum — ele ensina a pessoa a não confiar na
tela.

### 2. Adiantar pede confirmação, e a confirmação diz o que vai acontecer
As duas ações usam o `ConfirmDialog` que a tela já tem para a remoção, com o texto da pergunta dentro — pela
mesma razão que a remoção usa: numa lista de trinta cartões, "tem certeza?" sozinho não diz qual deles vai
mudar.

E o texto diz a consequência, não o mecanismo:

- Adiantar para votação: **"vai receber votos a partir de agora, e o autor não vai mais poder editar o
  texto."**
- Responder logo: **"sai do Mural agora e entra na pauta. Não vai receber mais votos."**

A segunda frase de cada uma é a que importa. Adiantar **não pode ser desfeito** — a decisão 2 do backend —,
e a tela precisa dizer isso antes, porque não vai ter como dizer depois.

E as duas terminam com a mesma linha, que é a invariante do backend dita para quem clica: **"as outras
perguntas seguem o ciclo normal."** Ela não é enfeite. O admin que não tem certeza do alcance do botão não
clica nele, e o que ele mais precisa saber é justamente o que **não** vai acontecer: ninguém mais muda de
aba, nenhuma votação abre antes da hora, e a semana continua elegendo a vencedora dela entre as que
sobraram.

### 3. A tela move o cartão de seção na hora, e recarrega em silêncio
Confirmada a ação, o cartão sai da seção em que estava e aparece na de destino, sem esperar recarregamento —
é o mesmo padrão otimista que o voto do mural já usa.

A diferença é que aqui o servidor devolve a pergunta atualizada, então não há palpite: a resposta do `PATCH`
substitui o item na lista, e a partição por `phase` recoloca o cartão sozinha. **Se falhar, o cartão volta
para onde estava** e a mensagem aparece.

### 3b. Um cartão se move, e só ele
Confirmada a ação, **exatamente um cartão troca de seção.** Nenhum outro se move, nenhuma lista é
reordenada por causa disso, e a seção de origem continua com todo o resto onde estava.

Parece óbvio e é o que a implementação tem mais chance de errar: recarregar a tela inteira depois do
`PATCH` é o atalho natural, e ele produz um piscar em que **todas** as listas se remontam — que é
exatamente a leitura que o admin não pode ter do botão. Com trinta cartões na tela, "tudo se mexeu" e "o
ciclo inteiro andou" são a mesma coisa aos olhos de quem clicou.

Do lado do membro, a mesma invariante aparece como ausência: a pessoa cuja pergunta não foi adiantada
recarrega o mural e **não vê diferença nenhuma** — a dela continua na coleta, sem voto aberto, editável.

### 4. A pauta deixa de ser um destaque e vira uma seção
A tela tem hoje um bloco só, o `pendingWinner`, com **a** vencedora mais recente sem vídeo. Com o
adiantamento, "o que espera vídeo" deixa de ser uma coisa e vira uma lista: as vencedoras das semanas
encerradas mais as adiantadas.

Vira uma seção **no topo**, com uma linha por item, cada uma com o atalho para cadastrar o vídeo na insígnia
certa — que é o fluxo mais repetido do admin e o motivo de o atalho existir desde a 010. Cada linha diz de
onde veio: **"venceu a semana"** ou **"adiantada"**. Sem esse rótulo, o admin não teria como distinguir a
pergunta que a comunidade escolheu da que ele mesmo empurrou, e as duas pedem vídeos de peso diferente.

### 5. O membro vê que a pergunta dele foi adiantada, e isso é uma boa notícia
No `question-card`, uma pergunta com `promotedTo` ganha um selo. Não é ornamento: sem ele, a pergunta do
autor **muda de aba sozinha e some da coleta**, o que, do lado de quem escreveu, é indistinguível de ter
sido removida pela moderação.

Os textos, e eles são para o membro e não para o admin:

- Adiantada para votação: **"Adiantada"**, no cartão que agora está na aba de votação.
- Adiantada para responder: aparece na pauta, junto das vencedoras, marcada como **"vai ser respondida"**.

O selo é do produto inteiro, e não do "meu cartão": todo mundo vê. O mural é público entre membros, e uma
pergunta que pulou a fila sem explicação é a pior leitura possível de um mural que promete que a comunidade
escolhe.

### 6. O formulário de edição abre preenchido, e a insígnia fica travada
`/dashboard/mural/nova` já é a tela de editar — ela detecta `myQuestionId` e troca o `POST` por `PUT`. O que
falta é o conteúdo, e ele agora chega no mesmo `GET /mural` que a tela já faz: `myQuestion`, com `title`,
`body` e `badgeId`.

Então: título e corpo preenchidos, e **a insígnia mostrada, marcada e não clicável**. Não é um campo
desabilitado por preguiça — é a decisão 8 do backend desenhada: o `PUT` não aceita `badgeId`, e um seletor
que aceita cliques cujo resultado a API descarta é a pior forma de mentir para quem está usando. Ao lado,
uma linha explicando: **trocar de insígnia é fazer outra pergunta, e ela tem semana própria.**

O título da tela e o rótulo do botão mudam junto — "Editar minha pergunta" e "Salvar", em vez de "Escrever"
e "Publicar". Hoje as duas dizem a mesma coisa, e quem chegou para editar acha que vai criar uma segunda.

### 7. O 409 da edição ganha um caso novo, e a tela precisa dele
Editar responde 409 em dois momentos: a semana virou enquanto a pessoa escrevia, e — novo — **o admin
adiantou a pergunta para votação enquanto ela escrevia.**

A tela não distingue os dois, e é decisão: o servidor manda uma mensagem só de propósito (decisão 7 do
backend), porque o resultado é o mesmo e a causa não muda nada para quem está lendo. O que a tela faz é o
que ela hoje não faz: **depois do 409, recarregar o estado e mostrar a pergunta em modo leitura**, em vez de
deixar um formulário aberto com um texto que não vai ser salvo.

### 8. O carregamento do admin passa a ser paralelo
A tela encadeia três requisições hoje — votação, depois coleta, depois vencedoras —, cada uma esperando a
anterior. São três idas ao servidor em série para montar uma tela só, e a regra 8 de UI do projeto existe
exatamente para isto.

Vira um `forkJoin`. Não é limpeza avulsa: com a pauta da decisão 4 no topo, a tela passa a ter conteúdo
importante **acima** das listas, e ele seria o último a aparecer justamente por ser o terceiro da fila.

### 9. Nenhuma rota nova, nenhuma tela nova
Tudo acontece em `/dashboard/admin/mural`, `/dashboard/mural` e `/dashboard/mural/nova`, que já existem. O
`MuralService` ganha um método — `promoteQuestion` — e o modelo ganha dois campos.

---

## Telas tocadas

| Arquivo | O que muda |
|---|---|
| `pages/admin/mural/mural-admin.page.*` | Duas ações por cartão, seção de pauta, `forkJoin` |
| `pages/mural/mural.page.*` | Pauta com o selo de origem, e o botão de editar some quando a fase virar |
| `pages/mural/nova-pergunta/nova-pergunta.page.*` | Preenche, trava a insígnia, muda os rótulos, trata o 409 |
| `components/question-card/question-card.ts` | Selo de adiantada |
| `services/mural.service.ts` | `promoteQuestion` |
| `models/mural.model.ts` | `promotedTo` na pergunta, `myQuestion` no estado, `origem` na pauta |

---

## Fora de escopo

- **Desfazer o adiantamento.** O backend não aceita (decisão 2 de lá), e a tela não oferece o que não pode
  ser feito. O caminho de arrependimento é o "Remover" que já está no cartão.
- **Adiantar do mural público.** Só o admin promove, e só na tela de admin.
- **Editar durante a votação**, por qualquer pessoa.
- **Trocar a insígnia na edição.** Decisão 6 — e o seletor travado é justamente como isso fica visível.
- **Aviso de que a sua pergunta foi adiantada.** Seria o sino da spec 012, e o backend não emite o evento.
  Está no ponto em aberto 1.
- **Contador regressivo por pergunta.** O contador de virada continua sendo da semana. Uma pergunta
  adiantada não tem prazo próprio.

---

## Specs afetadas

### Spec 010 (Mural de Perguntas) — vigente, com duas emendas de tela
- A aba de uma pergunta passa a sair de `phase`, e nunca de comparação de `weekId` no cliente.
- O bloco de vencedora única vira a seção de pauta (decisão 4).

### Spec 012 (Notificações Internas) — vigente
O `ordem=recentes` de quem chega pelo sino continua igual. Nenhuma notificação nova.

### Spec 008 (Liga Dev) — vigente
Nenhuma relação. O adiantamento não toca `grade` nem `tier`.

---

## Pontos em aberto

1. **Avisar o autor pelo sino quando a pergunta for adiantada?** Depende de o backend emitir o evento, e ele
   não emite nesta spec. Se emitir, a tela não precisa de nada novo: o sino já lista o que chega.
2. **O selo "Adiantada" deve dizer quem adiantou?** Escrito como não. Só existe um admin, e o nome dele em
   cima de uma pergunta de outra pessoa confunde autoria.
3. **A pauta do membro mostra as adiantadas da semana corrente junto das vencedoras antigas?** Assumido que
   sim, na mesma lista, ordenada da mais recente para a mais antiga, com o rótulo distinguindo. Separar em
   duas listas faria a tela perguntar ao leitor uma coisa que ele não precisa decidir.
4. **Um segundo toque de confirmação para "Responder logo" numa pergunta que ainda está em coleta?** É a
   ação que mais pula etapa — a pergunta sai do mural sem ter recebido um voto. Escrito com o mesmo diálogo
   das outras, e o texto dele já diz isso. Se na prática o clique errado acontecer, o reforço certo é a
   frase, não um segundo diálogo.
