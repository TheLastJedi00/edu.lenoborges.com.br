# Spec 011: Links Gerenciados

## Objetivo
Uma tela em **Administração → Links** onde o admin cadastra o WhatsApp pessoal, o do grupo da
comunidade e o que mais precisar — e as telas que hoje têm URL escrita no código passam a ler dali.

O gatilho é o ponto em aberto que a spec 010 deixou: o botão de upgrade do Financeiro abre o
LinkedIn, porque não havia número de WhatsApp em lugar nenhum. Preencher a constante resolveria hoje
e voltaria a doer no dia em que o número mudasse.

O par desta spec no backend é a **011**.

---

## Decisões

### 1. Três lugares viram um
| Onde estava | Passa a ser |
|---|---|
| `environment.whatsappGroupUrl`, vazio | o slot `whatsapp-comunidade` |
| `contactHref()` do Financeiro, apontando para o LinkedIn | o slot `whatsapp-pessoal` |
| Links de contato em `profile.service.ts` | conteúdo local, agora como **fallback** |

`environment.whatsappGroupUrl` **é removido**. Constante vazia esperando alguém lembrar de preenchê-la
no deploy é a forma mais silenciosa de um recurso não existir — o cartão do WhatsApp no painel está
desabilitado desde a spec 005 por causa dela.

### 2. A landing usa os links gerenciados, com o conteúdo local como rede
O `LinkService` carrega os links da API; enquanto ele não responde, ou se falhar, a página mostra os
links locais que já existem em `profile.service.ts`.

**Sem o fallback, uma falha de API apagaria a seção de contato da landing** — e contato é a única
coisa que aquela página realmente precisa entregar. Com ele, o pior caso é mostrar o link antigo, que
continua funcionando.

O conteúdo local, portanto, **não morre**: ele muda de papel, de fonte para rede de segurança. Quem
mexer nele um dia precisa saber que é isso que ele é.

### 3. Slot ausente esconde o botão. Nunca renderiza um `href` vazio
O admin pode apagar `whatsapp-pessoal` — a decisão 5 do backend permite de propósito. O contrato
deste lado é o que torna isso seguro:

> **Todo consumidor de slot esconde o próprio botão quando o link não existe.**

Um `<a href="">` é um link que recarrega a página, e o aluno clica achando que abriu alguma coisa. Um
botão que não está lá é uma ausência honesta.

Isso vale para o upgrade do Financeiro e para o cartão da comunidade no painel. **É a mesma regra do
`whatsappGroupUrl` vazio da spec 005**, agora com o dado vindo de um lugar que dá para consertar sem
deploy.

### 4. A tela de admin mostra quais links o app consome
Duas seções, e a separação é o ponto:

- **Slots** — `whatsapp-pessoal` e `whatsapp-comunidade`, com a etiqueta de onde cada um aparece
  ("botão de upgrade do Financeiro", "cartão da comunidade no painel"). Trocar a URL muda o
  comportamento daquela tela.
- **Outros links** — o que o admin cadastrar. Aparecem numa lista de "Links úteis" no painel.

Sem essa marcação, o admin troca o WhatsApp esperando que o botão de upgrade mude, e nada muda —
porque ele cadastrou o slug errado. **A tela precisa dizer qual nome o código procura**, e o campo de
slug dos slots é somente leitura por isso.

### 5. Cache de sessão, invalidado na escrita
O `LinkService` guarda a resposta como o `BillingService` faz. Mas aqui existe um segundo leitor que o
catálogo de tiers não tinha: **o próprio admin, que acabou de editar**. Salvar limpa o cache.

Sem isso, o admin salva, volta para o painel e vê o link antigo — e a conclusão dele é que a escrita
falhou. É a pior classe de bug para quem administra, porque o instinto é salvar de novo.

### 6. A URL é validada no formulário também
O backend recusa `javascript:`, `data:` e `http:`. A tela recusa antes de enviar, com a explicação —
não por desconfiança do servidor, mas porque um 400 genérico depois de preencher três campos não diz
**qual** deles está errado.

---

## Rotas

| Rota | Guard | O que é |
|---|---|---|
| `/dashboard/admin/links` | auth + perfil completo + **admin** | Slots e links livres |

---

## Fora de escopo

- **Ícone por link.** Os ícones são componentes SVG escolhidos por nome no código; um catálogo na tela
  custaria mais do que entrega.
- **Reordenar por arrastar.** Mesma decisão da spec 009: setas quando houver o que ordenar. Com meia
  dúzia de links, o campo de ordem no formulário basta.
- **Prévia do link.** Nada de buscar título ou favicon do destino.

---

## Specs afetadas

### Spec 010 — ponto em aberto resolvido
"O upgrade abre o LinkedIn, não o WhatsApp" fecha aqui.

### Spec 009 — vigente, estendida
A tela de Administração ganha um terceiro cartão, e o Financeiro passa a ler o destino do upgrade de
um slot em vez de do conteúdo local.

### Spec 005 — vigente, com uma dívida paga
O cartão do WhatsApp no painel estava desabilitado desde lá, por causa da constante vazia. Ele passa a
depender do slot `whatsapp-comunidade` — e continua escondido enquanto o slot não existir, que é o
mesmo comportamento, agora consertável sem deploy.

---

## Pontos em aberto

1. **Onde entram os "Links úteis" no painel?** Escrito como um bloco no fim do dashboard. Se ele
   competir com os módulos da trilha, vira uma seção própria.
2. **O convite do grupo do WhatsApp expira?** Se for revogado com frequência, vale mostrar o
   `updatedAt` na tela de admin como aviso de "esse link está velho".
