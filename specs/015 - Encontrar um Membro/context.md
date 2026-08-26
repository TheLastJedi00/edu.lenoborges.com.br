# Spec 015: Encontrar um Membro

## Objetivo
`/dashboard/admin/usuarios` existe desde a spec 009 e faz uma coisa: mostra os cadastrados, 50 por vez, na
ordem que o Firebase Auth quiser, com um botão "Carregar mais" que não sabe dizer quantos faltam.

Isso serviu enquanto a lista cabia na tela. **Hoje o admin não abre essa tela para ler a lista — ele abre
para achar uma pessoa**, e a tela não tem nenhuma das ferramentas de achar: nem busca, nem filtro, nem
total. O caminho real é clicar "Carregar mais" até o fim e usar o `Ctrl+F` do navegador.

Esta spec transforma a lista em uma ferramenta de encontrar, e o que se encontra em algo que se pode usar:

1. **Buscar e filtrar** — por nome ou e-mail, por onboarding pendente, por tier e por faixa de insígnia,
   com o total do recorte sempre à vista.
2. **Abrir um membro** e ver o que ele preencheu sobre si, além do que a lista mostra: telefone, bio, redes,
   quando entrou, quando entrou pela última vez, e se ele recebe os e-mails do produto — com o motivo,
   quando não recebe.
3. **Escrever um e-mail para ele**, dali, sem passar pela tela de campanha.

O par desta spec no backend é a **015**, e as duas entram juntas: o contrato de `GET /admin/users` muda.

---

## Numeração
Os números são iguais nos dois repositórios: 013 é Meu Perfil, 014 é Disparo de E-mails, 015 é esta.

---

## Dependência de ordem
A Fase 04 (e-mail direto) e parte do detalhe dependem da spec **014** no código, e as redes sociais do
detalhe dependem da **013** — nenhuma das duas subiu ainda. As Fases 01 a 03 não dependem de nenhuma e
podem entrar antes. Está escrito na primeira linha do `tasks.md`.

---

## Uma fronteira, antes das decisões
O detalhe do membro mostra telefone, bio e redes sociais de outra pessoa. **Isto não é o "perfil público de
membro" que a spec 013 adiou.**

A decisão 13 da 013 é sobre uma coisa específica e continua adiada e intacta: **membro vendo membro**. Não
existe `/dashboard/perfil/:id`, não existe lista de membros para quem estuda, e nenhuma rede social passa a
ser vista por outro aluno. O que esta spec cria é o admin vendo o cadastro — atrás de `adminGuard` na tela e
de `AdminGuard` em toda requisição.

A diferença não é formalidade: é a razão de o telefone só existir dentro do detalhe (decisão 9) e de não
haver exportação, nem lista com telefone na linha, nem nada que transforme "ver uma pessoa" em "ter a base".

---

## Decisões

### 1. A mesma tela cresce, e nenhuma rota nova aparece
`/dashboard/admin/usuarios` continua sendo a única rota. Busca e filtros no topo, lista no meio, e o membro
abre num diálogo **por cima da lista** — sem `/usuarios/:id`.

Uma sub-rota de detalhe seria linkável e sobreviveria ao F5, e custaria o que importa mais: voltar do
detalhe teria que restaurar o recorte, a rolagem e a página em que o admin estava. O diálogo não perde nada
disso porque nunca sai da tela — e o que precisava mesmo sobreviver ao F5 é o recorte, que a decisão 3
resolve por outro caminho.

### 2. O recorte é o trabalho, e ele vai para a URL
Busca e filtros viram query da rota: `?q=&onboarding=&tiers=&gradeMin=&gradeMax=`. F5 mantém o recorte,
"voltar" desfaz o último, e um recorte pode ser colado num chat.

É a única tela do painel onde o estado da tela **é trabalho** — em todas as outras, recarregar não perde
nada porque não havia nada montado. Aqui o admin combina quatro controles para chegar a doze pessoas, e um
F5 acidental hoje o devolve ao começo.

**A busca escreve na URL com `replaceUrl: true`.** Sem isso, cada tecla vira uma entrada no histórico e o
botão "voltar" caminha letra por letra até a tela ficar irrecuperável — é o defeito clássico de filtro na
URL, e ele só aparece depois de a tela estar pronta.

### 3. A busca espera 400ms, e a última resposta vence
`debounceTime(400)` mais `switchMap`, exatamente como a contagem de audiência da spec 014.

Os dois números importam. O atraso existe porque **cada requisição varre a base inteira no backend**
(decisão 4 de lá): sem ele, "borges" são seis varreduras. O `switchMap` existe porque duas respostas fora de
ordem deixam na tela o resultado de uma busca que o admin já abandonou — e ele não tem como saber que a
lista não corresponde ao que está escrito no campo.

### 4. Nenhum filtro marcado significa **todos**, e a tela escreve isso
Com os filtros vazios, o rótulo do recorte é **"Todos os membros"**, com as mesmas palavras da tela de
e-mails.

É a mesma inversão que a decisão 4 da spec 014 protegeu, e ela é perigosa nos dois lugares por razões
diferentes: lá, um estado vazio lido como "ninguém" não dispararia nada; aqui, um estado vazio lido como
"ninguém" mostraria uma lista vazia e faria o admin achar que a base sumiu.

### 5. Os filtros são os mesmos da tela de e-mails, com as mesmas palavras
Tiers em caixas, faixa de insígnia em dois seletores de 0 a 13 — **os mesmos rótulos, na mesma ordem, com o
mesmo vocabulário** da spec 014. O que esta tela tem a mais é "Onboarding pendente", que a de e-mails não
tem porque quem não terminou o onboarding não é audiência de campanha.

O ganho é prático: o admin recorta aqui, vê quem são as pessoas, e monta o mesmo recorte lá com a certeza de
que o número vai bater. Dois vocabulários para o mesmo filtro é como ele deixa de confiar nos dois.

**E não existe botão "enviar e-mail para este recorte".** É a integração mais óbvia entre as duas telas e é
a que a spec recusa: a tela de e-mails põe a contagem, a prévia, o teste obrigatório e o diálogo entre o
admin e um disparo irreversível, e um atalho daqui pularia os quatro. Quem quiser disparar para um recorte
atravessa a Administração e digita o recorte lá — e os poucos segundos disso são a fricção certa.

### 6. A contagem fica visível sempre, e ela diz que é do recorte
No topo da lista: **"213 membros"** sem filtro, e **"12 de 213 membros"** com filtro — nunca só um número
solto.

O "Carregar mais" de hoje não consegue dizer nenhum dos dois, porque o `pageToken` do Auth é opaco e não
carrega total. Agora o backend devolve `total` (decisão 2 de lá), e a primeira coisa a fazer com ele é
impedir a leitura errada: um número grande sozinho na tela é lido como o tamanho da comunidade, e com um
filtro ligado ele não é.

O "Carregar mais" fica, e passa a saber o que falta: **"Carregar mais (163 restantes)"**.

### 7. Lista vazia com recorte não é lista vazia
| Situação | O que a tela diz |
|---|---|
| Recorte sem resultado | **"Nenhum membro com esse recorte"**, e um botão **"Limpar filtros"** |
| Base sem ninguém | O texto de hoje, sobre ainda não haver cadastros |
| Falha na requisição | O que a tela já faz, incluindo a mensagem própria do 403 |

Os dois primeiros parecem o mesmo estado e são opostos: um significa "ajuste o filtro" e o outro significa
"não há nada". A tela de hoje só tem o segundo, e depois desta spec ele passa a ser o caso raro.

A mensagem de 403 **não muda**: a claim de admin só vale no próximo token, e o texto que manda sair e entrar
de novo continua sendo a resposta certa.

### 8. O selo "Onboarding pendente" vira filtro, e o selo fica
A lista já marca essa pessoa, e o comentário no template já diz por quê: *"a pessoa criou conta e parou. Ela
não pode sumir da lista nem parecer um registro quebrado."*

O filtro nasce do que a tela já dizia — é o caso de uso que o selo vinha anunciando desde a spec 009 sem ter
como ser exercido. O selo continua na linha porque, sem filtro ligado, ele é a única forma de a pessoa se
destacar no meio da lista.

### 9. O detalhe busca os próprios dados, e telefone e bio não trafegam na lista
Abrir um membro dispara `GET /admin/users/:id`. Telefone, bio, LinkedIn, Instagram, o motivo do descadastro
e as datas do perfil **não vêm na listagem** — é decisão da API (decisão 8 de lá), e a tela não tenta
contorná-la guardando o que já teria.

Enquanto a requisição não volta, o diálogo abre com o que a linha já sabia — nome, e-mail, tier, etapa — e o
resto entra em esqueleto. Abrir vazio e preencher depois faz o clique parecer que falhou.

Se a requisição falhar, o diálogo mostra o erro **dentro dele** e um "Tentar de novo", sem fechar: fechar
sozinho parece que o clique não pegou, e o admin clica de novo.

### 10. As duas edições mudam de lugar e não mudam de nada
`grade` e `tier` continuam em blocos separados, com rótulos separados, com **um botão cada** e **uma
requisição cada**. Só passam a viver dentro do detalhe, em vez de num diálogo próprio.

O comentário que está hoje no template continua valendo palavra por palavra e vai junto: *encostados sem
explicação, `tier` e `grade` viram a mesma coisa na cabeça de quem clica — e a spec 008 inteira depende de
não virarem*. Mudar de lugar é a única mudança permitida aqui; juntar os dois num "Salvar" só seria desfazer
uma garantia de duas specs de carona numa spec de busca.

### 11. O detalhe diz quem não recebe e-mail — **e diz por quê**
Uma linha de estado: **"Recebe os e-mails da Liga Dev"** ou **"Não recebe e-mails"**, e quando não recebe, o
motivo e a data: *descadastrou-se*, *o provedor recusou o endereço* (bounce), ou *marcou como spam*.

**Isto é o oposto do que a decisão 12 da spec 014 fez em Meu Perfil**, e a diferença é quem está lendo. Para
o membro, "seu provedor recusou nossos e-mails" é uma frase que não o ajuda a fazer nada — por isso lá o
interruptor aparece desligado e a tela cala. Para o admin, é a única informação que explica o "não chegou
para o fulano", e ele é quem pode agir: conferir o endereço, falar com a pessoa por outro caminho, corrigir.

É metade do ponto em aberto 3 da spec 014 resolvido: quem foi descadastrado por bounce continua sem saber,
mas agora existe alguém que sabe.

### 12. O e-mail direto é um diálogo dentro do detalhe, e não a tela de campanha
Um botão **"Escrever e-mail"** no detalhe abre um diálogo com dois campos: assunto e corpo. Sem filtros, sem
contagem, sem prévia, sem botão de ação no e-mail.

Reusar `/dashboard/admin/emails` para uma pessoa obrigaria aquela tela a ganhar um modo — "para quem: um
membro" — e o modo estragaria a tela que mais depende de não ter modos. **O que é compartilhado é o que
importa e está no backend**: o mesmo caminho de envio, o mesmo template, o mesmo rodapé de descadastro
(decisões 10 e 13 de lá). A tela é a parte barata.

Sem prévia porque o template é o mesmo de sempre e o admin já o viu; sem botão de ação porque um recado para
uma pessoa não tem para onde apontar, e o único botão que existiria seria "clique aqui".

### 13. Sem teste obrigatório — e a exceção tem nome
A decisão 5 da spec 014 trava o disparo até um teste ter sido enviado. **Aqui não trava**, e a exceção está
nomeada.

O que aquela decisão protege é o tamanho: *o link quebrado, o "Olá {nome}" que não foi substituído e a frase
cortada indo para a base inteira*. O erro é o mesmo; a consequência não é. Um recado com um erro de digitação
chega a uma pessoa que conhece o remetente e pode responder — o `Reply-To` vai para o Leno. Exigir um envio
de teste para depois mandar para um destinatário é atrito que não compra nada, e atrito que não compra nada
é o que ensina a clicar sem ler nos lugares onde ele compra.

### 14. O botão diz o endereço, e não há segundo diálogo
O botão de envio é **"Enviar para membro@email.com"**, nunca "Enviar". E ele envia direto, sem
`confirm-dialog` por cima.

É o eco da decisão 4 da spec 014 — *o botão diz o número* — com a mesma lógica aplicada a um destinatário: a
informação que decide o clique fica dentro do botão. Lá ela precisa de um diálogo repetindo o número porque
o número é grande e abstrato; aqui o destinatário é um endereço que o admin está lendo na tela desde que
abriu o detalhe. Um diálogo perguntando "tem certeza?" sobre uma pessoa nomeada é a interface duvidando de
uma decisão que não tem ambiguidade.

Enquanto envia: campos desabilitados e o botão em **"Enviando…"**. Ao terminar, o diálogo fecha e o detalhe
mostra **"E-mail enviado"** por alguns segundos.

### 15. Quem não pode receber tem o botão desabilitado, com a frase escrita ao lado
Se o membro está desativado, sem e-mail verificado, ou descadastrado, o **"Escrever e-mail" nasce
desabilitado** e ao lado dele fica o motivo, em uma linha:

| Motivo | O que a tela diz |
|---|---|
| `descadastrado` | "Esse membro pediu para não receber e-mails." |
| `email-nao-verificado` | "O e-mail dele ainda não foi confirmado." |
| `desativado` | "A conta está desativada." |

O backend recusa de qualquer forma, com `422` (decisão 12 de lá). Deixar o botão ligado e mostrar o erro
depois faria o admin escrever um recado inteiro para descobrir no fim que ele não sai — e a informação que
faltava estava na tela o tempo todo.

O `422` continua tratado, para o caso raro de o estado mudar entre abrir o detalhe e clicar. Ele mostra o
mesmo texto da tabela, escolhido pelo `reason` que vem no corpo, **e nunca por leitura da mensagem** — texto
de erro não é contrato.

### 16. Mobile, e os filtros começam fechados
Os cinco controles empilhados no celular ocupariam a tela inteira antes da primeira linha da lista. Eles
entram num `details` fechado, com o rótulo **"Filtros"** e a contagem de quantos estão ativos:
**"Filtros (2)"**.

O campo de busca **fica sempre visível**, fora do `details`: é o controle que resolve a maior parte dos
casos e não pode custar um toque a mais. Alvos de 44px, e o diálogo do membro rola por dentro em vez de
esticar a página.

### 17. Vocabulário

| Termo | Uso |
|---|---|
| **Membros** | a contagem e os textos de estado. Nunca "usuários" nem "contatos" na contagem — o título da tela continua "Usuários cadastrados" |
| **Buscar por nome ou e-mail** | o rótulo do campo de busca, literal |
| **Filtros** | o rótulo do bloco, e **"Filtros (2)"** quando há filtros ativos |
| **Onboarding pendente** | o selo que já existe e o rótulo do filtro. As mesmas palavras nos dois |
| **Todos os membros** | o rótulo de quando nenhum filtro está marcado |
| **12 de 213 membros** | a contagem com recorte. Sem recorte, só **"213 membros"** |
| **Nenhum membro com esse recorte** | o vazio com filtro, ao lado de **"Limpar filtros"** |
| **Carregar mais (163 restantes)** | o botão de paginação, agora com o número |
| **Escrever e-mail** | o botão do detalhe, literal |
| **Enviar para membro@email.com** | o botão do diálogo, com o endereço dentro |
| **Não recebe e-mails** | o estado no detalhe, seguido do motivo |

---

## Rotas

| Rota | O que muda |
|---|---|
| `/dashboard/admin/usuarios` | Ganha busca, filtros, contagem, detalhe do membro e e-mail direto. **Passa a aceitar query de recorte** (decisão 2) |
| `/dashboard/admin` | **Não muda.** Continua com os quatro cartões que a spec 014 deixou |

Nenhuma rota nova. O `dashboard-aside` não muda: a Administração inteira continua entrando por uma porta só.

---

## Contrato que muda

`GET /admin/users` é reescrito pela spec 015 do backend, e o front precisa mudar junto:

| Antes | Depois |
|---|---|
| `nextPageToken` opaco do Auth | `total`, `offset`, `limit` |
| Sem filtro nem busca | `q`, `onboarding`, `tiers`, `gradeMin`, `gradeMax` |
| `phone` na linha | `phone` só em `GET /admin/users/:id` |
| Sem `tier` na linha (apesar de o modelo declarar) | `tier` na linha, enfim |

A última é conserto. O `AdminUser` do front declara `tier: TierId` desde a spec 010 e a API nunca devolveu o
campo: o seletor de tier do editor abre em branco hoje, e o admin escolhe às cegas. **Depois desta spec o
`tier` também vira etiqueta na linha**, porque filtrar por um campo que a linha não mostra é uma tela que
mente.

---

## Fora de escopo

- **Enviar campanha para o recorte da lista** (decisão 5).
- **Desativar, excluir ou promover membro pela tela.** Nenhum tem endpoint atrás, e os três foram recusados
  com argumento: promover é script de terminal (spec 009), excluir conta de terceiros é a decisão 11 da spec
  013, e desativar é moderação com pergunta própria.
- **Exportar a lista em CSV.** Um arquivo com dado pessoal da base inteira, saindo por um clique. É a
  operação que transforma "ver uma pessoa" em "ter a base", e é o oposto da fronteira que abre esta spec.
- **Histórico de e-mails enviados para aquele membro.** É a próxima pergunta que o detalhe vai provocar, e
  ela é barata no backend (a spec 015 de lá registra que não exige índice novo). Fica fora porque é uma
  seção a mais num diálogo que já ganhou quatro nesta spec.
- **Ver e moderar as perguntas do membro pelo detalhe.** A moderação tem tela e tem spec (010).
- **Notas do admin sobre um membro.** É um CRM.
- **Ordenar a lista por outra coisa.** Mais recentes primeiro, e a busca responde melhor o que um seletor de
  ordenação responderia.
- **Seleção múltipla e ação em lote.** Caixas de seleção numa lista de pessoas existem para fazer alguma
  coisa com várias de uma vez — e as duas candidatas óbvias são disparar e-mail (decisão 5) e excluir (fora
  de escopo).
- **Sub-rota de detalhe e link direto para um membro** (decisão 1).

---

## Specs afetadas

### Spec 009 (Financeiro, Administração e Trilha) — vigente, com a tela reescrita
A lista de usuários é dela, e o comentário que explica o selo de onboarding pendente continua valendo e vira
filtro (decisão 8). O que muda é a paginação: "Carregar mais" fica, mas passa a saber quantos faltam.

O índice da Administração **não muda** — nenhum cartão novo, porque nada aqui é uma porta nova: é a porta
"Usuários" fazendo o que ela sempre prometeu.

### Spec 010 (Mural de Perguntas) — vigente, com um esquecimento consertado
Ela criou a edição de `tier` no editor da lista e o campo nunca chegou pela API. O conserto está no
contrato acima, e a garantia que ela escreveu — `tier` e `grade` em requisições separadas — continua
inteira dentro do detalhe (decisão 10).

### Spec 013 (Meu Perfil) — vigente, com a fronteira reafirmada
A decisão 13 de lá — *não existe perfil de terceiros, sem lista de membros, sem visualização pública* — **é
sobre membro vendo membro e continua valendo**. Nada nesta spec cria tela de membro para aluno, e as redes
sociais continuam invisíveis para quem não é admin. É o que a seção "Uma fronteira" diz, e está escrito
antes das decisões porque é a leitura errada mais fácil de fazer desta spec.

### Spec 014 (Disparo de E-mails) — vigente, com uma exceção nomeada
A decisão 5 de lá — teste obrigatório antes do disparo — **não se aplica ao e-mail direto**, e a decisão 13
daqui explica a diferença (o que aquela decisão protege é o tamanho da audiência).

A decisão 12 de lá — Meu Perfil não explica por que o interruptor está desligado — **continua valendo como
está escrita**. O detalhe do admin explica (decisão 11), e a diferença é quem lê e quem pode agir.

O restante entra intacto: mesmo caminho de envio, mesmo template, mesmo rodapé de descadastro. A tela de
e-mails **não muda em nada** nesta spec.

### Spec 011 (Sessão que Sobrevive ao F5) — vigente
O recorte na URL (decisão 2) é lido da rota na inicialização, e a tela está atrás de `adminGuard`: ela nunca
roda antes de a sessão estar resolvida. Nada aqui depende de ordem de inicialização do `AuthStore`.

---

## Pontos em aberto

1. **Cada busca varre a base inteira no backend.** O atraso de 400ms é a única contenção que existe
   (decisão 3), e ela é do front. O sinal de que passou do ponto é a lista demorar visivelmente com o admin
   digitando — e quando isso acontecer, o conserto é de lá, não um atraso maior daqui.
2. **A busca não perdoa erro de digitação nem palavra fora de ordem.** "Jose Borges" não acha "José da Silva
   Borges", porque a comparação é um `contains` de uma string só. É a primeira coisa que vai incomodar num
   uso real, e o conserto é do backend.
3. **A faixa de insígnia é faixa, e faixa não é "quem tem a insígnia 5".** É o ponto em aberto 5 da spec 014,
   inteiro, e agora ele aparece em duas telas com o mesmo controle. Se a tradução tiver que existir, ela
   passa a ter que existir nas duas — o que é argumento para fazê-la uma vez, num componente.
4. **O detalhe é uma requisição por clique.** Abrir cinco membros são cinco requisições, e não há cache de
   nenhum lado. É barato hoje e está escrito porque a solução preguiçosa — devolver tudo na listagem — é
   exatamente a decisão 9 desfeita.
5. **O e-mail direto carrega o rodapé de descadastro, e o descadastro é absoluto.** Quem se descadastra a
   partir de um recado pessoal para de receber **tudo**, inclusive o aviso de vídeo novo. É o preço de a
   regra da spec 014 não ter exceção, e a alternativa — preferência por tipo de e-mail — aquela spec recusou
   com argumento. Fica anotado para quando alguém perguntar por que "sumiu da lista depois daquele e-mail".
6. **Um segundo administrador muda o cálculo desta tela.** Tudo aqui pressupõe uma pessoa olhando dados de
   membros, sem registro de quem olhou o quê. Com dois, a pergunta de auditoria deixa de ser teórica — e é
   spec própria, nos dois repositórios.
