# Seita Dev · Front-End (eduleno-front)

Aplicação web e plataforma de membros da **Seita Dev**, desenvolvida com Angular 20+, Zoneless Change Detection e Signals.

## Tecnologias e Arquitetura

- **Framework**: Angular 20+ (Zoneless, Signals, Standalone Components)
- **Autenticação**: Tokens JWT mantidos estritamente em memória no `AuthStore`. Refresh silencioso via cookie `HttpOnly` gerenciado pelo backend, sem persistência de credenciais em `localStorage` ou `sessionStorage`.
- **Estilização**: SCSS com tokens de design system (`--ink`, `--paper`, `--accent-deep`, `--radius-lg`, gradientes suaves e animações pixel-art).
- **Acessibilidade**: Elementos nativos `<dialog>`, foco gerenciado, navegação por teclado e suporte a `prefers-reduced-motion`.

## Rotas da Aplicação

| Rota | Descrição | Acesso | Guards |
| :--- | :--- | :--- | :--- |
| `/` | Landing page institucional e serviços de aulas | Pública | - |
| `/comunidade` | Apresentação da Seita Dev e lista de espera | Pública | - |
| `/acesso` | Definição de senha e ações de e-mail pelo link do Firebase (`?mode=…&oobCode=…`) | **Pública** | — |
| `/completar-perfil` | Onboarding obrigatório de novos membros (nome, telefone, bio) | Protegida | `authGuard`, `onboardingPendingGuard` |
| `/dashboard` | Painel do membro com trilha, grupo e ranking | Protegida | `authGuard`, `profileCompleteGuard` |
| `/dashboard/perfil` | Meu Perfil: dados, redes, e-mail, senha, recebimento de e-mails e exclusão de conta | Protegida | `authGuard`, `profileCompleteGuard`, `unsavedChangesGuard` (saída) |
| `/dashboard/admin/emails` | Escrever e disparar e-mail para a comunidade | Protegida | `adminGuard` |
| `/descadastro` | Sair da lista de e-mails pelo link do rodapé | **Pública** | — |
| `/termos-de-uso` | Termos de Uso, para ler antes de ter conta | **Pública** | — |
| `/politica-de-privacidade` | Política de Privacidade | **Pública** | — |

## Notificações Internas (spec 012)

Um sino no painel avisa sobre **dois eventos**: vídeo novo numa insígnia e pergunta nova no Mural. Com
não lidas ele balança por 700ms a cada 8s, com um brilho laranja no mesmo compasso; ao toque, um painel
desce por cima do conteúdo com a lista, e cada linha abre um modal que leva à trilha da insígnia ou ao
Mural com as perguntas mais recentes em cima.

Três coisas que valem saber antes de mexer:

- **O sino vive em dois lugares.** A barra de cabeçalho do painel só existe no celular, então no desktop
  ele mora no topo do menu lateral — e continua visível com o menu recolhido.
- **Não há polling e não há tempo real.** A lista é buscada na abertura do painel e a cada vez que o
  sino abre. A notificação chega na próxima vez que a pessoa abre o painel, e isso é uma frase honesta.
- **Não há histórico.** O painel mostra só as não lidas, e o que é marcado some para sempre. Por isso
  abrir o painel **não** marca nada: quem marca é abrir o modal, o check da linha, ou "Marcar todas
  como lidas".

Falhar ao carregar deixa o sino parado e não vira erro de tela: o painel funciona inteiro sem ele.

## Meu Perfil (spec 013)

Uma tela, quatro seções, nenhuma sub-rota: **Seus dados** (nome, telefone, bio), **Suas redes**
(LinkedIn e Instagram, opcionais), **Acesso** (trocar de e-mail, trocar de senha) e **Excluir conta**.

Três coisas que valem saber antes de mexer:

- **A tela não salva sozinha.** Sem autosave e sem salvar ao sair do campo: autosave em campo de texto
  livre grava a bio pela metade toda vez que alguém para de digitar para pensar, e o `PATCH`
  sobrescreve sem desfazer. Sair com alteração não salva abre um diálogo — e a comparação é contra o
  valor **normalizado**, senão apagar um espaço no fim da bio dispara o aviso.
- **As redes aceitam `@fulano`, `fulano` ou a URL inteira**, e o campo mostra no que o texto virou
  assim que perde o foco. O que vai para a API é sempre a URL completa. Domínio errado é **recusado, não
  "consertado"**: virar `linkedin.com/in/evil.com/fulano` geraria um link plausível para um perfil que
  não existe.
- **Trocar o e-mail não troca o e-mail.** A resposta é `202` e a confirmação vai para o endereço
  **novo**; quem troca é o Firebase, no clique do link. Por isso o e-mail exibido na tela **não muda de
  valor** — mudá-lo antes seria mentir, e a mentira só apareceria no próximo login, falhando.

**Trocar a senha encerra a sessão**, em todos os aparelhos. O aviso é fixo acima do botão e não há
diálogo em cima dele: diálogo sobre aviso ensina a clicar em "Confirmar" sem ler. Depois do `204` a
sessão é limpa e o destino é a landing com `?entrar=1`, que abre o diálogo de login com uma mensagem
explicando o que aconteceu — cair numa tela de login sem contexto é indistinguível de ter sido
deslogado por erro.

### Excluir conta

**É imediato e não tem desfazer.** A seção fica no fim da tela, com borda de atenção e sem vermelho
gritante — o vermelho é do botão final, dentro do diálogo.

| Some para sempre | Fica, sem o seu nome |
|---|---|
| A conta e o acesso | As perguntas escritas no Mural |
| Nome, telefone, bio e redes | |
| Os votos no Mural | |
| O progresso na trilha | |

As perguntas ficam porque outras pessoas votaram nelas e algumas viraram vídeo na trilha; elas passam a
aparecer como **"Membro removido"**. Essa lista é **requisito de consentimento, não texto de apoio**:
"sua conta será excluída" não informa nada sobre a pergunta que virou vídeo. No dia em que uma spec nova
criar uma coleção com dado do membro, esta lista é o segundo lugar a mudar — e é o que ninguém lembra de
abrir.

O diálogo pede a senha, e só. Sem "digite EXCLUIR para confirmar": digitar uma palavra prova atenção,
digitar a senha prova identidade. **O foco inicial é o Cancelar** — é a única tela do produto onde o
botão perigoso não pode estar a um Enter de distância, e é por isso que ela usa o
`delete-account-dialog` e não o `confirm-dialog`, cujo padrão é focar o confirmar.

## Disparo de E-mails (spec 014)

A spec 012 pôs um sino no painel, e o sino tem um limite que ela própria escreveu: ele **só existe com o
painel aberto**. Quem não entra nesta semana não fica sabendo do vídeo desta semana — e quem não entra é
justamente quem o aviso precisava alcançar.

Do lado do front são três coisas visíveis: a tela de **E-mails** na Administração, a página pública de
**descadastro**, e o **interruptor** em Meu Perfil. O disparo automático — vídeo novo vira e-mail — não
tem tela: ele acontece no gatilho que já existe, e o que ele ganha aqui é uma linha de aviso na tela de
publicar.

### A tela é atrito de propósito

**É a primeira tela do produto cuja ação não tem desfazer de espécie nenhuma.** Vídeo publicado se apaga,
pergunta moderada se restaura, `grade` errado se corrige na linha de cima. E-mail que saiu está na caixa
de entrada de todo mundo, com o nome do produto em cima.

Todo o desenho é essa frase repetida em forma de interface:

- **A contagem aparece antes de qualquer coisa.** Mudar um filtro recalcula a audiência, com `debounce` e
  `switchMap` — resposta antiga vencendo a nova aqui significa disparar com o número errado na tela.
- **Nenhum filtro marcado significa "Todos os membros"**, e a tela escreve isso com essas palavras. Um
  estado vazio que silenciosamente significa "todo mundo" é o pior padrão possível numa tela de disparo.
- **O teste vem antes do envio, e destrava o botão.** O disparo real fica desabilitado até um teste ter
  sido enviado, e volta a travar assim que o assunto, o corpo ou o botão mudam — testar uma versão e
  enviar outra é o mesmo que não ter testado. Mudar filtro **não** trava: o conteúdo é o mesmo.
- **O botão diz o número**: "Enviar para 42 pessoas", nunca só "Enviar". Quem esperava disparar para três
  pessoas e lê "Enviar para 118" para o dedo.
- **A confirmação repete o número**, no mesmo `confirm-dialog` do resto do sistema.
- **Falha de audiência bloqueia o envio.** É diferente da spec 012, onde a falha do acessório não podia
  bloquear nada: lá o pior caso era não ver um aviso; aqui é disparar às cegas.

**O corpo é um `textarea`, e nunca um editor rico.** O backend recusa HTML do admin, e o front não pode
oferecer o que o backend recusa — o e-mail sai com o template do código, que já está diagramado.

### O erro que não diz "não enviou"

Se a requisição falhar por rede ou por tempo, a tela **não** diz "não foi enviado". Ela diz que **o envio
começou e pode ter sido interrompido**, e manda olhar o histórico.

É a verdade: o backend gravou a campanha antes do primeiro lote e guarda onde parou. Uma campanha
`interrompida` ganha um botão **Retomar**, que continua de onde ficou e nunca reenvia do começo.

O erro genérico de rede seria o texto natural e seria o pior possível aqui: quem lê "não foi enviado"
clica de novo, e a segunda tentativa manda tudo outra vez para quem já recebeu.

Só recusa completa do servidor — `409`, `400`, `403` — vira mensagem de "não começou". **Status `0` é
conexão que caiu**, e cai no aviso de interrompido: é o caso mais provável de todos, e exatamente aquele
em que a campanha pode estar no meio do caminho.

### `/descadastro`, pública e sem confirmação

`/descadastro?token=…`, **sem guard, fora do `dashboard-shell` e sem menu**. Ela precisa funcionar para
quem não está logado, nunca esteve nesse navegador, e está lendo o e-mail no celular do trabalho — e
**não pode esperar o refresh de sessão**, que é o defeito que só aparece para quem está deslogado, ou
seja, para todo mundo que a usa.

A página chama o endpoint na inicialização e mostra o resultado. **Não pede confirmação**: quem clicou em
"cancelar inscrição" no rodapé de um e-mail já confirmou, e um segundo botão ali é a interface duvidando
de uma decisão que não é dela.

**Token inválido mostra a mesma tela de sucesso**, que é o que a API responde — distinguir seria um
oráculo de `uid`, e é deliberado dos dois lados. E a página fica **fora dos buscadores**: é uma URL com
token na query, e um rastreador que a visitasse descadastraria a pessoa dona daquele token.

### `/acesso`, a tela de senha (spec 020)

> **A tela está pronta e o link do e-mail ainda não chega nela.** Apontar o e-mail para cá depende da
> *action URL* do console do Firebase, e **o Firebase recusa alterá-la** — `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`,
> nos dois projetos, com cinco causas testadas e derrubadas em 2026-08-28 (a medição está no `context.md`
> da spec 020 da API). Até que a API passe a gerar o link pelo Admin SDK, o e-mail continua abrindo a tela
> do Google. A rota funciona com um `oobCode` colado à mão; ninguém cai nela pelo fluxo real.

Ela existiu como `/definir-senha`, morreu quando o link do e-mail passou a levar para a tela hospedada
pelo Google, e voltou. **O que não voltou é o front falando com o Firebase**: o `oobCode` vai para a
nossa API, que fala com o Identity Toolkit — o SDK web do Firebase aqui seria menos código e um segundo
caminho de login instalado ao lado do primeiro, para sempre, por causa de uma tela.

**Uma rota para todos os modos**, porque o console do Firebase tem um campo só: ele manda todo link de
ação para um endereço, com o `mode` na query. O `mode` escolhe qual tela desenhar, e nunca qual operação
a API executa — quem decide isso é o `oobCode`, que carrega o próprio `requestType`.

| `mode` | O que a tela faz |
|---|---|
| `resetPassword` | Formulário de senha nova. É o cadastro **e** o "esqueci minha senha" |
| `verifyAndChangeEmail`, `verifyEmail`, `recoverEmail` | Aplica e confirma. Sem formulário |
| qualquer outro, ou ausente | Tela de link inválido, **sem chamar serviço nenhum** |

Três coisas que a tela faz e que parecem detalhe:

- **O código é conferido antes de o formulário aparecer.** Sem isso, quem clicou num link expirado
  escolhe uma senha, digita duas vezes, submete, e só então descobre que o link morreu. Com isso, ele lê
  a frase antes de gastar o gesto — e vê de qual conta é a senha que está criando.
- **O `oobCode` é lido uma vez e some da barra de endereços**, e vive num signal do componente e em
  nenhum outro lugar. A URL inteira entra no histórico, aparece em print de quem pede ajuda e vaza no
  `Referer`. A página também vai **fora dos buscadores**, como o `/descadastro`.
- **O `continueUrl` da query não é obedecido, é conferido**: se não for do mesmo `origin`, o destino é
  `/?entrar=1`. A query é escrita por quem manda o link, e obedecê-la seria um redirecionamento aberto
  com a marca do produto em cima.

**Definir a senha não loga.** A resposta é `204` sem token, e o sucesso leva a `/?entrar=1`: o front não
recebe material de sessão de nenhum caminho que não seja o login. Quem acabou de criar a senha entra com
ela na hora, o que é, de quebra, a prova de que ela é a senha que a pessoa achou que digitou.

O mínimo de 8 caracteres voltou a existir no front, e **ele é cortesia, não garantia**: quem garante é a
política do projeto no console do Firebase, e a API é que traduz a recusa dela.

> Trocar a senha **estando logado** continua sendo outra coisa: `/dashboard/perfil` › Acesso, por
> `POST /me/password`, com reautenticação pela senha atual. Aquele fluxo não tem `oobCode` e não precisa
> de um — quem está logado já provou identidade.

### A troca de plano está desligada

Os botões "Quero o \<tier\>" do `/dashboard/financeiro` ficam `disabled` com o rótulo **"Em breve"**,
e o aviso "A troca de plano estará disponível em breve." aparece **uma vez, acima da lista** — `disabled`
não é anunciado por leitor de tela, e repetir a frase em quatro cartões é a mesma promessa lida quatro
vezes.

Quem decide é a constante **`TROCA_DE_PLANO_DISPONIVEL`**, no topo de `financeiro.page.ts`. **Uma linha
para religar**: o `onUpgrade` e o `contactHref` continuam lá, com o teste que os exercita chamando o
método direto, porque apagá-los transformaria uma linha numa tarefa.

### O interruptor em Meu Perfil

Uma seção **E-mails** entre "Acesso" e "Excluir conta": um rótulo, um interruptor, e uma frase dizendo o
que chega.

**Ele salva sozinho, e isso é exceção nomeada à decisão 2 da spec 013** — "salvar é um botão, e a tela não
salva sozinha". Aquela decisão governa um formulário de campos de texto, onde salvar junto é o que dá
sentido a editar três coisas de uma vez. Um interruptor não é formulário: ele tem dois estados, o gesto já
é a decisão, e um botão "Salvar" ao lado de um switch é a interface pedindo confirmação de um clique sem
ambiguidade. O salvamento é otimista, com reversão na falha — o mesmo desenho do voto do Mural.

`emailOptOut: true` desenha o interruptor **desligado**. Quem foi descadastrado por bounce vê isso e pode
religar; **a tela não explica por que estava desligado**, e a ausência é deliberada: "seu provedor recusou
nossos e-mails" é uma frase que não ajuda ninguém a fazer nada.

## Termos e Privacidade (spec 018)

O aceite dos dois documentos passou a ser condição para usar o painel. Três lugares e um componente: o
onboarding, o bloqueio do painel para quem já era membro, e a consulta — rodapé da landing e a seção
**Contratos** de Meu Perfil.

### O front não tem opinião sobre versão de documento legal

Título, versão, data e texto vêm de `GET /legal/documents/:id`. Quem diz o que falta aceitar é o
backend, por dois canais: `pendingLegal` no `GET /me` e o corpo do `428`.

A tentação é guardar as versões numa constante daqui e comparar. Ela cria o estado que a spec descreve:
texto novo, número velho, ninguém chamado a aceitar de novo, **nenhum erro em lugar nenhum**. Se o front
souber comparar versões, ele vai comparar errado um dia — e o sintoma é o produto funcionando
perfeitamente sob um contrato que não é mais o contrato.

O front só sabe fazer três coisas: buscar documento, mostrar documento, mandar aceite.

### O `428` é tratado fora do caminho do refresh

No `authInterceptor` o ramo do `428` vem **antes** do de `401`, e a ordem é o ponto: ele não chama
`refresh()`, não limpa a sessão e não navega. Cair no caminho do `401` deslogaria a base inteira no
deploy desta spec — a pior estreia possível para uma feature cujo assunto é confiança. Há teste-trava
para as três coisas.

Os dois canais existem e não é redundância: o `GET /me` avisa **na entrada**, e é por ele que o painel já
nasce bloqueado; o `428` pega a versão publicada **enquanto a pessoa estava com a aba aberta**, que é o
caso que nenhuma checagem de carregamento alcança. Quem traduz `pendingLegal` em bloqueio é o
`AuthService`, num lugar só — duas traduções divergem, e a que fica velha libera o painel de quem não
aceitou.

### Nunca `innerHTML`

`sections` é `{ heading, paragraphs }[]` e a renderização é `@for` sobre `@for`, com interpolação. É a
única forma de garantir que este caminho continue seguro depois que alguém resolver que o texto legal
ficaria melhor em markdown: o dia em que houver um `bypassSecurityTrustHtml` aqui, ele fica — e a fonte
do texto pode deixar de ser uma constante do backend sem que ninguém reveja aquela linha.

### O check não depende de rolar até o fim

O modal rola; o check fica habilitado desde o primeiro instante. Prendê-lo à rolagem prova que uma roda
girou, não que alguém leu — e quebra para leitor de tela, para Ctrl+F e para quem está no celular com um
texto de trinta telas. O que o modal faz, e é o que importa, é **abrir no texto**, e não numa tela de
resumo com um link "leia os termos".

### O bloqueio do painel não é dispensável

`LegalBlockDialog` não fecha no Esc — o `cancel` é prevenido —, não tem botão de fechar, não tem "agora
não" e não fecha no backdrop. **Não reusa o `ConfirmDialog`** de propósito: aquele existe para ser
cancelável, e a "melhoria" mais provável de alguém tentar é devolver o botão de fechar. Um componente
chamado `LegalBlockDialog` cujo `cancel` é `preventDefault` se explica ao ser lido.

O tom é de alerta e não de erro: quem está vendo aquilo não fez nada errado.

### O aceite é gravado no clique do modal

E não no submit do formulário do onboarding: quem aceitou e abandonou o formulário **aceitou**. Há um
caminho de gravação só — `LegalService.accept` —, usado pelo onboarding e pelo bloqueio do painel; um
segundo caminho seria o que esquece um campo no dia em que o terceiro documento entrar.

O `disabled` do submit do onboarding é conveniência. Quem barra de verdade é o `428` do
`PATCH /me/profile` — mesma divisão do `adminGuard`.

### Nada disto encosta no `localStorage`

Um flag local mentiria nas duas direções: navegador limpo faria quem já aceitou aceitar de novo, e —
pior — um flag "aceito" gravado por engano esconderia um pendente real e o bloqueio nunca apareceria. O
aceite é do servidor, e só.


## Vídeos assistidos, XP e o cartão do membro (spec 019)

Três coisas novas na tela: um check **"Já assisti"** abaixo de cada player, o **XP** empilhado sobre o
contador de insígnias no painel, e o **cartão do membro**, que abre ao clicar no nome de quem perguntou
no Mural. E, em Meu Perfil, o interruptor que decide se as redes sociais ficam visíveis para os outros.

### O front não sabe quanto vale um vídeo

O `xp` chega pronto em três lugares — no `GET /me`, na resposta do `PUT` que marca o vídeo, e no cartão de
cada membro. **O número 10 não existe neste repositório**, e o `XpCount` é burro como o `BadgeCount`.

A tentação aparece no segundo em que o check é clicado: somar 10 no signal e não esperar a resposta. Ela
está errada por um motivo específico e não por purismo — **remarcar um vídeo não paga XP nenhum**. A soma
local acertaria no primeiro clique de cada vídeo e erraria em todos os seguintes, e o erro é invisível: o
número fica alto, ninguém confere, e a primeira pessoa a notar é a que recarrega a página e vê o XP cair.
É a mesma regra da `orientation` da spec 017 e da `phase` do Mural — o servidor afirma, a tela obedece.

### O check é otimista, mas o XP não

| O que muda | De onde vem | Quando |
|---|---|---|
| O estado do check | do próprio clique | **na hora**, com reversão se o `PUT` falhar |
| O XP do painel | do corpo da resposta | **quando a resposta chega** |

O check é otimista porque é a reação direta a um toque, e um check que espera 400 ms de rede parece
travado no celular — quem duvida clica de novo. O XP não é, porque não é reação a nada: é um número que o
servidor calculou. Falha não abre modal: o check volta ao que era e uma linha discreta aparece, porque
falhar em marcar um vídeo não é evento que mereça interromper a leitura.

### O XP mora no `AuthStore`, e a tela da insígnia escreve nele

O check é clicado em `/dashboard/trilha/:badgeId` e o selo vive em `/dashboard`; as duas telas não se
conhecem. A tela da insígnia **não guarda XP nenhum** — chama o serviço, recebe o número novo e escreve
via `AuthStore.setXp`. Um segundo signal de XP em qualquer componente é o que fica velho na navegação de
volta, e o sintoma seria o painel mostrando o XP de antes de a pessoa assistir a três vídeos.

`setXp` **não faz nada sem perfil carregado**, e isso é decisão: criar um perfil pela metade deixaria
`profileCompleted` falso, e o guard de onboarding sequestraria quem só marcou um vídeo.

### O check fica fora da moldura do player, e é um checkbox de verdade

Ele vai **fora** do `.video__frame`. Dentro, herdaria a caixa de proporção da spec 017 e mudaria de
tamanho conforme o vídeo fosse retrato ou paisagem. E é um `input[type="checkbox"]` dentro de um `label`,
não um `div` com `click`: foco por teclado, espaço para alternar, "marcado" anunciado pelo leitor de tela
e alvo de toque estendido ao texto inteiro — quatro coisas que uma reimplementação faz pela metade.

O rótulo é **"Já assisti"**, virando **"Assistido"** quando marcado: é a frase do membro sobre si mesmo,
não uma instrução do sistema. E o hint diz a regra antes do clique — *"Os 10 XP são seus para sempre —
desmarcar só tira o check."* Sem ela o comportamento parece bug: alguém desmarca esperando o número cair,
ele não cai, e a conclusão razoável é que a tela está quebrada.

### O cartão é modal, e o nome só é clicável quando há para onde clicar

Clicar no nome abre um modal por cima do Mural: não navega, não troca de URL, não perde a rolagem nem a
aba. É o mesmo julgamento do `LegalAcceptDialog` — quem abre está no meio de outra coisa. O preço é que o
cartão não é compartilhável por link, e está aceito.

O backend manda `authorUid: string | null`, e **`null` é a pergunta anonimizada** de quem excluiu a conta.
Nesse caso o nome é texto e mais nada: sem cursor de link, sem foco por teclado, sem `role`. Não existe um
"clicou e deu erro" — o alvo não existe. **O front não conhece o valor sentinela do backend** e não compara
com string nenhuma: ele testa se o campo é nulo. Uma comparação de sentinela aqui sobrevive a uma
renomeação do outro lado e vira um cartão `404` sobre a pergunta de quem pediu para ser esquecido.

O `QuestionCard` continua **burro**: ele emite `authorClick`, e quem abre o modal é a página do Mural. Um
cartão que injetasse serviço para buscar membro faria o Mural inteiro precisar de HTTP para ser testado —
e o teste que monta o componente sem `provideHttpClient` é a prova disso.

### O cartão pede seus dados sempre, e o 404 tem frase própria

Nenhum cache: abrir o cartão da mesma pessoa duas vezes faz duas requisições. O que está lá dentro muda —
XP sobe, bio é editada, o interruptor é ligado — e um cache mostraria o estado de dez minutos atrás sem
nada que denunciasse, para economizar uma requisição num gesto que acontece três vezes por sessão.

`404` tem estado próprio e frase própria: *"Esse membro não faz mais parte da comunidade."* É o que
acontece quando alguém exclui a conta com o Mural aberto na outra aba — uma saída normal do produto, não
uma falha nossa.

### O interruptor das redes fica encostado nas redes, e o rótulo diz a verdade

Ele entra **dentro do bloco "Suas redes"**, logo abaixo dos campos de LinkedIn e Instagram. Não numa aba
de Privacidade: o padrão do backend é **desligado**, e um interruptor desligado numa seção que ninguém
abre é um recurso que não existe. Encostado nos campos, ele é encontrado por quem já foi até ali mexer nos
links — que é exatamente quem quer que eles sejam vistos.

O rótulo é **"Mostrar minhas redes para os outros membros"**, e o hint diz o que ele *não* faz: *"A
administração da Liga Dev continua vendo seus links, como vê seu e-mail e telefone."* Chamar isso de
"privado" seria vender uma garantia que não existe, e teatro de privacidade é pior que ausência dela,
porque alguém confia nele.

Ele grava **no clique**, como o interruptor de e-mails ao lado, e não faz parte do formulário de redes:
são duas gravações diferentes no mesmo bloco, de propósito. Um interruptor que precisa de submit é um
interruptor que fica meio ligado.

### Zero `localStorage`, de novo

O check vem do servidor em toda listagem e vai para o servidor em todo clique. Guardar localmente falharia
nas duas direções, como na spec 018: navegador limpo faria quem já assistiu ver tudo desmarcado, e um
estado gravado por engano esconderia para sempre um vídeo que a pessoa quis marcar. **XP é dado do membro,
e dado do membro não mora no navegador dele.**

### Uma pegadinha de teste que a spec deixou

Existem **dois** `.switch__input` na tela de Meu Perfil agora, e o das redes vem antes do de e-mails no
DOM. Um seletor global passou a pegar o switch errado, e o teste do interruptor de e-mails começou a falar
sobre privacidade sem que nada no nome dele mudasse. Os dois seletores são escopados por
`[aria-labelledby="titulo-emails"]` e `[aria-labelledby="titulo-redes"]`.


## Variáveis de Ambiente

As configurações ficam em `src/environments/`:

- `apiUrl`: URL base do backend (padrão local: `http://localhost:3000`).
- `whatsappGroupUrl`: Link de convite para o grupo oficial da Seita Dev no WhatsApp. Quando vazio, o card no painel do membro exibe o selo "Em breve" e permanece inerte.

## Executando o Projeto

### Pré-requisitos
- Node.js 20+
- Backend `eduleno-back` (Spec 005) em execução em `http://localhost:3000`

### Servidor de Desenvolvimento
```bash
npm start
```
Acesse `http://localhost:4200/`.

### Testes Unitários
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

### Build de Produção
```bash
npm run build
```
