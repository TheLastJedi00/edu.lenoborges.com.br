# Spec 014: Disparo de E-mails

## Objetivo
A spec 012 pôs um sino no painel, e o sino tem um limite que ela própria escreveu: ele **só existe com o
painel aberto**. Quem não entra nesta semana não fica sabendo do vídeo desta semana — e quem não entra é
justamente quem o aviso precisava alcançar.

Esta spec dá ao produto o primeiro canal que chega em quem está fora dele. Do lado do front são **três
coisas visíveis**:

1. Uma quarta porta na Administração: **escrever um e-mail e disparar** para todo mundo ou para um recorte
   por tier e por insígnia, com a contagem na frente e a confirmação no caminho.
2. Uma **página pública de descadastro**, que funciona sem sessão, porque é aonde o rodapé de todo e-mail
   leva.
3. Um **interruptor** em Meu Perfil, para religar ou desligar o recebimento sem depender do link.

O disparo automático — vídeo novo publicado vira e-mail — não tem tela: ele acontece no gatilho que já
existe. O que ele ganha aqui é **um aviso na tela de publicar**, porque a partir desta spec aquele botão
manda mensagem para fora do produto.

O par desta spec no backend é a **014**, e as duas entram juntas.

---

## Numeração
Os números são iguais nos dois repositórios: 012 é Notificações Internas, 013 é Meu Perfil, 014 é esta.

---

## Uma ressalva, antes das decisões
Esta é a primeira tela do produto cuja ação **não tem desfazer de espécie nenhuma**. Vídeo publicado se
apaga, pergunta moderada se restaura pela mão do admin, `grade` errado se corrige na linha de cima. E-mail
que saiu está na caixa de entrada de todo mundo, com o nome do produto em cima, e não há botão nesta
tela nem em nenhuma outra que o traga de volta.

Todo o desenho abaixo é essa frase repetida em forma de interface: a contagem aparece antes, o teste vem
antes do envio, o botão diz o número, e a confirmação diz o número de novo. É atrito **de propósito**, e é
o único lugar do produto onde atrito é a decisão certa.

---

## Decisões

### 1. A Administração ganha a quarta porta, e o índice continua sendo só o índice
`/dashboard/admin` ganha um quarto cartão, **E-mails**, ao lado de Usuários, Mural e Conteúdo da trilha.
Nada mais muda ali.

O comentário do `admin.page.ts` diz que o índice existe para não empilhar administração num menu lateral
que é do aluno, e ele continua certo com quatro cartões pelo mesmo motivo que estava certo com três.
**O item não vai para o `dashboard-aside`**: o aside é a navegação de quem estuda, e a Administração
inteira entra por uma porta só.

### 2. Uma tela, três blocos, e o histórico embaixo
`/dashboard/admin/emails`, sem sub-rota. De cima para baixo:

| Bloco | O que tem |
|---|---|
| **Escrever** | Assunto, corpo, e o botão opcional (rótulo + endereço) |
| **Para quem** | Os quatro tiers em caixas, a faixa de insígnia, e a contagem viva |
| **Conferir e enviar** | A prévia do e-mail, "Enviar teste para mim" e o botão de disparo |
| **Enviados** | As últimas campanhas: assunto, quando, para quantos, e o estado |

Uma tela com um `/novo` seria o desenho de um produto de e-mail marketing, com rascunho, lista e edição. A
spec não tem rascunho (decisão 10) e não tem edição — e uma sub-rota que só serve para hospedar um
formulário que sempre nasce vazio é rota inventada.

### 3. O corpo é um `textarea`, e nunca um editor rico
Texto simples, com quebras de linha preservadas. Sem negrito, sem lista, sem imagem, sem HTML colado.

O backend recusa HTML do admin (decisão 11 de lá) e o front não pode oferecer o que o backend recusa. E a
recusa é boa: o e-mail sai com o template do código, que já está diagramado; um editor rico só permitiria
o admin desmanchar essa diagramação, num cliente de e-mail que ele não vai ver antes de mandar.

O botão opcional é a única formatação que existe, e ele existe porque "clique aqui" no meio do texto vira
um link cru feio na maioria dos clientes.

### 4. A contagem aparece antes de qualquer coisa, e o botão repete o número
Mudar um filtro recalcula a audiência (`POST /admin/emails/audiencia`, com atraso de ~400ms para não
disparar a cada tecla). O resultado aparece como **"42 membros vão receber"** — e o botão de envio diz
**"Enviar para 42 pessoas"**, nunca só "Enviar".

Um botão que diz "Enviar" esconde a única informação que importa no instante da decisão. Repetir o número
no botão custa nada e transforma o clique em uma leitura: quem esperava disparar para três pessoas e lê
"Enviar para 118" para o dedo — que é exatamente o acidente que esta tela precisa impedir.

Nenhum filtro marcado significa **todos os membros**, e a tela escreve isso com essas palavras. Um estado
vazio que silenciosamente significa "todo mundo" é o pior padrão possível numa tela de disparo.

### 5. O teste vem antes do envio, e destrava o botão
"Enviar teste para mim" manda o e-mail montado para o próprio admin. **O botão de disparo real fica
desabilitado até um teste ter sido enviado**, e volta a travar assim que o assunto, o corpo ou o botão
mudam.

É a decisão mais impositiva da spec e ela é deliberada: o custo é um clique e trinta segundos olhando a
caixa de entrada; o que ela evita é o link quebrado, o "Olá {nome}" que não foi substituído e a frase
cortada indo para a base inteira. O destravamento morrer a cada edição é o ponto — testar uma versão e
enviar outra é o mesmo que não ter testado.

A audiência **não** trava o botão: mudar filtro não invalida o teste, porque o conteúdo é o mesmo.

### 6. Confirmar é diálogo, e o diálogo repete o número
O disparo abre o `confirm-dialog` que já existe, com o assunto e a contagem dentro, e o botão final diz
**"Enviar para 42 pessoas"**. `Esc` e clique fora cancelam, como em todo diálogo do sistema.

O mesmo componente do "excluir vídeo" e do "moderar pergunta" serve aqui, e serve melhor: aquelas duas
ações são reversíveis pela mão do admin, e esta não é. Se um dia o diálogo ganhar um grau a mais de
fricção — digitar o número, por exemplo —, é aqui que ele ganha, e não lá.

### 7. Enquanto envia, a tela fica travada e diz o que está acontecendo
Durante a requisição: formulário desabilitado, o botão vira **"Enviando…"**, e nada mais na tela aceita
clique. Ao terminar, o resultado aparece como uma linha nova no histórico, no topo, com uma entrada curta.

Nada de barra de progresso: o backend envia dentro de uma requisição só (decisão 15 de lá) e não há
progresso para ler. Inventar uma barra animada que não representa nada é mentira de interface, e a mentira
aparece justamente quando o envio demora — o momento em que a pessoa mais está olhando.

### 8. Requisição que cai não é campanha perdida, e a tela diz isso
Se a requisição falhar por rede ou por tempo, a tela **não** diz "não foi enviado". Ela diz que **o envio
começou e pode ter sido interrompido**, e manda olhar o histórico.

É a verdade: o backend gravou a campanha antes do primeiro lote e guarda onde parou. Uma campanha
`interrompida` no histórico ganha um botão **"Retomar"**, que continua de onde ficou e nunca reenvia do
começo.

O erro genérico de rede ("Não foi possível enviar, tente de novo") seria o texto natural e seria o pior
possível aqui: quem lê "não foi enviado" clica de novo, e a segunda tentativa manda tudo outra vez para
quem já recebeu.

### 9. O histórico é lista curta, e não abre nada
As 20 campanhas mais recentes (`GET /admin/emails`): assunto, data, para quantos, estado, e o "Retomar"
quando cabe. **Nenhuma linha é clicável** e não existe tela de detalhe da campanha.

O corpo do e-mail enviado não volta na listagem, por decisão do backend, e não deveria voltar: quem quer
ver o que foi enviado tem a própria caixa de entrada, porque o admin sempre recebe o teste (decisão 5).

### 10. Não existe rascunho, e sair da tela perde o que estava escrito
Sem `localStorage`, sem "salvar rascunho", sem aviso de "você tem alterações não salvas".

É o custo aceito de a tela ser um formulário e não um produto. Um disparo por mês não sustenta gestão de
rascunho, e o aviso de saída seria um diálogo por engano toda vez que o admin abre a tela para consultar
o histórico e fecha.

### 11. A página de descadastro é pública, fora da casca, e resolve sozinha
`/descadastro?token=…`, sem `authGuard`, sem `dashboard-shell` e sem menu. Uma frase, um estado de
sucesso, e um link para a landing.

Ela precisa funcionar para quem **não está logado, nunca esteve nesse navegador, e está lendo o e-mail no
celular do trabalho**. Qualquer coisa que peça sessão nessa tela empurra a pessoa para o botão de spam do
cliente de e-mail, que é o único caminho mais caro que o descadastro.

A página chama o endpoint na inicialização e mostra o resultado — **não pede confirmação**. Quem clicou em
"descadastrar" no rodapé de um e-mail já confirmou; um segundo botão ali é a interface duvidando de uma
decisão que não é dela. O caminho de volta existe e está escrito na própria tela: religar em Meu Perfil.

Token inválido **mostra a mesma tela de sucesso** — é o que o backend responde (204 sempre), e é
deliberado dos dois lados.

### 12. Em Meu Perfil, um interruptor — e ele salva sozinho
Uma seção nova em `/dashboard/perfil`, **E-mails**, entre "Acesso" e "Excluir conta", com uma linha:
**"Receber e-mails da Liga Dev"**, um interruptor, e uma frase dizendo o que chega (avisos de vídeo novo e
recados da comunidade).

**Isto abre exceção à decisão 2 da spec 013** — "salvar é um botão, e a tela não salva sozinha" — e a
exceção está nomeada: aquela decisão governa **um formulário de campos de texto**, onde salvar junto é o
que dá sentido a editar três coisas de uma vez. Um interruptor não é formulário: ele tem dois estados, o
gesto já é a decisão, e um botão "Salvar" ao lado de um switch é a interface pedindo confirmação de um
clique que não tem ambiguidade.

O salvamento é otimista, com reversão na falha — o mesmo desenho do voto do Mural e do check da
notificação, e pela mesma razão.

Quem foi descadastrado por bounce ou reclamação vê o interruptor desligado e **pode religar**. A tela não
explica por que estava desligado: "seu provedor recusou nossos e-mails" é uma frase que não ajuda ninguém
a fazer nada.

### 13. Publicar vídeo passa a avisar que vai mandar e-mail
`/dashboard/admin/trilha/:badgeId` ganha **uma linha** acima do botão de publicar: *"Publicar envia um
e-mail para a comunidade."* Sem contagem, sem caixa de seleção, sem diálogo extra.

**Isto revoga uma linha da spec 012**, que dizia que a tela do admin não mudaria e não ganharia aviso de
"isto vai notificar N pessoas". Aquele argumento era bom para o sino e não sobrevive ao e-mail: um aviso
dentro do painel é reversível pela indiferença de quem não abre; um e-mail é irreversível para todo mundo.
O que continua valendo da 012 é a forma — **nada de confirmação a cada publicação**: uma frase que se lê
em dois segundos, e não um pedágio diário.

### 14. Erro de audiência não trava a tela
Se `POST /admin/emails/audiencia` falhar, a contagem vira um traço e o botão de envio **desabilita** até
uma contagem válida chegar.

É diferente da decisão 12 da spec 012, onde a falha da notificação não podia virar erro nenhum, e a
diferença é a consequência: lá o pior caso era não ver um aviso; aqui o pior caso é disparar às cegas para
uma audiência que ninguém confirmou. **Quando a informação que falta é o tamanho do estrago, a ausência
dela bloqueia.**

### 15. Mobile primeiro, mesmo sendo tela de admin
A tela é usável no celular: campos em coluna, filtros empilhados, alvos de 44px, e o botão de envio
**nunca** grudado na borda inferior nem fixo na tela.

O admin escreve do computador quase sempre — e o "quase" é o motivo desta decisão existir. O que a régua
proíbe aqui é o botão flutuante: um disparo irreversível não pode ficar no caminho do polegar que rola a
página.

### 16. Vocabulário

| Termo | Uso |
|---|---|
| **E-mails** | o cartão da Administração e o título da tela. Não é "Comunicação" nem "Campanhas" |
| **Escrever** / **Para quem** / **Conferir e enviar** / **Enviados** | os quatro títulos de bloco, literais |
| **42 membros vão receber** | a contagem viva. Sempre "membros", nunca "usuários" nem "contatos" |
| **Enviar para 42 pessoas** | o botão e o botão do diálogo, com o número dentro |
| **Enviar teste para mim** | o botão do teste, literal |
| **Todos os membros** | o rótulo de quando nenhum filtro está marcado |
| **Enviando…** | o botão durante o disparo |
| **Interrompido** / **Retomar** | o estado no histórico e a ação que o resolve |
| **Receber e-mails da Liga Dev** | o rótulo do interruptor em Meu Perfil |
| **Você não vai mais receber nossos e-mails** | o sucesso da página de descadastro |

---

## Rotas

| Rota | O que muda |
|---|---|
| `/dashboard/admin/emails` | **Nova.** Atrás de `adminGuard`, como as outras da Administração |
| `/descadastro` | **Nova, e pública.** Sem guard, sem casca do painel, aceita `?token=` |
| `/dashboard/admin` | Ganha o quarto cartão |
| `/dashboard/admin/trilha/:badgeId` | Ganha a linha de aviso acima de publicar (decisão 13) |
| `/dashboard/perfil` | Ganha a seção **E-mails**, com um interruptor (decisão 12) |

A `/descadastro` é a segunda rota pública com conteúdo do produto, depois de `/comunidade`, e a primeira
que faz uma escrita sem sessão. O `adminGuard` da tela de e-mails é conveniência, como nas outras: quem
impede de verdade é o `AdminGuard` do backend, em toda requisição.

---

## Fora de escopo

- **Editor rico, imagem no corpo e anexo** (decisão 3).
- **Rascunho, modelo salvo e agendamento** (decisão 10). Agendar exige cron no backend, que a spec de lá
  recusou.
- **Tela de detalhe da campanha e reenvio para quem não abriu** (decisão 9). Não existe dado de abertura,
  de propósito: o backend recusou o pixel de rastreio.
- **Métricas na tela** — taxa de abertura, clique, gráfico. Não há de onde tirar.
- **Escolher se aquele vídeo específico manda e-mail.** A tela de publicar avisa, e não negocia
  (decisão 13). Uma caixa "não avisar desta vez" é uma opção que o admin vai errar em algum dos dois
  sentidos.
- **Preferências por tipo de e-mail em Meu Perfil.** Um interruptor, não uma tela — a decisão 12 diz por
  quê, e é a mesma régua que a spec 012 usou para recusar preferências de notificação.
- **Disparo para a lista de espera.** A audiência é de membros. Quem entrou na lista consentiu com o aviso
  de abertura, e nada além.
- **E-mail em outra língua.**
- **Notificação interna de "campanha enviada".** O admin acabou de clicar; ele sabe.

---

## Specs afetadas

### Spec 012 (Notificações Internas) — vigente, com uma linha revogada
O "Fora de escopo" de lá diz *"Push do navegador, **e-mail** e som. Isto é notificação interna: só existe
com o painel aberto."* **A parte do e-mail deixa de valer**; push e som continuam fora.

E a linha da spec 009 que a 012 escreveu — a tela do admin não muda e não ganha aviso de que a publicação
notifica — **é revogada apenas para a tela de publicar vídeo**, pela decisão 13. O sino continua sem aviso
nenhum.

O sino **não muda**: o e-mail é um canal a mais para o mesmo evento, não um substituto. Quem lê o e-mail e
depois entra no painel ainda vê a notificação não lida, e isso é correto — ler no e-mail não é ler no
produto.

### Spec 013 (Meu Perfil) — vigente, com uma exceção nomeada
A tela ganha uma quinta seção. A decisão 2 de lá continua governando os formulários; o interruptor é a
exceção, e a decisão 12 desta spec explica a diferença (decisão 12).

O "Fora de escopo" de lá — *"Preferências de notificação"* — continua valendo: não entra tela de
preferências, entra um interruptor de canal.

### Spec 009 (Financeiro, Administração e Trilha) — vigente, estendida
Quarta porta na Administração (decisão 1) e uma linha nova na tela de publicar vídeo (decisão 13). O
`AdminUser` do modelo ganha `emailOptOut`, e a lista de usuários passa a mostrar quem não recebe — sem
isso, "não chegou para o fulano" vira investigação sem pista.

### Spec 011 (Sessão que Sobrevive ao F5) — vigente
A `/descadastro` é pública e **não pode tentar restaurar sessão**: ela não depende do `AuthStore`, não
espera o refresh e funciona igual para quem está logado e para quem não está.

### Spec 005 (Autenticação e Dashboard) — vigente
O cartão do painel que prometia "preferências de notificações" já teve o texto corrigido pela spec 013.
Ele **continua como está** — o interruptor mora em Meu Perfil, e não vira cartão novo.

---

## Pontos em aberto

1. **O teste obrigatório vai incomodar?** (decisão 5). É a decisão mais impositiva da spec, e escrita para
   uma pessoa que dispara e-mail uma vez por mês. Se o disparo virar semanal, o clique extra vira ritual
   vazio e o destravamento pode passar a ser opcional — mas aí o argumento precisa ser "isto virou
   rotina", não "isto é chato".
2. **O botão diz o número, e o número pode envelhecer entre o cálculo e o clique.** Se alguém entrar na
   comunidade nesse intervalo, a contagem do botão e a do envio diferem em um. Fica aceito: recalcular no
   clique atrasaria a confirmação para corrigir um erro de arredondamento humano.
3. **Quem é descadastrado por bounce não sabe que foi.** A decisão 12 escolheu não explicar, e a
   consequência é que a pessoa reclama que "não recebo os e-mails", religa o interruptor e continua sem
   receber, porque o endereço é que está quebrado. É o caso em que a tela honesta ainda não resolve.
4. **A prévia é aproximada.** O que a tela desenha é o template, não o que o Gmail vai renderizar — e a
   diferença entre os dois é justamente o motivo de o teste existir. Se a prévia começar a ser confundida
   com garantia, o caminho é enfraquecê-la, e não melhorá-la.
5. **Filtro por insígnia é faixa, e faixa não é o mesmo que "quem tem a insígnia 5".** `grade` conta
   etapas concluídas, então "de 3 a 8" é "quem está entre a terceira e a oitava". Está escrito como faixa
   por ser o que a estrutura já suporta; se o admin pensar em "quem conquistou X", a tradução é dele — e
   essa é a fresta a observar no primeiro uso real.
