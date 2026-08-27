# Spec 018: Termos de Uso e Política de Privacidade

## Objetivo
Ninguém nunca concordou com nada. O membro entra, preenche nome e bio, entra no grupo de WhatsApp, paga a
assinatura, publica pergunta que pode virar vídeo — e não existe uma tela em todo o produto onde ele
tenha visto uma cláusula.

Esta spec cria os dois documentos na interface e faz o aceite ser **condição para usar o painel**. São
três lugares e um componente:

| Onde | O quê |
|---|---|
| Onboarding | dois botões, dois modais, dois checks — sem eles não há "Concluir perfil" |
| Painel, para quem já era membro | um modal de alerta por cima de tudo, sem saída a não ser aceitar |
| Rodapé da landing e Meu Perfil | leitura, quando quiser, sem pressa e sem check |

O par desta spec no backend é a **018**, e as duas entram juntas. O texto dos documentos e as versões
vivem lá; aqui não existe uma linha de cláusula escrita à mão, e a decisão 1 explica por quê.

---

## Numeração
Os números são iguais nos dois repositórios: 016 é Adiantar e Editar no Mural, 017 é Respostas em
Retrato, 018 é esta.

---

## Decisões

### 1. O front não guarda o texto, e não tem opinião sobre qual versão é a vigente
Tudo vem de `GET /legal/documents/:id`: título, versão, data, seções e parágrafos. E quem diz o que falta
aceitar é o backend, em dois canais — `pendingLegal` no `GET /me` e o corpo do `428`.

A tentação é óbvia: guardar as versões numa constante do front e comparar. Ela cria o estado que a
decisão 1 da spec 018 do backend descreve — texto novo, número velho, ninguém chamado a aceitar de novo,
nenhum erro em lugar nenhum. **Se o front souber comparar versões, ele vai comparar errado um dia**, e o
sintoma é o produto funcionando perfeitamente sob um contrato que não é mais o contrato.

O front só sabe fazer três coisas: buscar documento, mostrar documento, mandar aceite.

### 2. Nunca `innerHTML`
`sections` é `{ heading, paragraphs }[]`, e a renderização é `@for` sobre `@for`, com interpolação.

Não é excesso de zelo: é a única forma de garantir que este caminho continue seguro depois que alguém
resolver que o texto legal ficaria melhor em markdown. O dia em que houver um `bypassSecurityTrustHtml`
aqui, ele fica — e a fonte do texto pode deixar de ser uma constante do backend sem que ninguém reveja
aquela linha.

### 3. Um componente desenha o documento, e três telas o usam
`LegalDocumentView` recebe um `LegalDocument` e desenha título, versão e seções. Ele não tem check, não
tem botão, não sabe o que é aceite e não faz requisição.

Em volta dele:

| Uso | Componente |
|---|---|
| Página pública `/termos-de-uso`, `/politica-de-privacidade` | `LegalDocumentPage` |
| Modal com aceite, no onboarding e no bloqueio | `LegalAcceptDialog` |
| Consulta em Meu Perfil, sem aceite | `LegalAcceptDialog` com `readonly` |

Uma segunda cópia da diagramação do texto — uma para a página, outra para o modal — é a que fica com um
`h2` errado seis meses depois, na que ninguém abre.

### 4. O check não depende de rolar até o fim
O modal rola. O check está no rodapé fixo dele, **habilitado desde o primeiro instante**.

Prender o check à rolagem é comum e parece proteger. Não protege: prova que uma roda girou, não que
alguém leu. E quebra de verdade para quem usa leitor de tela, para quem usa Ctrl+F, e para quem está no
celular com um texto de trinta telas — que passa a ser obrigado a arrastar o polegar por trinta telas para
poder clicar. Trocar acessibilidade real por uma aparência de consentimento é o pior negócio disponível.

O que o modal faz, e é o que importa, é **abrir no texto** — não numa tela de resumo com um link "leia os
termos". O documento inteiro está ali, aberto, antes do check.

### 5. O aceite é gravado no clique do modal, não no submit do formulário
Marcar o check e confirmar dispara `POST /me/legal-acceptances` na hora. O onboarding não acumula os dois
aceites em memória para mandar junto com o `PATCH /me/profile`.

Duas razões, e a segunda é a que decide. A primeira: quem aceitou e abandonou o formulário **aceitou** —
guardar em memória e perder no F5 faria a pessoa ler tudo de novo por nada. A segunda: o modal de
bloqueio do painel precisa gravar sozinho de qualquer jeito, e um segundo caminho de gravação seria o que
esquece um campo, ou grava o documento errado, no dia em que o terceiro documento entrar.

Um caminho: `LegalService.accept(documentId, version)`.

### 6. O botão de concluir o onboarding é desabilitado pelo aceite, e o backend confere de novo
Na tela de completar perfil, dois botões acima do submit — "Termos de Uso" e "Política de Privacidade" —,
cada um abrindo o seu modal, cada um virando "aceito" com a data quando volta `204`. O submit fica
desabilitado enquanto os dois não estiverem aceitos, junto das validações de campo que já existem.

O `disabled` é conveniência. Quem impede de verdade é o `428` do `PATCH /me/profile` (decisão 8 do
backend), e é bom que seja assim: é a mesma divisão do `adminGuard` — o guard do front evita o membro
comum bater num erro sem entender; quem barra é o backend, em toda requisição.

### 7. O bloqueio do painel não é dispensável, e isso muda como o `<dialog>` é usado
No `DashboardShell`, quando há documento pendente, sobe um `<dialog>` com `showModal()` que:

- não fecha no Esc — `(cancel)="$event.preventDefault()"`;
- não tem botão de fechar, não tem "agora não", não fecha no backdrop;
- cobre o conteúdo com backdrop opaco, em tom de alerta, não no cinza neutro do `ConfirmDialog`;
- lista o que falta e abre o modal de leitura de cada documento;
- some sozinho quando o último pendente for aceito.

**Não reusa o `ConfirmDialog`.** Aquele componente existe para ser cancelável — tem `cancelLabel`, emite
`cancelled`, fecha no Esc — e a coisa mais fácil do mundo é alguém "melhorar" a experiência devolvendo o
botão de fechar. Um componente cujo nome é `LegalBlockDialog` e cujo `cancel` é `preventDefault` diz o que
é ao ser lido.

O tom é de alerta e não de erro: quem está vendo aquilo não fez nada errado. O texto explica que os
termos foram publicados e que o acesso volta assim que forem aceitos.

### 8. O gatilho vem do servidor, pelos dois canais
`LegalStore` guarda `pending: LegalDocumentSummary[]`, e ele é preenchido de dois lugares:

- **`GET /me`**, na carga do shell — o painel já nasce bloqueado, sem esperar uma requisição qualquer
  falhar por acaso e desenhar meia tela antes;
- **o `428`, no interceptor** — pega a versão publicada enquanto a pessoa estava com a aba aberta, que é
  o caso que nenhuma checagem de carregamento alcança.

Só o primeiro, e quem ficou logado durante o deploy usa o produto a semana inteira sob o texto antigo. Só
o segundo, e o bloqueio aparece quando calhar, depois de o dashboard já ter desenhado.

O interceptor trata `428` **antes** de qualquer outra coisa e **não redireciona**: preenche o
`LegalStore` e devolve o erro adiante. Redirecionar para uma rota de aceite espalharia o bloqueio pela
tabela de rotas e deixaria a pessoa perdida — o bloqueio é uma camada por cima de onde ela já está, e
quando ela aceita, ela continua de onde parou.

### 9. Nada disto encosta no `localStorage`
O aceite é do servidor, e só. Um flag local mentiria nas duas direções: navegador limpo faria quem já
aceitou aceitar de novo, e — pior — um flag "aceito" gravado por engano esconderia um pendente real e o
bloqueio nunca apareceria.

O único booleano que este produto guarda no navegador continua sendo o do menu lateral.

### 10. As páginas públicas ficam fora do shell, e sem guard
`/termos-de-uso` e `/politica-de-privacidade` são rotas de primeiro nível, como `/descadastro` (spec 014,
decisão 11). Sem `authGuard`, sem `profileCompleteGuard`, fora do `DashboardShell`.

Quem lê pelo rodapé da landing não tem conta, e é justamente a pessoa que mais precisa ler antes. Uma
página de contrato atrás de login é um contrato que só se lê depois de assinar.

Elas também são o destino dos links dentro do modal de bloqueio, para quem quiser abrir em outra aba e
guardar.

### 11. Meu Perfil ganha "Contratos", e ela é a quinta seção
Depois de Seus dados, Suas redes, Acesso e E-mails — e **antes** de Excluir conta, que continua sendo a
última, sozinha, no fim (spec 013, decisão 1).

Uma linha por documento: título, "versão de 27/08/2026", "aceita em 12/03/2026" e um botão que abre o
mesmo modal em modo leitura. É a tela para onde a Política aponta quando diz que a data do aceite fica
registrada — e uma promessa dessas sem a tela correspondente é a decisão 10 do backend sendo violada de
dentro do front.

### 12. O rodapé da landing deixa de ser duas linhas
Hoje o rodapé tem o nome e a cidade. Ganha os dois links, na mesma tipografia mono do que já está lá.

Não vira menu, não vira colunas, não ganha logo. É a landing de um professor particular, e um rodapé de
SaaS com quatro colunas nela seria a única parte da página que parece de outro produto.

---

## Telas

### Onboarding (`/completar-perfil`)
```
  ┌──────────────────────────────────────────┐
  │ Complete seu perfil               [Sair] │
  │                                          │
  │  Nome ............ [               ]     │
  │  Telefone ........ [               ]     │
  │  Bio ............. [               ]     │
  │                                          │
  │  Antes de continuar, leia e aceite:      │
  │  [ Termos de Uso        ]  ✓ aceito      │
  │  [ Política de Privac.  ]  ○ pendente    │
  │                                          │
  │  [ Concluir perfil e ir para o painel ]  │  ← disabled
  └──────────────────────────────────────────┘
```

### Bloqueio no painel
Backdrop de alerta cobrindo tudo. Título, uma frase de explicação, a lista do que falta com um botão por
documento, e nenhuma forma de sair. Aceitou o último: o modal fecha e o painel está ali, como estava.

### Modal do documento
Cabeçalho com título e versão. Corpo rolável com o texto. Rodapé fixo com o check e o botão de aceitar —
o botão desabilitado enquanto o check estiver desmarcado. Em modo leitura, o rodapé é só um "Fechar".

---

## Fora de escopo

- **Baixar o contrato em PDF.** As páginas públicas imprimem bem e o navegador salva em PDF sozinho.
  Gerar PDF é dependência nova para um botão que o `Ctrl+P` já é.
- **Histórico de versões aceitas.** Meu Perfil mostra a vigente e a data. O backend guarda o histórico
  (decisão 6 de lá) e ninguém pediu para vê-lo.
- **Diff entre versões.** No dia em que a versão 2 subir, o modal mostra o texto novo inteiro, não o que
  mudou. Um diff de texto jurídico renderizado errado é pior que nenhum.
- **Aceite por e-mail.** O aceite é no produto, autenticado. Link de aceite em e-mail é exatamente o
  formato que todo phishing imita.
- **Banner de cookies.** Não há cookie de terceiro (decisão 8 do Anexo B). Um banner pedindo
  consentimento que a lei não exige treina a pessoa a clicar em "aceitar tudo" sem ler, que é o hábito
  que esta spec inteira depende de não existir.

---

## Specs afetadas

### Spec 005 (Autenticação e Dashboard) — vigente, estendida
`/completar-perfil` ganha os dois botões e a trava no submit. O fluxo, as validações e o destino não
mudam.

### Spec 011 (Sessão que Sobrevive ao F5) — vigente
O `authInterceptor` ganha um ramo antes do de `401`. **O tratamento de `428` não pode passar pelo
caminho do refresh** — teste-trava: um `428` não dispara `refresh()`, não zera a sessão e não navega para
`/comunidade`. Confundir os dois deslogaria toda a base no deploy desta spec, que é a pior estreia
possível para uma feature cujo assunto é confiança.

### Spec 012 (Notificações Internas) — vigente
O modal de bloqueio cobre o sino junto com o resto. Notificação não é lida por baixo de bloqueio, e está
certo: não há nada a fazer no painel até aceitar.

### Spec 013 (Meu Perfil) — vigente, estendida
Ganha a seção Contratos (decisão 11). As demais seções não mudam, e "Excluir conta" continua sendo a
última.

### Spec 014 (Disparo de E-mails) — vigente
`/descadastro` continua pública e continua funcionando sem sessão — e agora tem companhia na lista de
rotas de primeiro nível que existem para quem está de fora.

---

## Pontos em aberto

1. **O bloqueio aparece antes de a pessoa saber o que é a Liga Dev?** Não: ele só existe dentro do
   painel, para quem já entrou. Mas o membro que abre o produto pela primeira vez em meses vê um modal
   inescapável antes de qualquer outra coisa, e não há como suavizar isso sem enfraquecê-lo. O texto do
   modal é o que resta para trabalhar, e vale escrevê-lo com cuidado.
2. **Documento longo em celular antigo.** São dois textos de umas 1.500 palavras cada dentro de um
   `<dialog>` rolável. Vale medir num aparelho ruim antes de fechar a spec; se travar, a saída é
   renderizar por seção com `@defer`, não encurtar o contrato.
3. **Aceitar em duas abas ao mesmo tempo.** A segunda aba manda o mesmo aceite e recebe `204` — o backend
   é idempotente (decisão 6 de lá). O `LegalStore` de cada aba se resolve sozinho na próxima resposta.
   Não há sincronização entre abas e não precisa haver.
4. **Que hora recarregar a lista de pendentes.** Hoje: na carga do shell e em todo `428`. Se um dia
   houver um caso de "aceitei e o modal não sumiu", é aqui que se olha — e a resposta provavelmente é
   reler `GET /me` depois do último aceite, em vez de confiar no que o store já tinha.
