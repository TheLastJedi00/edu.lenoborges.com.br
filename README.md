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
| `/definir-senha` | Criação/redefinição de senha via link seguro por e-mail | Pública | - |
| `/completar-perfil` | Onboarding obrigatório de novos membros (nome, telefone, bio) | Protegida | `authGuard`, `onboardingPendingGuard` |
| `/dashboard` | Painel do membro com trilha, grupo e ranking | Protegida | `authGuard`, `profileCompleteGuard` |
| `/dashboard/perfil` | Meu Perfil: dados, redes, e-mail, senha, recebimento de e-mails e exclusão de conta | Protegida | `authGuard`, `profileCompleteGuard`, `unsavedChangesGuard` (saída) |
| `/dashboard/admin/emails` | Escrever e disparar e-mail para a comunidade | Protegida | `adminGuard` |
| `/descadastro` | Sair da lista de e-mails pelo link do rodapé | **Pública** | — |

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
