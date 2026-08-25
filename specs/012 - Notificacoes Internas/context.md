# Spec 012: Notificações Internas

## Objetivo
Hoje o painel só conta o que aconteceu para quem for procurar. Vídeo novo aparece para quem abrir aquela
insígnia; pergunta nova aparece para quem abrir o Mural naquela semana. A pessoa entra, vê o mesmo painel
de ontem, e sai — sem nenhuma pista de que havia algo novo a três cliques de distância.

Esta spec põe **um sino no painel**. Quando há coisa não lida ele balança de tempos em tempos, com um
brilho laranja pulsando em volta; ao toque, um painel desce por cima do conteúdo com a lista do que a
pessoa ainda não viu; ao tocar um item, um modal diz **o que é** e leva **até lá**.

O par desta spec no backend é a **012**, e as duas entram juntas. O backend responde
`GET /notificacoes` com o que ainda não foi lido; tudo o que esta spec descreve acontece em cima dessa
lista.

---

## Numeração
Os números são iguais nos dois repositórios: 010 é o Mural, 011 é a Sessão que Sobrevive ao F5, 012 é
esta.

---

## Uma ressalva, antes das decisões
O fluxo pedido tem **duas camadas** entre o sino e o destino: painel, depois modal, depois botão. Três
toques para chegar a um vídeo que a pessoa já quer ver. O caminho mais curto seria o item do painel levar
direto à trilha.

O modal fica, porque ele carrega o que o cartão abreviado não cabe — **de qual insígnia é** e **que tipo
de coisa é** —, e sem isso o toque vira aposta. Mas é o ponto do desenho a observar depois do
lançamento: se ninguém ler o modal e todo mundo só caçar o botão, ele é uma parada de pedágio, e a spec
seguinte o remove.

---

## Decisões

### 1. Não existe header no desktop, e essa é a primeira coisa a resolver
O `dashboard-shell` tem um `<header>`, mas ele é **só do celular**: acima de `64rem` ele some, e a
navegação vira o `dashboard-aside`. Um sino "no header" simplesmente não apareceria para quem usa
computador.

Criar um header de desktop para hospedar um sino é reorganizar o painel inteiro por causa de um ícone.
Então: **um componente, dois lugares.**

| Largura | Onde o sino mora |
|---|---|
| Celular (< 64rem) | Na `.mobile-header`, à direita, oposto ao botão de menu |
| Desktop | No `.aside__head`, ao lado do botão de recolher |

O aside recolhido mostra só ícones — e o sino é um ícone. Ele **não some quando o menu está recolhido**;
se sumisse, quem trabalha com o menu fechado nunca saberia de nada.

### 2. O sino só se mexe quando há o que ler, e o movimento é periódico, não contínuo
Sem não lidas: sino parado, cinza, sem brilho. Com não lidas: **balança por ~700ms a cada 8 segundos**, e
o brilho laranja pulsa no mesmo compasso.

Animação contínua é a diferença entre "tem novidade" e "tem uma coisa piscando no canto da tela". A
primeira faz olhar; a segunda faz aprender a não olhar. A spec 010 já fixou a régua — movimento só onde
carrega significado, e o pulso do voto é único, sem loop —, e o intervalo longo é a versão dessa régua
para uma coisa que precisa persistir na tela por minutos.

O balanço **para assim que o painel abre**. Ele existe para chamar; chamado atendido, ele não tem função.

### 3. `prefers-reduced-motion` desliga o balanço e o brilho, e o ponto de contagem fica
Quem pediu menos movimento continua sabendo que há notificação — pelo contador, que é estático. O que
some é a animação, não a informação.

Isso não é acessibilidade decorativa: um ícone que sacode a cada oito segundos é exatamente o padrão que
dispara desconforto vestibular, e ele fica na tela a sessão inteira.

### 4. O contador é um número, e o número tem teto
Um ponto no canto do sino com a contagem: `1` a `9`, e **`9+`** daí em diante. O `aria-label` do botão
diz por extenso — "Notificações, 3 não lidas" —, que é o que faz o recurso existir para quem usa leitor
de tela.

Sem número, "tem alguma coisa" e "tem oito coisas" são o mesmo ponto vermelho, e a pessoa abre o painel
para descobrir o tamanho do trabalho.

### 5. O painel desce por cima, e não empurra o conteúdo
Cartão ancorado ao sino, `slide down` de ~180ms, **sobreposto** ao conteúdo — com sombra dura, como o
resto do sistema. Fecha no `Esc`, no clique fora e ao navegar.

Empurrar o conteúdo para baixo reflui a página inteira: a tela salta, o que estava sendo lido muda de
lugar, e fechar salta de volta. Sobrepor custa um `z-index` e não move nada do que já estava ali.

### 6. A lista é só de não lidas, rola dentro do cartão, e tem altura máxima
Altura máxima de ~24rem com rolagem interna — o cartão nunca cresce além da janela nem empurra rodapé
nenhum. Cada linha traz:

| O que | Como |
|---|---|
| Ícone da insígnia | O mesmo que a trilha e o Mural já usam, resolvido do `badgeId` |
| Título abreviado | Duas linhas no máximo, corte por CSS (`line-clamp`), nunca por `substring` no TypeScript |
| Hora do evento | Alinhada à direita, discreta |
| **Botão de check** | No canto direito, depois da hora. Marca **só aquela** como lida (decisão 9) |

**Abreviar é do CSS, não do TypeScript.** Cortar string em código dá "Como configurar o Git no…" com
reticências no lugar errado em cada largura de tela, e a mesma linha some inteira num aparelho estreito.

**O check não fica dentro da área clicável da linha, fica ao lado dela.** A linha é um botão e o check é
outro, irmãos dentro do `<li>` — botão dentro de botão é HTML inválido, e o navegador resolve isso do
jeito dele: em alguns o clique no check dispara os dois, e a pessoa marca como lida *e* abre o modal.

### 7. A hora é relógio, não "há 5 minutos"
`14:32` para hoje, `ontem 14:32` para ontem, `12/08` daí para trás.

Tempo relativo obriga a recalcular na tela — ou fica errado parado —, e "há 3 horas" não ajuda a decidir
nada. A hora responde a pergunta que a pessoa realmente faz olhando a lista: *isso é de agora ou é de
antes de eu sair?*

### 8. O modal diz o que é, e o botão diz para onde vai
Um item tocado abre o modal com:

- o **título completo** da notificação;
- **uma frase**, e é sempre a mesma forma: *"Vídeo novo na Insígnia do Git e GitHub."* ou *"Pergunta nova
  no Mural, na Insígnia da Lógica."*;
- **um botão só**: **"Ver na trilha"** ou **"Ver no Mural"**.

Uma frase, um botão, nenhuma escolha. O modal existe para dar o contexto que a linha abreviada não cabe;
se ele ganhar um segundo botão, vira uma tela, e ninguém abre uma tela para ver um aviso.

Reusa o `dialog-box`/`confirm-dialog` que já existem — inclusive o foco preso e o `Esc`, que já estão
resolvidos ali.

### 9. Três formas de marcar como lida, e nenhuma delas é "abrir o painel"

| Ação | O que acontece | Para quem |
|---|---|---|
| **Tocar a linha** | Abre o modal, e o modal marca como lida | Quem quer ler aquilo |
| **Tocar o check da linha** | Marca só aquela, **sem abrir modal e sem navegar** | Quem já sabe o que é e não quer ir |
| **"Marcar todas como lidas"** | Esvazia a lista inteira, no rodapé do painel | Quem não se importa com o recurso |

**Abrir o painel não marca nada.** Marcar tudo ao abrir esvaziaria a lista no primeiro olhar: a pessoa
abre, vê cinco, fecha sem tempo de ler, e as cinco somem para sempre — não há histórico (decisão 4 do
backend). Um sino que apaga o que anunciou no instante em que é olhado é pior que um sino que não toca.

O **check individual** existe porque a lista é uma pilha, não um feed: sem ele, o único jeito de tirar da
frente uma notificação que não interessa é abrir o modal dela — ou seja, fingir interesse para conseguir
descartar. Depois do check, a linha sai da lista, o contador cai, e aquela notificação **para de contar
como recente** para sempre. Com "marcar todas" a coisa é a mesma em escala: sem ela, quem não se importa
com o recurso carrega um `9+` permanente, e o sino vira incômodo em vez de aviso.

**As três são otimistas**, com rollback na falha (decisão 12), e a linha sai com uma saída curta — não
some no meio do gesto seguinte, que é o que faz alguém tocar no item errado logo depois.

> **Não há como desfazer**, porque não há histórico. É o custo aceito da decisão 4 do backend, e o que o
> compensa é o desenho: o check fica **no extremo oposto** do que o polegar cruza ao rolar, com alvo de
> 44px próprio (decisão 13). Um check colado no título transformaria toda rolagem numa chance de apagar
> o aviso sem ler.

### 10. O destino é lista, não item

| Tipo | Botão | Destino |
|---|---|---|
| Vídeo novo | Ver na trilha | `/dashboard/trilha/{badgeId}` |
| Pergunta nova | Ver no Mural | `/dashboard/mural?ordem=recentes` |

O Mural abre na aba **"Esta semana"** com as mais novas em cima — é a ordenação que o backend ganhou na
spec 012 dele, e é a única em que a pergunta anunciada está visível sem rolar. A ordem padrão da aba (a
mais antiga primeiro) **não muda** para quem chega pelo menu.

### 11. Sem polling: a lista é buscada na abertura do painel e ao voltar para ele
`GET /notificacoes` roda quando o `dashboard-shell` inicializa e de novo quando o sino é aberto. **Nada
de intervalo.**

O produto já recusou tempo real no Mural (spec 010) e polling de sessão na 011, pelo mesmo argumento: uma
requisição por membro por minuto para descobrir que nada mudou é custo recorrente por conveniência
marginal. A notificação chega na próxima abertura do painel — e um recurso que só existe com o painel
aberto não perde nada com isso.

### 12. Falhar ao carregar notificação não pode aparecer como erro do painel
`GET /notificacoes` falhando deixa o sino **parado e sem contador**, e nada mais. Sem toast, sem faixa
vermelha, sem bloqueio.

É a mesma família de decisão da spec 011: o acessório não decide o destino do essencial. Um erro de rede
numa lista de avisos não pode ser a primeira coisa que a pessoa vê ao abrir o painel — o painel funciona
inteiro sem ele.

Marcar como lida é **otimista**: some da lista na hora, requisição atrás, e volta se falhar. Mesmo
desenho do voto do Mural, e pela mesma razão.

### 13. Mobile: o painel é folha, não menuzinho
Abaixo de 48rem o cartão ocupa a largura toda com margem lateral pequena, ancorado no topo, altura máxima
de 70svh. Alvo de toque de **44px de verdade** no sino, em cada linha e **no check de cada linha**, com
área maior que o desenho. São dois alvos vizinhos dentro da mesma linha, e é o caso em que 44px deixa de
ser régua de acessibilidade e vira o que separa "marquei como lida" de "abri o modal sem querer".

A régua é a da decisão 11 da spec 010, e vale mais aqui: o sino fica na barra do topo, que é a região
mais difícil de alcançar com o polegar — o alvo precisa ser generoso porque a posição não pode ser.

### 14. Vocabulário

| Termo | Uso |
|---|---|
| **Notificações** | o rótulo do sino e o título do painel |
| **Vídeo novo** | o tipo, na linha e no modal. Não é "Nova aula" — pode ser resposta do Mural |
| **Pergunta nova** | o outro tipo. Não é "Novo post" |
| **Ver na trilha** / **Ver no Mural** | os dois textos de botão, literais |
| **Marcar todas como lidas** | a ação do rodapé, literal |
| **Marcar como lida** | o `aria-label` do check de cada linha. Não é "Descartar" nem "Dispensar" |
| **Nada novo por aqui** | o estado vazio |

---

## Rotas

Nenhuma rota nova. O sino vive na casca do painel e aparece em todas.

| Rota | O que muda |
|---|---|
| `/dashboard/**` | A casca ganha o sino, o painel e o modal |
| `/dashboard/mural` | Aceita `?ordem=recentes`: abre em "Esta semana" com as mais novas em cima |
| `/dashboard/trilha/:badgeId` | Sem mudança. É só destino |

---

## Fora de escopo

- **Tela de notificações.** O painel é o recurso inteiro; não há `/dashboard/notificacoes` e não há
  histórico do que foi lido.
- **Preferências e silenciar.** Dois eventos não sustentam uma tela de configuração.
- **Push do navegador, e-mail e som.** Isto é notificação interna: só existe com o painel aberto.
- **Notificação de "sua pergunta venceu".** O backend explica por que não dá hoje: a vencedora é
  derivada, e não tem instante de disparo.
- **Contador em tempo real e badge no favicon** (decisão 11).
- **Sino na landing e na comunidade.** São páginas públicas, sem sessão.
- **Agrupar** ("3 perguntas novas"). Com o volume real, agrupar esconde informação para poupar espaço que
  sobra.

---

## Specs afetadas

### Spec 010 (Mural de Perguntas) — vigente, com uma linha revogada
O "Fora de escopo" de lá diz que *"não existe canal de notificação no produto"*. **Passa a existir.** O
que continua fora é a notificação de vencedora, e agora por um motivo técnico registrado, não por
ausência de canal.

A aba "Esta semana" ganha `?ordem=recentes` — usada só por quem chega pela notificação. A ordem padrão
não muda.

### Spec 009 (Financeiro, Administração e Trilha) — vigente
Publicar vídeo no admin passa a avisar a comunidade. A tela do admin **não muda** e não ganha aviso de
"isto vai notificar N pessoas": com dois eventos raros, um aviso de confirmação em toda publicação seria
atrito diário para uma informação que o admin já sabe.

### Spec 011 (Sessão que Sobrevive ao F5) — vigente
A decisão 12 desta spec segue a mesma regra que aquela fixou: falha de acessório não vira alarme, e não
desloga nem bloqueia nada.

### Spec 008 (Liga Dev) — vigente
O ícone e o nome da insígnia saem do `trackStages` do `community.service.ts`, que já é a fonte deles na
trilha e no Mural. **O backend manda só o `badgeId`** — a duplicação dos treze ids é declarada e antiga,
e resolver isso não é assunto desta spec.

---

## Pontos em aberto

1. **O modal sobrevive ao lançamento?** Ver a ressalva no começo. O risco é ele virar pedágio entre o
   toque e o destino. Fica como está porque o contexto que ele carrega — insígnia e tipo — não cabe na
   linha abreviada.
2. **8 segundos entre balanços é chute.** Escolhido para ser notado sem ser insistente, não medido. Se
   incomodar, o número sobe; se ninguém notar, o problema é o brilho, não o intervalo.
3. **O sino aparece para quem tem zero notificações?** Escrito como **sim**, parado e apagado. Um ícone
   que aparece e some conforme o estado ensina a não procurar por ele — e a pessoa precisa saber onde ele
   fica antes de ele ter algo a dizer.
4. **Vídeo de insígnia que a pessoa ainda não pode assistir.** O backend notifica todo mundo (ponto em
   aberto 2 de lá), e a trilha já explica o bloqueio na própria tela. Se soar como propaganda, o filtro é
   de lá, não daqui.
5. **Onde o sino fica no aside recolhido.** Escrito como ao lado do botão de recolher, visível nos dois
   estados. Se ficar apertado, ele desce para o topo da lista de navegação — o que **não** pode acontecer
   é ele aparecer só com o menu aberto.
