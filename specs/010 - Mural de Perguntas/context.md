# Spec 010: Mural de Perguntas

## Objetivo
Uma tela nova no painel: o **Mural**. O membro escolhe uma insígnia, escreve uma pergunta sobre um tema
dela, e os outros votam. **A mais votada da semana ganha um vídeo curto de resposta**, que vai morar na
trilha daquela insígnia, numa aba de **Perguntas Frequentes**.

O ciclo é semanal e tem duas semanas na tela ao mesmo tempo — uma recebendo perguntas, a outra recebendo
votos. Isso é a coisa mais difícil de explicar desta spec, e a tela existe para explicá-la sem texto.

Três mudanças acompanham:

1. **A primeira restrição de tier visível.** Dev Tier lê e **vota**, mas não escreve. A tela precisa
   dizer isso antes do clique, nunca depois — 403 não é uma forma de comunicar preço.
2. **A insígnia ganha duas abas**: Aulas e Perguntas Frequentes.
3. **O admin ganha o Mural**: moderar perguntas, ver a vencedora da semana, marcar vídeo como Dev Tier e
   editar o tier de um membro.

O par desta spec no backend é a **010**, e ela **depende da 009 estar de pé** nos dois lados.

---

## Numeração
Os números são iguais nos dois repositórios: 008 é Liga Dev (só no front), 009 é Financeiro,
Administração e Trilha (nos dois), 010 é o Mural (nos dois).

---

## O ciclo, e por que a tela é o lugar de explicá-lo

Existe **um instante de virada, domingo 00:00** (horário de Brasília). Nele, três coisas acontecem
juntas: a semana que estava coletando entra em votação, uma semana nova abre para perguntas, e a que
estava em votação encerra — sai do mural, e a mais votada vira pauta de vídeo.

Uma pergunta vive 14 dias na tela: sete recebendo companhia, sete recebendo voto.

**Ninguém vai ler isso num parágrafo de ajuda.** Por isso a tela é organizada pelo ciclo, e não por
lista: duas abas, **"Em votação"** e **"Esta semana"**, com um contador de tempo até a virada. A pessoa
entende o mecanismo usando, que é a única forma de entender.

**"Em votação" é a aba inicial**, e é uma decisão. É onde há algo para fazer com um toque — votar — e é
onde estão as perguntas que já passaram uma semana existindo. Abrir em "Esta semana" mostraria, na
manhã de domingo, uma lista vazia como primeira impressão do recurso.

---

## Decisões

### 1. Duas abas, e a de votar vem primeiro
| Aba | O que mostra | O que dá para fazer |
|---|---|---|
| **Em votação** | Perguntas da semana passada, ordenadas por voto | Votar e desvotar |
| **Esta semana** | Perguntas da semana corrente, ordenadas por data | Escrever a sua, editá-la |
| **Respondidas** | Vencedoras anteriores e o vídeo de cada uma | Assistir |

A terceira aba é o histórico, e ela é o que faz a promessa parecer real: quem chega novo no Mural precisa
ver que **a semana passada virou vídeo mesmo**. Sem ela, "a mais votada ganha um vídeo" é uma frase.

**A ordem dentro de cada aba vem do servidor e o front não reordena** — mesma regra da decisão 7 da spec
009. Reordenar por voto no cliente parece inofensivo até dois membros verem listas diferentes por causa
de um voto que ainda não sincronizou.

### 2. O contador de tempo até a virada é o único texto que explica o ciclo
Um `Fecha em 2 dias` na aba de votação, e um `Vira domingo` na de coleta. Nada de tutorial, nada de
modal de boas-vindas.

O contador é calculado a partir de `currentWeekId` e `votingWeekId`, que a API manda — **nunca do relógio
do navegador sozinho**. Quem está com o fuso errado no celular, ou viajando, veria uma virada que não
existe, votaria e receberia 409. O servidor é a fonte da semana; o front só mostra a diferença.

**O contador não é um cronômetro de segundos.** Granularidade de dias, e horas só no último dia. Um
número descendo em tempo real cria urgência falsa para um prazo que não é urgente, e mantém uma
animação viva na tela sem nenhuma razão.

### 3. O bloqueio do Dev Tier aparece antes do clique, e vende
Dev Tier vê o campo de pergunta desabilitado, com a explicação no lugar do formulário:

> **O Dev Tier vota, mas não pergunta.** Quem escreve a pauta da semana é quem assina. **Ver o
> Financeiro →**

Três coisas que isso resolve, e as três são fáceis de errar:

- **Nada de botão que abre um formulário e falha ao enviar.** Descobrir a restrição depois de escrever
  200 caracteres é o pior momento possível para descobri-la.
- **O caminho de saída é um link para o Financeiro**, não uma mensagem de erro. Esta é a única tela do
  produto onde a restrição aparece no momento exato em que o valor está visível — a pessoa está olhando
  perguntas boas que ela não pode fazer.
- **O voto continua em destaque.** A tela não pode ficar toda cinza para quem não paga: quem vota está
  usando o produto, e é de lá que sai o assinante.

> **Esconder o formulário não é a segurança.** Quem impede é o guard do backend. O front esconde para
> não frustrar, e qualquer tela que dependa do formulário estar escondido está errada.

`canAsk` vem pronto de `GET /mural` — o front **não** recalcula a regra a partir do `tier`. Duas
implementações da mesma regra divergem na primeira exceção.

### 4. O voto é otimista, e o coração muda antes da rede
Tocar no voto pinta na hora, incrementa o contador na hora, e a requisição sai atrás. Falhou, volta e
avisa.

Votar é a ação mais repetida da tela — uma pessoa vota em cinco perguntas numa sessão — e 300ms de
espera cinco vezes é o que faz um recurso parecer lento. Como o backend escreve em lote atômico
(decisão 3 da 010 do backend), o rollback é sempre para um estado íntegro.

**O contador de votos não precisa estar certo em tempo real, e é bom que isso esteja escrito.** Ele é do
momento em que a lista carregou, mais os votos desta sessão. Ninguém decide nada com base em ser 12 ou
13; a precisão só importa na virada, e quem calcula a vencedora é o servidor.

**Sem `onSnapshot`, sem tempo real.** É a tentação óbvia — mural com voto ao vivo — e ela exige abrir o
Firestore para o cliente, o que entrega a coleção inteira e o poder de votar mil vezes (decisão 11 da
009 do backend). O ganho seria ver um número subir sozinho.

### 5. Uma pergunta por semana, e a tela trata isso como um rascunho, não como uma cota
Quem já perguntou não vê "você atingiu o limite". Vê **a própria pergunta**, no topo da aba, com um
botão de editar — porque enquanto a semana não virar, ela é editável.

A diferença é de enquadramento e muda o comportamento: "limite atingido" faz a pessoa perguntar rápido e
mal, para garantir a vaga. "Esta é a sua pergunta desta semana, ainda dá para melhorar" faz ela voltar e
refinar. O limite é o mesmo; o que muda é o que ele produz.

Quando a semana vira, o botão de editar some e a pergunta aparece na aba de votação como as outras.
**A transição precisa ser visível** — a pergunta ganha o selo "em votação" — ou a pessoa vai achar que
perdeu o texto.

### 6. Escolher a insígnia é a primeira coisa do formulário, e é visual
O formulário abre com as treze etapas como chips com ícone, não com um `<select>`. A insígnia não é um
metadado da pergunta: é o assunto dela, e escolher errado é o que gera pergunta invisível.

`<select>` no celular abre uma roda nativa com treze linhas de texto, sem os ícones que a pessoa já
reconhece da trilha. Os chips ocupam mais espaço e são melhores por isso — **cabem no polegar**, mostram
o ícone, e o estado selecionado fica visível enquanto ela escreve o resto.

O `title` tem contador de caracteres (10 a 140) que só aparece **depois** dos primeiros 100. Contador
visível desde o primeiro caractere transforma escrever numa prova.

### 7. A insígnia ganha duas abas na trilha, e a segunda é consulta
`/dashboard/trilha/:badgeId` passa a ter **Aulas** e **Perguntas Frequentes**.

São duas naturezas: aula se assiste em ordem, resposta se consulta por assunto. Misturadas, a trilha
fica com respostas avulsas no meio da sequência e a sequência deixa de ser sequência.

Cada vídeo de resposta mostra, acima do player, **a pergunta original e quem perguntou**. É metade do
valor da aba: a pessoa vê que uma pergunta de alguém como ela virou conteúdo, e é isso que faz o Mural
parecer que funciona.

Se a insígnia não tem resposta nenhuma, a aba existe e diz *"Nenhuma pergunta desta insígnia foi
respondida ainda. Que tal fazer a primeira?"*, com link para o Mural. **Vazio é a chance de convidar** —
e é o mesmo princípio da decisão 6 da spec 009, onde insígnia sem conteúdo abre e avisa em vez de
travar.

### 8. O selo de Dev Tier é do vídeo, e ele é uma promessa pública
Vídeo marcado `devTierFree` mostra um selo **"Livre para todos"** na lista e na página. Vale mesmo em
insígnia adiantada.

O selo não pode ser discreto. Ele é a prova, visível para quem não paga, de que a plataforma abre porta
— e é o contrapeso da decisão 3, que é a única tela onde o produto diz "não" para o Dev Tier. Um "não"
na mesma sessão que um "aqui, de graça" é um produto justo; o "não" sozinho é um paywall.

### 9. O admin ganha o Mural, e a moderação é irreversível — então confirma
Sob `/dashboard/admin/mural`:

- **Perguntas da semana em votação e da semana em coleta**, com o contador de votos.
- **Remover pergunta** — ofensiva, duplicada ou fora de tema. Passa pelo `confirm-dialog` existente, com
  o texto da pergunta no diálogo. É a única remoção real, e ela leva os votos junto.
- **A vencedora da semana encerrada**, com um caminho de um toque para "cadastrar o vídeo de resposta"
  que já chega no formulário de vídeo com a insígnia e o `questionId` preenchidos. É o fluxo mais
  repetido do admin — toda semana — e o único que vale otimizar para atalho.
- **Editar o `tier` de um membro**, na tela de usuários que a 009 criou, ao lado do `grade`. Os dois
  campos ficam **visivelmente separados**, com rótulos que dizem o que são: `tier` é acesso, `grade` é
  conquista. Encostados sem explicação, viram a mesma coisa na cabeça de quem clica, e a spec 008 inteira
  depende de não virarem.

### 10. Animação: o ciclo é a única coisa que merece movimento de destaque
Valem as cinco regras da decisão 8 da spec 009 — só `transform` e `opacity`, `prefers-reduced-motion`
global, durações tokenizadas, cascata com teto de 6, movimento com causa. O que esta tela acrescenta:

- **O voto** — o ícone pulsa uma vez e o contador sobe com um deslocamento curto para cima. Um pulso, sem
  loop, sem confete. É a interação mais repetida da tela, e animação exagerada em ação repetida cansa em
  três toques.
- **A reordenação por voto** — quando uma pergunta passa outra, as duas trocam de lugar com FLIP em vez
  de a lista redesenhar. É o que faz a disputa parecer disputa. Só na recarga da lista, nunca a cada
  voto — lista que se reordena embaixo do dedo faz a pessoa votar na pergunta errada.
- **A troca de aba** — deslize lateral curto, na direção do gesto. As abas são vizinhas no tempo (esta
  semana / semana passada), e o movimento lateral diz isso sem texto.
- **A pergunta enviada** — entra na lista de onde o formulário estava, ligando o ato ao resultado.

### 11. Mobile: o Mural é a tela mais tocada do produto
Valem as regras da decisão 9 da spec 009. O que esta tela acrescenta:

- **O alvo do voto tem 44px de verdade**, com a área maior que o desenho. É o toque mais frequente do
  app inteiro e o mais fácil de errar com o polegar em movimento.
- **O botão de perguntar fica ancorado embaixo**, com `env(safe-area-inset-bottom)`, e vira o formulário
  em folha deslizante de baixo — não modal centralizado. Teclado aberto no celular deixa um modal
  centralizado com três linhas visíveis.
- **As abas ficam no topo e grudam ao rolar.** Sem isso, quem desce vinte perguntas perde a única pista
  de qual semana está olhando.
- **Cada pergunta é um cartão de uma coluna**, com o ícone da insígnia à esquerda e o voto à direita, no
  lado do polegar. Nunca duas colunas de cartões abaixo de 48rem.
- **Esqueleto na forma dos cartões**, não spinner.

### 12. Vocabulário
| Termo | Uso |
|---|---|
| **Mural** | o item do menu e a rota. Não é "Fórum", que promete discussão que não existe |
| **Em votação** / **Esta semana** / **Respondidas** | os três nomes de aba, literais |
| **Perguntas Frequentes** | a aba dentro da insígnia. Não é "FAQ" |
| **Livre para todos** | o selo do vídeo `devTierFree`. Não é "Grátis", que soa a promoção |
| **O Dev Tier vota, mas não pergunta** | a frase do bloqueio, literal, sempre a mesma |

---

## Rotas

| Rota | Guard | O que é |
|---|---|---|
| `/dashboard/mural` | auth + perfil completo | As três abas do ciclo |
| `/dashboard/mural/nova` | idem | Formulário. Redireciona quem não pode escrever |
| `/dashboard/trilha/:badgeId` | idem | Ganha as abas Aulas e Perguntas Frequentes |
| `/dashboard/admin/mural` | idem + admin | Moderação, vencedora, atalho para o vídeo |

---

## Fora de escopo

- **Tempo real.** Nada de `onSnapshot` e nada de polling (decisão 4).
- **Comentar ou responder por texto.** O Mural é perguntar e votar.
- **Notificação** de "sua pergunta venceu". ~~Não existe canal de notificação no produto.~~ **A spec 012
  criou o canal**, e mesmo assim este evento continua fora: a vencedora é *derivada, nunca gravada*, então
  não existe o instante em que ela "acontece" para virar gatilho. Notificar exigiria o cron que esta spec
  recusou de propósito.
- **Busca e filtro por insígnia** nas listas do Mural. Com uma pergunta por pessoa por semana, a lista
  não chega no tamanho que exigiria busca. Se chegar, a spec é outra.
- **Jogos e desafios.** A regra de tier já está escrita — Dev Tier não participa —, mas nada disso
  existe.
- **Editar o texto de uma pergunta já em votação.** O backend recusa, e a tela nem oferece.

---

## Specs afetadas

### Spec 009 (Financeiro, Administração e Trilha) — vigente, estendida
A trilha da insígnia ganha abas; a tela de usuários do admin ganha o campo `tier`; o aside ganha o
Mural. A decisão 6 de lá — trilha não travada, insígnia vazia abre e avisa — continua valendo, e a aba
de Perguntas Frequentes vazia segue o mesmo padrão.

### Spec 008 (Liga Dev) — vigente
`grade` é conquista, `tier` é acesso, e a decisão 9 desta spec existe para os dois não se confundirem na
tela do admin.

---

## Pontos em aberto

1. **A pergunta mostra o nome de quem perguntou?** Assumido que sim, primeiro nome. Se for anônimo, a
   decisão 7 perde o "e quem perguntou", que é metade do valor da aba de Perguntas Frequentes.
2. **O que a aba "Em votação" mostra na primeira semana de vida do recurso?** Ela estará vazia por sete
   dias. Assumido: um estado explicando o ciclo e mandando para "Esta semana" — é o único momento em que
   um texto explicativo se justifica, porque não há nada para aprender usando.
3. **O membro Dev Tier vê o formulário desabilitado ou não vê formulário nenhum?** Escrito como
   desabilitado com a explicação no lugar, porque ver o que se ganha é o argumento. Se ficar agressivo
   demais, vira um link discreto.

---

## Resultado da execução (2026-08-18)

Seis fases no front, com **241 testes** verdes no Karma e `ng build` limpo. No backend, **206 testes**
e 27 suítes.

### O que ficou de fora, e por quê

- **FLIP na reordenação por voto, deslize lateral na troca de aba, e a entrada da pergunta a partir
  do formulário** (Fase 06, Tasks 02 a 04). São refinamentos de movimento, e nenhum deles carrega
  significado que a tela não diga sem eles. O que a decisão 10 pedia como essencial — o pulso único
  do voto, sem loop — está feito, e a régua de mobile inteira também.
- **Verificação em aparelho real** (Fase 06, Task 06). As regras de movimento existem por causa do
  celular fraco; verificar no desktop é não verificar.
- **Verificação com duas contas** (Fase 07, Task 04). Precisa de uma conta Dev Tier e uma paga em
  ambiente real.

### Uma coisa que a execução decidiu, e vale registrar

**A lista do Mural não se reordena ao votar.** A decisão 4 já dizia que o contador não precisa estar
certo em tempo real; a execução foi além e fixou que a *ordem* também não muda no ato. Reordenar
embaixo do dedo faria a pessoa votar na pergunta errada no toque seguinte — e como a ordem só importa
na virada, quando o servidor calcula a vencedora, adiar a reordenação para a próxima carga não custa
nada.
