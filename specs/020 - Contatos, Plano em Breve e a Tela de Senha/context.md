# Spec 020: Contatos Reais, Plano em Breve e a Tela de Senha

## Objetivo
Três coisas do produto hoje **prometem um destino e entregam outro**, e as três são visíveis para quem
ainda não é membro:

| Onde | O que acontece hoje | O que deveria acontecer |
|---|---|---|
| Contato do portfólio | Três links, nenhum WhatsApp, e o CTA de "Agendar aula particular" cai no LinkedIn | Instagram e LinkedIn reais, WhatsApp real, e o CTA no canal em que a conversa acontece |
| Financeiro | Quatro botões "Quero o \<tier\>" que abrem uma conversa que ninguém combinou | Um aviso de que a troca de plano vem depois, e nenhum botão que finja |
| Cadastro e troca de senha/e-mail | O link do e-mail leva para uma página do Google, com a marca do Google | Uma tela nossa, com a identidade do site |

As duas primeiras são hardcode de front e cabem numa tarde. A terceira **desfaz a decisão 3 da spec 007**,
tem par no backend e é o corpo desta spec.

O par desta spec no backend é a **020**, e as duas entram juntas — a tela sem os endpoints é um formulário
que não submete.

---

## Numeração
Os números são iguais nos dois repositórios: 018 é Termos e Privacidade, 019 é Vídeos Assistidos e XP, 020
é esta. No front não existe 006 nem 007, e é justamente a 007 do backend que esta spec reverte em parte.

---

## Dependência de ordem
A Fase 03 em diante **não funciona sem a 020 do backend em produção**: a tela chama três endpoints que
hoje não existem. As Fases 01 e 02 são independentes e podem ir antes, sozinhas.

---

## Decisões

### 1. Os links de contato são conteúdo, e conteúdo mora onde já morava
Instagram, LinkedIn, Portfólio e agora WhatsApp continuam em `PROFILE.identity.links`, no
`profile.service.ts`. **Não entra `environment`, não entra API, não entra CMS.**

`environment` é para o que muda entre ambientes, e o Instagram do Leno é o mesmo em preview e em produção
— pôr lá cria duas cópias do mesmo valor para divergirem. API seria fazer a landing esperar rede para
desenhar um `href` que está escrito no repositório.

O que muda é pequeno e é isto:

| Link | Valor |
|---|---|
| Instagram | `https://www.instagram.com/lenoborges.dev` |
| LinkedIn | `https://linkedin.com/in/jediaelborges00` (já correto, não muda) |
| WhatsApp | `https://wa.me/5547992478232` |

**O `?igsi=…` da URL do Instagram não entra.** É o parâmetro de rastreio que o app cola ao compartilhar:
identifica a sessão de quem copiou o link, não o perfil. Colado no site, ele manda todo visitante para o
Instagram carregando o identificador de compartilhamento de uma pessoa só — e a cláusula 8 da Política de
Privacidade (spec 018) diz que este produto não faz rastreio entre sites. O perfil é `lenoborges.dev`, e é
só isso que o `href` precisa dizer.

**O número vai no formato `wa.me/5547992478232`**, sem `+`, sem espaço, sem parêntese: é o formato que o
`wa.me` aceita. O `handle` exibido é `+55 47 99247-8232`, legível, porque o que aparece na tela é para uma
pessoa ler e o que está no `href` é para o WhatsApp interpretar. **Os dois valores existem, e o
formatado nunca é derivado do outro em tempo de execução** — uma função que formata telefone para exibir
é a próxima a receber um número de outro país.

### 2. O WhatsApp vira o CTA de contato, e o comentário que dizia o contrário sai
`landing.page.ts` tem hoje:

```ts
/** Único canal de contato real hoje (LinkedIn); agendamento por calendário fica fora de escopo. */
protected readonly contactHref = computed(() => …find(link => link.icon === 'linkedin')…);
```

O comentário está correto e deixa de estar no minuto em que o WhatsApp entra na lista. **"Agendar aula
particular" passa a apontar para o WhatsApp**, porque é onde a conversa de agendar uma aula de fato
acontece — o LinkedIn era o canal real por ausência de outro, não por escolha.

E aqui o `?text=` **entra**, com uma mensagem curta pré-preenchida ("Oi, Leno! Vim pelo site e quero
saber sobre as aulas particulares."). O `wa.me` aceita texto na URL, que é exatamente a condição que o
comentário do `financeiro.page.ts` registrou como ausente quando o único canal era o LinkedIn.

O `find` por `icon` continua: **um lugar só para o link mudar** (era a razão original, e ela não mudou).
Se o WhatsApp sair da lista um dia, o `?? links[0].url` já está lá e o CTA continua clicável.

### 3. Quatro links de contato não cabem em `repeat(3, 1fr)`
A grade do `contact-links` é `repeat(3, 1fr)` acima de 48rem, e com quatro itens ela produz três em cima e
um sozinho embaixo, esticado na largura de um terço.

Passa a ser `repeat(auto-fit, minmax(13rem, 1fr))`. Quatro cabem em uma linha no desktop largo, viram 2×2
no tablet, e a regra deixa de ser um número que precisa ser reeditado toda vez que um canal entra ou sai.
**No celular nada muda** — a grade já era de uma coluna e continua.

### 4. A troca de plano é desligada por uma constante, e não por deleção
`financeiro.page.ts` ganha:

```ts
/** Desligado até existir cobrança. Uma linha para religar. Ver a decisão 4 da spec 020. */
const TROCA_DE_PLANO_DISPONIVEL = false;
```

O `TierCard` ganha um `input` `upgradeDisponivel`, e com ele falso o botão "Quero o \<tier\>" vira
`disabled` com o rótulo **"Em breve"**; o CTA da seção "O que o \<tier\> abre para você" também.

Três alternativas recusadas, e por quê:

- **Apagar os botões.** O cartão perde o rodapé e a grade fica com quatro colunas de alturas diferentes
  — e o dia de religar vira reescrever o `TierCard`.
- **Deixar o botão vivo e mostrar um aviso no clique.** É a interface prometendo e retirando depois do
  gesto. Um botão que abre um alerta dizendo "isto ainda não existe" é pior que um botão desabilitado,
  porque a pessoa já decidiu quando descobre.
- **Esconder a tela inteira do Financeiro.** Os preços e o que cada degrau entrega são informação
  legítima e é para isso que a tela serve hoje. Quem quer trocar de plano fala com o Leno pelos canais de
  contato — que a decisão 1 acabou de tornar reais.

**Vale para todo mundo, admin incluído.** Um caminho vivo que só uma conta percorre é um caminho que
ninguém testa, e o admin não tem checkout nenhum a mais que os outros.

`disabled` sozinho é silencioso para quem navega por teclado — o botão simplesmente não recebe foco.
Por isso a mensagem **"A troca de plano estará disponível em breve."** aparece como texto na tela, uma vez
por cartão desabilitado não: **uma vez na página**, acima da lista. Repetir a mesma frase em quatro
cartões é um leitor de tela lendo a mesma promessa quatro vezes.

### 5. `onUpgrade` continua existindo, e continua sem ser chamado
O handler e o `contactHref` do `financeiro.page.ts` ficam. Não há caminho até eles enquanto a constante
for falsa, e apagá-los transformaria "religar a troca de plano" de uma linha em uma tarefa.

O teste que hoje cobre o `onUpgrade` **também fica**, chamando o método direto. É o que impede o código
morto de apodrecer em silêncio até o dia em que ele volta a ser vivo.

---

## A tela de senha

### 6. O `oobCode` volta para dentro do produto, e a spec 007 sabia o preço disto
A decisão 3 da spec 007 matou a página `/definir-senha`, o `POST /auth/password`, o `SetPasswordDto`, o
`SetPasswordRequest` e as funções `extractToken` e `scrubTokenFromUrl`. Ela também escreveu, na mesma
página, exatamente o que estava comprando com isso:

> **A identidade visual se interrompe.** A tela é do Google, com a marca do Google.

Esta spec paga a conta de volta. **O que a 007 economizou era real e o que ela custou também**, e o que
mudou desde então é a proporção: o produto tem hoje diálogo de aceite legal, tela de descadastro, cartão
de membro e uma identidade visual inteira — e o primeiro contato de todo membro novo com o produto
continua sendo uma página cinza do Google pedindo uma senha.

Volta, com nome novo:

| Item | Onde |
|---|---|
| Rota `/acesso` | `app.routes.ts`, pública, sem guard, fora do `dashboard-shell` |
| `AcessoPage` | `src/app/pages/acesso/` |
| `AccessService` | `src/app/services/access.service.ts` |
| `checkOobCode`, `confirmPassword`, `applyEmailAction` | três chamadas, três endpoints da 020 do backend |

**O que não volta é o front falando com o Firebase.** O `oobCode` vai para a nossa API, e a nossa API
fala com o Identity Toolkit — a decisão da spec 005 de o front nunca falar com o provedor de auth
continua inteira, e é ela que impede a "solução óbvia" de instalar o SDK web do Firebase aqui.

### 7. Uma rota para todos os modos, porque o console tem um campo só
O Firebase manda todo link de ação para **um** endereço, configurado uma vez por projeto, com o modo na
query:

```
/acesso?mode=resetPassword&oobCode=…&continueUrl=…&lang=pt-BR
```

Quatro rotas (`/definir-senha`, `/verificar-email`, `/trocar-email`…) exigiriam que o console soubesse
rotear, e ele não sabe. **Uma rota, e o `mode` decide qual tela desenhar.**

| `mode` | O que a tela faz |
|---|---|
| `resetPassword` | Formulário de senha nova. É o cadastro **e** o "esqueci minha senha" — o mesmo modo |
| `verifyAndChangeEmail` | Aplica a troca de e-mail e confirma na tela. Sem formulário |
| `verifyEmail` | Aplica a verificação e confirma. Sem formulário |
| `recoverEmail` | Aplica a reversão da troca de e-mail e confirma. Sem formulário |
| qualquer outro, ou ausente | Tela de link inválido |

**Os três últimos modos o produto não dispara hoje**, e a tela os trata mesmo assim. O endereço de ação é
do projeto inteiro: no dia em que alguém ligar a verificação de e-mail no console, o link cai aqui, e a
alternativa a tratá-lo é uma tela em branco para um membro que fez tudo certo.

### 8. O código é conferido antes de a tela desenhar o formulário
`resetPassword` **não** desenha os campos de senha de cara. Ela chama `POST /auth/password/check`, e só
com a resposta boa é que o formulário aparece — com o e-mail dono do link escrito acima dele:
*"Criando a senha de fulano@exemplo.com"*.

Sem isso, quem clicou num link expirado escolhe uma senha, digita duas vezes, submete, e **só então**
descobre que o link morreu. Com isso, ele lê a frase antes de gastar o gesto.

O e-mail vir na resposta não é vazamento: **o `oobCode` é o segredo, e quem o tem provou ter a caixa de
entrada**. É o mesmo que a tela do Firebase mostra hoje no lugar dela.

### 9. O `oobCode` é lido uma vez e some da barra de endereços
Depois de lido, `history.replaceState` reescreve a URL para `/acesso` limpo. É o `scrubTokenFromUrl` da
spec 006 ressuscitado, e o motivo é o mesmo de antes:

- a URL inteira entra no histórico do navegador, e em navegador compartilhado ela fica;
- ela aparece em print de tela de quem pede ajuda;
- ela vaza no `Referer` de qualquer requisição para outro domínio feita a partir da página.

O valor lido vive num signal do componente e **em nenhum outro lugar** — não em `localStorage`, não em
serviço `providedIn: 'root'`, não em `sessionStorage`. Um código de uso único guardado fora da tela que o
usa é um código que sobrevive à tela.

E a página inteira vai **fora dos buscadores**, como o `/descadastro` (spec 014, decisão 11): é uma URL
com credencial na query, e um rastreador que a visitasse queimaria o link de alguém.

### 10. `continueUrl` da query não é obedecido — ele é conferido
O Firebase devolve o `continueUrl` que a API mandou, na query, **e a query é escrita por quem manda o
link**. Um `window.location = params.get('continueUrl')` aqui é um redirecionamento aberto com a marca do
produto em cima: o phishing perfeito é o link legítimo do nosso e-mail terminando num domínio que não é
o nosso.

A regra é uma linha: **se não for do mesmo `origin`, ignora e vai para `/?entrar=1`.** Não há
lista de domínios permitidos a manter, e não há por que haver — não existe um destino externo legítimo
depois de definir uma senha.

### 11. Definir a senha **não** loga
Sucesso leva para `/?entrar=1`, com a landing abrindo o diálogo de login — o mesmo destino que a tela do
Firebase usava, e o mesmo `?entrar=1` que já existe desde a spec 007.

A tentação é fazer o `POST /auth/password` devolver sessão, já que a pessoa acabou de provar dois fatores
(a caixa de entrada e a senha nova). **É a decisão 5 da spec 005 de novo**: o front não recebe material de
sessão de nenhum caminho que não seja o login. Um segundo caminho de criação de sessão é um segundo lugar
para o cookie de refresh ser emitido errado, e ele só seria exercitado no cadastro — o fluxo que menos
gente percorre duas vezes.

E há uma razão de produto: **quem acabou de criar a senha entra com ela na hora**, e isso é o teste de
que ela é a senha que a pessoa achou que digitou.

### 12. A senha tem confirmação, mínimo de 8, e a tela não é a garantia
Dois campos, `type="password"`, com `autocomplete="new-password"`, e as regras escritas **acima** dos
campos, não como erro depois do submit.

O mínimo de 8 volta a existir no front, e a spec 007 previu isto ao contrário: quando a tela saiu daqui,
o piso caiu para a política do console. Agora existem dois pisos, e **o do front é cortesia, não
garantia** — quem garante é a política do projeto no Firebase, que a API aplica e cuja recusa ela
traduz. Uma validação de front que se apresenta como a regra é a próxima a divergir do servidor sem que
ninguém note.

A confirmação existe porque o campo é mascarado e o custo do erro é alto: uma senha com um caractere a
mais é uma conta cujo dono precisa pedir outro link para descobrir o que aconteceu.

### 13. Link morto tem tela própria, com saída
`EXPIRED_OOB_CODE` e `INVALID_OOB_CODE` chegam da API já traduzidos e caem na mesma tela — e ela **não é
um erro genérico**:

> **Esse link não vale mais.**
> Links de senha expiram e valem uma vez só. Peça um novo na tela de entrar.
> [Pedir um link novo]

O botão leva a `/?entrar=1`, onde "Esqueci minha senha" já existe e já dispara outro e-mail. Um erro sem
saída aqui é um membro parado — e é o caso mais comum de todos, porque o link de quem já definiu a senha
uma vez está morto por definição.

**Expirado e inválido mostram a mesma tela**, de propósito: distinguir informaria a quem colou um código
qualquer se ele existiu algum dia.

### 14. A tela usa o que já existe, e não inventa um segundo desenho de formulário
`pixel-panel`, `app-logo`, a marcação `.field` / `.field__input` / `.field__error` do `auth-dialog`, e o
`pixel-button` para a ação. **Zero componentes novos de UI.**

É a primeira tela do produto que alguém vê antes de ter conta — junto com a landing — e ela precisa
parecer a mesma coisa. Um formulário desenhado do zero aqui teria botão de outro raio, campo de outra
altura e erro de outra cor, e o efeito seria o oposto do que motivou a spec inteira.

**Ela não tem menu, não tem sino e não tem aside**: fica fora do `dashboard-shell`, como o `/descadastro`
e as páginas legais. Quem está nela ainda não tem sessão.

### 15. Trocar a senha estando logado continua sendo outra coisa
`/dashboard/perfil` › Acesso › trocar senha **não muda em nada**: continua sendo `POST /me/password`, com
reautenticação pela senha atual e encerramento de sessão em todos os aparelhos (spec 013, decisão 4).

Aquele fluxo não tem `oobCode` e não precisa de um: quem está logado já provou identidade. Fazer a tela de
perfil disparar um e-mail e passar pela `/acesso` trocaria uma prova forte (a senha atual, na hora) por
uma mais fraca e mais lenta.

**O que muda em Meu Perfil é só o destino do link do e-mail de troca de e-mail**, e isso acontece sem uma
linha de código aqui: o `sendOobCode` é do backend e o endereço de ação é do console.

---

## Telas

| Rota / lugar | O que muda |
|---|---|
| `/` (landing) | Quatro links de contato; "Agendar aula particular" aponta para o WhatsApp com texto |
| `/acesso` | **Nova.** Pública, sem guard, fora do shell, `noindex` |
| `/dashboard/financeiro` | CTAs de upgrade desabilitados, com aviso de "em breve" acima da lista |

---

## Fora de escopo

- **Cobrança, checkout e troca de plano de verdade.** A decisão 4 desliga um botão; ligar o que ele
  deveria fazer é uma spec com o backend inteiro dentro.
- **Formulário de contato no site.** O WhatsApp é o canal, e um formulário que manda e-mail exige SMTP,
  antispam e uma caixa de entrada que alguém confira.
- **Login social (Google, GitHub).** Nada nesta spec o aproxima nem o afasta.
- **Verificação de e-mail obrigatória no cadastro.** A tela trata `verifyEmail` porque o endereço de ação
  é do projeto inteiro (decisão 7), não porque o produto passe a exigir verificação.
- **E-mail com template próprio.** O corpo do e-mail continua sendo o do Firebase, editado no console. O
  que esta spec troca é a **tela** para onde ele leva. Trocar o e-mail também é a spec 014 inteira ligada
  a este fluxo, e ela tem outro assunto.
- **Página de "aguardando confirmação" depois do cadastro.** O diálogo de cadastro já diz para onde o
  e-mail foi, e ele diz isso sem mudar de rota.

---

## Specs afetadas

Pela regra do `clauderc.md`, cada decisão superada abaixo recebeu o bloco de `Deprecated` **no próprio
arquivo da spec antiga**, apontando para esta. Nenhuma spec inteira cai: o que muda são decisões
nomeadas dentro delas.

### Spec 007 (backend) — decisão 3 **Deprecated**
A tela de senha volta a ser nossa. O que **não** volta é o front falando com o Firebase (decisão 6), e o
que **entra** é a configuração de `customize action URL` no console — que aquela spec instruía a não
tocar. A README do backend tem uma linha em negrito dizendo "Não configure customize action URL", e ela é
parte da entrega da 020 do backend.

### Spec 005 (Autenticação) — a página de senha **Deprecated**, o resto vigente
Duas coisas opostas ao mesmo tempo, e por isso o bloco de `Deprecated` foi para o parágrafo e não para o
topo do arquivo.

A rota `/definir-senha` que ela desenhou já estava morta desde a decisão 3 da 007 do backend, e **este
repositório nunca registrou aquela morte** — o parágrafo e a linha da tabela de rotas do `README.md`
descreveram por doze dias uma página inexistente. A 020 fecha isso: marca o parágrafo e traz a página de
volta como `/acesso`, com outro desenho.

O que continua vigente dela é o que segura esta spec inteira: **"o front nunca fala com o provedor de
auth"** e **"sessão só nasce no login"** governam as decisões 6 e 11.

### Spec 006 (backend) — continua sem objeto; só o `scrubTokenFromUrl` volta
Não a spec, que perdeu objeto quando o fornecedor mudou e continua sem ele: só o padrão de limpar a
credencial da barra de endereços, que estava certo e cuja ausência a decisão 9 explica.

### Spec 009 (Financeiro) — decisão 4 **parcialmente Deprecated**
A escada de tiers, os preços, os degraus cumulativos e a seção do próximo degrau continuam inteiros. O
que cai é a metade do upgrade: o botão desabilitado com "Em breve", por constante e não por deleção.

**Dois pontos em aberto daquela spec fecham aqui**, em direções opostas: o WhatsApp passou a existir (e
com ele o `?text=` que aquele texto dizia ser impossível), e o upgrade deixou de levar a uma conversa. O
`?text=` acabou no CTA da landing, que é onde a conversa de fato acontece.

### Spec 013 (Meu Perfil) — vigente
Trocar senha logado não muda (decisão 15). Trocar e-mail não muda de código: muda para onde o link do
e-mail leva.

### Spec 014 (Disparo de E-mails) — vigente
`/acesso` entra na mesma categoria do `/descadastro`: pública, fora do shell, fora dos buscadores.

### Spec 018 (Termos e Privacidade) — vigente
A cláusula 8 da Política é o que recusa o `?igsi=` do Instagram (decisão 1).

---

## Pontos em aberto

1. **O endereço de ação é por projeto do Firebase, e existem dois.** `dev-liga-dev` aponta para
   `ligapreview.lenoborges.com.br` e o de produção para `liga.lenoborges.com.br`. São duas
   configurações de console, e nenhuma delas está no repositório — é a quarta linha da tabela "o que
   vive no console" da README do backend.
   Configurar só um dos dois produz o defeito mais confuso possível: cadastro que funciona em preview e
   manda o membro de produção para a tela do Google.
2. **A política de senha do console continua sendo a garantia**, e continua sem representação em código.
   A decisão 12 põe 8 no front de novo, e isso não a substitui — se alguém baixar o mínimo no console, o
   front recusa 6 caracteres e a API aceitaria.
3. **O `lang` da query é ignorado.** A tela é em português e só. No dia em que houver outra língua, ele
   está lá esperando.
4. **A troca de plano desligada é uma promessa com prazo implícito.** "Em breve" que dura um ano vira
   ruído, e quem lê para de acreditar no resto da tela. A constante da decisão 4 é o lembrete de que
   alguém decidiu isso um dia.
5. **O `?text=` do WhatsApp é o começo da conversa, e ele não sabe de onde a pessoa veio.** Um texto por
   origem (landing, financeiro, cartão) daria contexto ao Leno, e é a próxima coisa a pedir. Fica de
   fora agora porque um parâmetro por lugar é um parâmetro para esquecer de atualizar.
