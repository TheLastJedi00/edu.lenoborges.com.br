# Fase 01: Camada de dados [x]
Branch: `feat/018-legal-camada-de-dados`

Nenhuma tela. Ao fim desta fase o front sabe buscar documento, sabe mandar aceite, e sabe guardar o que
está pendente — e nada aparece ainda.

- [x] Task 01: O modelo. Arquivo: `src/app/models/legal.model.ts`. Objetivo: `LegalDocument` com `id`,
  `title`, `version`, `updatedAt`, `sections: { heading, paragraphs: string[] }[]`;
  `LegalDocumentSummary` com `id`, `title`, `version`; e `LegalAcceptance` com `version` e `acceptedAt`.
  O comentário registra a decisão 2: **`paragraphs` é texto puro e nunca vira HTML** — quem trocar por
  uma string de markup obriga a tela a um `bypassSecurityTrustHtml` que não sai mais de lá.
- [x] Task 02 (TDD + implementação): O serviço. Arquivos: `src/app/core/legal/legal.service.ts`,
  `.spec.ts`. Objetivo: `list()`, `getById(id)` e `accept(documentId, version)`. **Um único caminho de
  gravação** (decisão 5) — o onboarding e o bloqueio do painel chamam este mesmo método, e o teste-trava
  é que `accept` manda `documentId` e `version` no corpo, porque mandar só o id deixaria o backend
  adivinhar a versão e o `409` de aba velha nunca aconteceria.
- [x] Task 03: O store. Arquivo: `src/app/core/legal/legal.store.ts`. Objetivo: `pending` como signal de
  `LegalDocumentSummary[]`, `hasPending` computado, `setPending()` e `clearOne(documentId)`. **Nada de
  `localStorage`** (decisão 9), e o comentário diz o motivo nas duas direções: navegador limpo faria quem
  já aceitou aceitar de novo, e um flag "aceito" gravado por engano esconderia um pendente real para
  sempre.
- [x] Task 04: Os campos no perfil. Arquivo: `src/app/models/auth.model.ts`. Objetivo:
  `pendingLegal: LegalDocumentSummary[]` e `legalAcceptances: Record<string, LegalAcceptance>` em
  `MemberProfile`. O primeiro é o que bloqueia; o segundo é o que a seção Contratos mostra.
- [x] Task 05 (TDD + implementação): O `428` no interceptor. Arquivos:
  `src/app/core/auth/auth.interceptor.ts`, `.spec.ts`. Objetivo: ramo próprio, **antes** do de `401`:
  preenche o `LegalStore` com o `pending` do corpo e repassa o erro. Teste-trava, e é o mais importante
  desta fase: **um `428` não chama `refresh()`, não chama `clearSession()` e não navega** — cair no
  caminho do `401` deslogaria toda a base no deploy desta spec.
- [x] Task 06 (TDD + implementação): O shell alimenta o store. Arquivo:
  `src/app/pages/dashboard/dashboard-shell.ts`. Objetivo: o `pendingLegal` que já vem no `GET /me` entra
  no `LegalStore` na carga (decisão 8). Teste-trava: perfil com pendência deixa `hasPending()` verdadeiro
  **sem que nenhuma outra requisição tenha falhado**.

# Fase 02: Ler o documento [x]
Branch: `feat/018-leitura`

- [x] Task 07: A view do documento. Arquivos: `src/app/components/legal-document-view/`. Objetivo:
  `input.required<LegalDocument>()`, `@for` sobre seções e parágrafos, `h2` por seção. **Zero
  `innerHTML`, zero `DomSanitizer`** — o comentário no topo é a decisão 2 e existe para quem vier
  "melhorar" o texto com markdown.
- [x] Task 08: As páginas públicas. Arquivos: `src/app/pages/legal/legal-document.page.*`,
  `src/app/app.routes.ts`. Objetivo: `/termos-de-uso` e `/politica-de-privacidade`, **rotas de primeiro
  nível, sem guard nenhum e fora do `DashboardShell`** — o comentário na rota aponta a decisão 10 e o
  precedente do `/descadastro`. Uma page só, com o id vindo dos `data` da rota.
- [x] Task 09 (TDD): Spec das páginas. Objetivo: teste-trava de que a rota carrega **sem sessão** — é
  toda a razão de a página existir, e é o que um `authGuard` colado por hábito quebraria sem que nada
  mais falhasse.
- [x] Task 10: O rodapé da landing. Arquivo: `src/app/pages/landing/landing.page.html`. Objetivo: os dois
  `routerLink` no rodapé que já existe, na mesma mono das outras linhas (decisão 12). Não vira menu, não
  ganha colunas.

# Fase 03: O modal de aceite [x]
Branch: `feat/018-modal-de-aceite`

- [x] Task 11: O componente. Arquivos: `src/app/components/legal-accept-dialog/`. Objetivo: `<dialog>` com
  `showModal()`, cabeçalho com título e versão, corpo rolável com o `LegalDocumentView`, rodapé fixo com
  check e botão. `input documentId`, `input readonly = false`, `output accepted`. Carrega o documento ao
  abrir, e mostra estado de carregando — o texto vem da rede e não é curto.
- [x] Task 12: O check e o botão. Objetivo: check **habilitado desde o primeiro instante** (decisão 4); o
  botão de aceitar desabilitado enquanto ele estiver desmarcado. O comentário registra o que foi
  recusado e por quê: prender o check à rolagem prova que uma roda girou, não que alguém leu, e quebra
  para leitor de tela, Ctrl+F e celular.
- [x] Task 13: Modo leitura. Objetivo: com `readonly`, some o check, some o botão de aceitar, e o rodapé
  vira "Fechar". Mesmo componente — a segunda cópia da diagramação do texto é a que fica errada na tela
  que ninguém abre (decisão 3).
- [x] Task 14 (TDD): Spec do diálogo. Objetivo: três travas — o botão de aceitar não habilita com o check
  desmarcado; confirmar chama `LegalService.accept` **com a versão que veio no documento**, não com uma
  constante; e em `readonly` não existe caminho para chamar `accept`.
- [x] Task 15: Acessibilidade. Objetivo: `aria-labelledby` no `<dialog>`, foco inicial no corpo do texto
  (não no botão — o botão primeiro anuncia a ação antes do conteúdo), e o corpo rolável com `tabindex="0"`
  para quem rola pelo teclado.

# Fase 04: Onboarding [x]
Branch: `feat/018-onboarding`

- [x] Task 16: Os dois botões. Arquivos: `src/app/pages/completar-perfil/completar-perfil.page.*`.
  Objetivo: bloco acima do submit com um botão por documento e o estado ao lado — "pendente" ou "aceito".
  Os documentos vêm de `LegalService.list()`, **não de uma lista escrita aqui** (decisão 1): no dia em que
  houver um terceiro documento, esta tela não muda.
- [x] Task 17: A trava no submit. Objetivo: o botão de concluir soma as validações que já tem à condição
  de os dois estarem aceitos. O comentário deixa claro que é conveniência e que quem barra é o `428` do
  `PATCH /me/profile` (decisão 6) — mesma divisão do `adminGuard`.
- [x] Task 18 (TDD): Spec do onboarding. Objetivo: teste-trava de que o submit **continua desabilitado
  com o formulário inteiro válido e um documento pendente**. É a única combinação que interessa, e é a
  que um refactor de validação apaga sem perceber.
- [x] Task 19 (TDD): O aceite grava na hora. Objetivo: confirmar o modal chama `accept` **antes** do
  submit do formulário, e um F5 depois disso mantém o documento aceito (decisão 5). Sem esta trava, a
  primeira "simplificação" junta os dois aceites no corpo do `PATCH`.

# Fase 05: O bloqueio no painel [x]
Branch: `feat/018-bloqueio-do-painel`

- [x] Task 20: O componente. Arquivos: `src/app/components/legal-block-dialog/`. Objetivo: `<dialog>` em
  tom de alerta, com `(cancel)="$event.preventDefault()"`, **sem botão de fechar, sem "agora não", sem
  fechamento no backdrop**. Lista os pendentes, um botão por documento que abre o `LegalAcceptDialog`.
  **Não reusa o `ConfirmDialog`** — o comentário no topo diz por quê (decisão 7): aquele existe para ser
  cancelável, e um componente chamado `LegalBlockDialog` cujo `cancel` é `preventDefault` se explica ao
  ser lido.
- [x] Task 21: Tom de alerta, não de erro. Objetivo: paleta de aviso, não a vermelha de `--danger`. Quem
  está vendo aquilo não fez nada errado; o texto diz que os termos foram publicados e que o acesso volta
  assim que forem aceitos.
- [x] Task 22: Montar no shell. Arquivo: `src/app/pages/dashboard/dashboard-shell.ts`. Objetivo: renderiza
  quando `legalStore.hasPending()`, some quando o último pendente sair. Fica **por cima de tudo**,
  inclusive do sino e do menu.
- [x] Task 23 (TDD): Spec do bloqueio. Objetivo: quatro travas — aparece com pendência; **Esc não fecha**;
  não existe elemento clicável que feche sem aceitar; e some sozinho quando o store esvazia. A segunda e
  a terceira são o componente inteiro: um bloqueio que fecha no Esc não é um bloqueio.
- [x] Task 24: Conferir no navegador. Objetivo: com um documento pendente e com dois. E conferir que o
  bloqueio **não aparece** em `/completar-perfil` — quem está lá tem os dois botões da Fase 04, e os dois
  ao mesmo tempo seriam dois pedidos de aceite na mesma tela.

# Fase 06: Contratos em Meu Perfil [x]
Branch: `feat/018-contratos-no-perfil`

- [x] Task 25: A seção. Arquivos: `src/app/pages/perfil/perfil.page.*`. Objetivo: quinta seção, depois de
  E-mails e **antes de Excluir conta**, que continua sendo a última (decisão 11). Uma linha por documento:
  título, "versão de 27/08/2026", "aceita em 12/03/2026" e um botão que abre o modal em modo leitura.
- [x] Task 26: Documento sem aceite registrado. Objetivo: mostra "não aceita" em vez de data vazia. É o
  estado de quem tem pendência aberta e navegou até aqui — improvável com o bloqueio de pé, e é
  exatamente por isso que ninguém veria uma célula em branco antes de um usuário ver.
- [x] Task 27 (TDD): Spec da seção. Objetivo: as duas datas aparecem formatadas em pt-BR pelo `core/datas`
  que já existe, e o botão abre o modal com `readonly` — teste-trava, porque abrir sem `readonly` daria
  um check de aceite numa tela de consulta.

# Fase 07: Fechar [x]
Branch: `feat/018-fechamento`

- [x] Task 28: `npm run lint` e `npm test`, tudo verde.
- [x] Task 29: Percurso completo no navegador. Objetivo: (a) ler os dois documentos pelo rodapé da
  landing, **deslogado**; (b) cadastro novo, onboarding travado até os dois aceites; (c) membro antigo
  com pendência, bloqueio no painel, aceite, painel liberado sem recarregar; (d) Meu Perfil mostrando as
  duas datas.
- [x] Task 30: `CLAUDE.md`. Objetivo: registrar que **o front não tem opinião sobre versão de documento
  legal** (decisão 1) e que o `428` é tratado no interceptor **fora do caminho do refresh** (spec 011
  afetada) — as duas linhas que, se esquecidas, produzem os dois piores erros possíveis desta spec:
  contrato desatualizado sem ninguém saber, e base inteira deslogada num deploy.

# Fase 08: Fix — o que o navegador pegou [x]
Branch: `fix/018-modal-nao-abre`

As fases 01 a 07 terminaram verdes, e **três defeitos sobreviveram a elas**. Os três só apareceram no
percurso de navegador das tasks 24 e 29, e os três tinham teste passando por cima.

- [x] Task 31: O modal não buscava o texto. O diálogo vivia dentro de um `@if` e era aberto numa
  `queueMicrotask`; em zoneless a microtask roda **antes** de o Angular criar o componente, então a
  referência era `undefined` e o `?.` engolia a chamada em silêncio. O modal abria preso em
  "Carregando o documento...". Correção: o diálogo fica **sempre renderizado** e o id vem no argumento
  de `open(id)` — a corrida deixa de existir, em vez de ser sincronizada.
- [x] Task 32: O bloqueio do painel **fechava no Esc**. `preventDefault()` no `cancel` não basta: por
  especificação, o Chrome só torna esse evento cancelável quando há *user activation* recente, e sem
  ela o Esc fecha direto — o painel ficava acessível sem ninguém ter aceitado nada. Correção: reabrir
  no `close` enquanto houver pendência, o que cobre qualquer caminho de fechamento sem depender de a
  plataforma cooperar.
- [x] Task 33: `.modal { display: flex }` sobrescrevia o `display: none` nativo do `<dialog>` fechado, e
  ele aparecia desenhado no meio do formulário. O display foi para o `[open]`.
- [x] Task 34: As travas novas. Um clique e **um** ciclo de detecção têm de bastar para a requisição do
  documento sair; o diálogo fechado tem de computar `display: none`; e fechar o bloqueio por fora tem
  de reabri-lo. As três foram verificadas **revertendo a correção** e vendo o teste ficar vermelho —
  sem isso não dá para saber se a trava trava.
- [x] Task 35: Cartão por linha na seção Contratos, reusando o `.acesso` que já existia. O espaçamento
  tinha ficado colado quando o CSS foi espremido para caber no budget de estilo da página.

## O que estes três defeitos ensinam sobre os testes desta spec

Os três tinham cobertura verde, e a cobertura era enganosa pelo mesmo motivo nos três: **ela exercitava
o componente, não o caminho do usuário**. `open()` chamado direto, com o componente já montado, nunca
encontra a corrida do host; `defaultPrevented` de um evento sintético prova que o handler pediu para
cancelar, não que o navegador aceitou; e nenhum teste de DOM enxerga um `display` errado.

A regra que fica, e que vale para a próxima spec com `<dialog>`: **teste pelo host, sem esperas
artificiais no meio, e verifique o efeito na plataforma — não a intenção do código.**

# Fase 09: Mobile first, que era a regra e ficou por último [x]
Branch: `fix/018-mobile`

O clauderc do front põe **Mobile First** como regra 2, e as fases 01 a 08 desenharam tudo no desktop. O
overview em 390px mostrou três problemas, todos no bloqueio do painel — a tela mais crítica da spec.

- [x] Task 36: No cartão de cada documento, o `justify-content: space-between` espremia as duas colunas
  em 390px: "Política de Privacidade" quebrava em duas linhas e o botão "Ler e aceitar" também, cada um
  brigando pela metade da largura. Agora o item é **empilhado por padrão** e vira linha a partir de
  `30rem` — mobile primeiro de verdade, e não uma media query corrigindo o desktop.
- [x] Task 37: `white-space: nowrap` no botão. "Ler e" numa linha e "aceitar" na outra dobrava a altura
  sem ganhar nada.
- [x] Task 38: A nota do rodapé do bloqueio saiu do `u-mono`. Em caixa alta e mono ela virava **quatro
  linhas** e dominava o cartão, competindo com os botões, que são a ação. O texto também encurtou.
- [x] Task 39: Em Contratos, a meta virou duas linhas em vez de uma com `·` no meio — em 390px a linha
  única quebrava logo depois do separador e deixava o ponto pendurado. Dois parágrafos empilham
  sozinhos, **sem CSS novo**, o que também respeita o budget de estilo da página.

## O que foi conferido em 390px

Documentos públicos, rodapé da landing, onboarding com o bloco de aceite, modal de aceite (corpo
rolável e rodapé fixo com check e botões visíveis), bloqueio do painel, e Contratos. **Nenhuma tela tem
overflow horizontal**, e o desktop foi reconferido depois para garantir que nada regrediu.

Nota de método: a extensão do Chrome renderiza numa viewport fixa e `resize_window` não a altera. O
percurso mobile foi feito **dentro de um iframe de 390px**, onde as media queries valem de verdade —
`matchMedia('(max-width: 47.99rem)')` responde `true` lá dentro.
