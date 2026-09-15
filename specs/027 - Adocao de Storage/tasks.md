# Spec 027 (front): Adoção de Storage — Tasks

> Regras do repositório que valem em toda task: sem emojis (SVG componentizado), Mobile First,
> nada de travessão nos textos de tela, gradientes e animações em `.scss`, `animate-enter` /
> `animate-leave`, Dumb Components e Smart Pages, `Promise.all` quando a página faz mais de uma
> requisição, e **TDD nos services**.
> Uma branch `feat/` por fase, um commit por task, um push por fase. Testar no Chrome sempre.
> O par no backend é a spec 027 de lá, e as duas entram juntas — as fases do back precisam estar
> de pé antes da fase correspondente aqui virar tela funcionando.

> **O arquivo sobe para a nossa API, nunca do navegador para o Storage** (decisão 1). Nada de
> `firebase` no bundle: a spec 005 decidiu que este front não fala com o Firebase e a spec 020
> recusou o SDK web mesmo custando três rotas novas na API. A única dependência que esta spec
> adiciona é o `ngx-image-cropper`.

---

# Fase 01: Dependência, modelos e serviços [x]

Ao fim desta fase a integração conhece as rotas e os campos novos. Nenhuma tela muda de aparência.

- [x] Task 01: `package.json` — `npm i ngx-image-cropper` (9.x; `peerDependencies` de Angular
  `>=17.3.0`, satisfeito pelo 20.3 daqui).
  **É a primeira dependência de UI do repositório**, que hoje tem exatamente Angular e rxjs, e vale
  escrever no commit o que ela resolve: não é o recorte, é o **gesto** — arrastar e dar zoom com mouse e
  com o dedo, mais a rotação do EXIF que toda foto de celular traz e que faz o retrato chegar deitado.
  Conferir o tamanho que ela acrescenta ao bundle no `ng build` e anotar no commit.
- [x] Task 02: `src/app/models/auth.model.ts` —
  - `MemberProfile` ganha `readonly avatarUrl: string | null;` — **não opcional**, seguindo `linkedin` e
    `instagram`: a API sempre manda o campo, e `null` é "não tem foto".
  - `PublicMember` ganha `readonly avatarUrl: string | null;`, que é o card público da spec 019.
  - **`UpdateProfileRequest` não é tocado** (decisão 1): a foto não passa por `PATCH /me/profile`, que
    exige nome, telefone e bio.
- [x] Task 03: `src/app/models/games.model.ts` — `RankingEntry` ganha
  `readonly avatarUrl: string | null;`. O campo vem na mesma resposta que já traz `nickname` e `xp`, e o
  comentário diz por quê: o placar não lê a coleção de perfis, e buscar o avatar por membro
  transformaria uma tela em N requisições.
- [x] Task 04: `src/app/models/training.model.ts` — o payload da conclusão vira um objeto:
  `CompleteTrainingRequest` com `hintsUsed?: number`, `mainCode?: string` e `resultImageUrl?: string`.
  Os três opcionais, pela razão que o back já registrou no DTO: a tela antiga manda `{}` na janela entre
  os dois deploys.
- [x] Task 05: `src/app/core/auth/auth.store.ts` e `.spec.ts` — `setAvatarUrl(avatarUrl: string | null)`,
  decalcado do `setXp` logo acima: lê o perfil atual, sai se não houver, e reescreve só esse campo.
  Existe para a foto nova aparecer no aside e no card sem um `GET /me` novo.
- [x] Task 06: `src/app/core/auth/auth.service.spec.ts` e `.ts` — **teste antes**:
  - `setAvatar(file: Blob)`: monta `FormData` com o campo `file` e faz `POST /me/avatar`, respondendo
    `{ avatarUrl }`, e no `tap` chama `authStore.setAvatarUrl`.
    **Não montar `Content-Type` na mão**: o navegador precisa escrever o `boundary` do multipart, e um
    header fixado a mão quebra o upload com um erro que não fala de header.
  - `removeAvatar()`: `DELETE /me/avatar` e `setAvatarUrl(null)`.
  - As duas moram aqui pela mesma razão do `setSocialLinksPublic` e do `setNickname`: são escritas em
    `/me`. O comentário aponta para o vizinho, que já explica por que não é campo de
    `PATCH /me/profile`.
- [x] Task 07: `src/app/services/training.service.spec.ts` e `.ts` — **teste antes**:
  - `complete(trainingId, request: CompleteTrainingRequest)` — a assinatura deixa de ser posicional.
    Trocar `complete(id, hintsUsed)` por um objeto é o que impede o terceiro argumento de entrar na
    ordem errada quando `mainCode` e `resultImageUrl` chegarem juntos.
  - `uploadResultImage(trainingId, file: Blob)`: `FormData` em
    `POST /trainings/:trainingId/result-image`, respondendo `{ resultImageUrl }`.
  - Testar o `403` da rota de upload chegando ao chamador, porque é ele que a tela traduz.


> **Fase 01 concluida.** 813 testes verdes, `ng build` ok. O `ngx-image-cropper` **nao entrou no
> bundle inicial** -- nada o importa ainda, e ele vai cair no chunk do modal quando a fase 03 o usar.
>
> Dezessete fixtures de spec precisaram do campo novo, todas apontadas pelo compilador. O
> `insignia.page.ts` foi adaptado para a assinatura nova do `complete` mantendo o comportamento de
> hoje: a submissao de verdade e da fase 04.

---

# Fase 02: O componente de avatar []

Ao fim desta fase existe um jeito só de desenhar a foto de um membro, e ele é usado em três telas.

- [] Task 01: `src/app/components/avatar/` (`.ts`, `.html`, `.scss`, `.spec.ts`) — `app-avatar`,
  componente burro: `input()` de `avatarUrl: string | null`, `name: string | null` e um `size`
  (`'sm' | 'md' | 'lg'`).
  **O fallback é novo, não uma substituição** (decisão 1): hoje não existe avatar em tela nenhuma e
  nenhuma tela desenha iniciais — o ranking mostra só o `nickname`. Com `avatarUrl` nulo ele desenha as
  iniciais em círculo; com URL, a foto.
  Ele nasce em um lugar só porque senão a regra do fallback é reescrita em cada tela e as três divergem
  na primeira mudança.
  - `alt` descritivo ("Foto de Fulano"), e `alt=""` com `aria-hidden` quando cai nas iniciais, que já
    são texto e não precisam ser lidas duas vezes.
  - `loading="lazy"` e `decoding="async"`. **Não usar `NgOptimizedImage`**: ele é para imagem estática
    com dimensão conhecida em build, e esta é uma URL que chega em runtime.
  - `onerror` caindo nas iniciais — a URL pode responder 404 depois de a foto ser removida em outra aba,
    e uma imagem quebrada no meio do placar é pior que as iniciais.
  - `.scss`: círculo com `aspect-ratio: 1`, `object-fit: cover`, e o gradiente suave do projeto no
    fundo das iniciais.
- [] Task 02: `src/app/pages/jogos/ranking/ranking.page.html` e `.spec.ts` — `app-avatar` ao lado do
  `nickname`, nos dois lugares que o desenham: o pódio (`podium__nick`) e a tabela (`table__nick`).
  Mobile First: na tabela o avatar é `sm` e não empurra a coluna de XP para fora em 360px de largura —
  conferir no Chrome com o viewport estreito, que é onde essa tabela sempre sofre.
- [] Task 03: `src/app/components/member-card-dialog/member-card-dialog.ts` e `.spec.ts` — o avatar no
  topo do card, tamanho `lg`, a partir do `avatarUrl` novo do `PublicMember`.
  **Template inline**, como o componente já é — não criar `.html` nem `.scss` novos aqui.
- [~] Task 04: ~~`dashboard-aside` — o avatar junto do nome de quem está logado.~~ **Não feita, de
  propósito.** Duas razões, e as duas apareceram só ao abrir o arquivo:
  1. **O aside não tem bloco de identidade nenhum** — não mostra nome, nem e-mail, nem nada da pessoa.
     É navegação: logo, itens, e o rodapé com Administração e Sair. Pôr o avatar ali exigiria **criar**
     um bloco "quem sou eu" no meio do menu, com o estado recolhido para resolver.
  2. **O `context.md` desta spec não pede isso.** A lista de visibilidade dele é Ranking, cartão
     público de membro e o próprio Meu Perfil — os três estão cobertos. Esta task saiu de uma frase que
     eu escrevi no plano ("é a tela onde a pessoa mais vai notar"), e não da spec.
  Se o bloco de identidade no aside for desejado, ele é uma decisão de UI própria e merece a sua linha
  no `context.md` antes de virar código.

---

# Fase 03: Trocar a foto no Meu Perfil []

Ao fim desta fase o membro recorta, envia e remove a própria foto.

- [] Task 01: `src/app/components/avatar-dialog/` (`.ts`, `.html`, `.scss`, `.spec.ts`) — o modal
  dedicado, no molde dos outros diálogos do projeto (`nickname-dialog`, `delete-account-dialog`):
  - Um `<input type="file" accept="image/jpeg,image/png,image/webp">` escondido atrás de um botão do
    projeto, e o `image-cropper` do `ngx-image-cropper` aparecendo depois da escolha.
  - Configuração do cropper: `[imageFile]` com o `File` escolhido, `[roundCropper]="true"`,
    `[maintainAspectRatio]="true"`, `[aspectRatio]="1"`, `[resizeToWidth]="200"`,
    `[resizeToHeight]="200"`, `output="blob"`, `format="webp"` e `[imageQuality]="85"`.
    **O recorte já sai em 200x200**, então não existe um passo de canvas nosso depois — é o mesmo
    canvas, uma vez (decisão 1).
  - O `(imageCropped)` guarda o `event.blob` num signal. **Nada sobe antes de a pessoa confirmar**: o
    cropper emite a cada arrasto, e subir no evento faria um upload por pixel movido.
  - Estados visíveis: escolhendo, recortando, enviando, erro com "tentar de novo". O botão de confirmar
    fica desabilitado enquanto envia, e o modal não fecha sozinho no erro.
  - `(loadImageFailed)` do cropper virando mensagem de arquivo não suportado — é o que acontece com um
    HEIC do iPhone, que o `accept` não barra sozinho.
  - Quem já tem foto vê **"Remover foto"** dentro do modal (decisão 1), atrás do `ConfirmDialog` que já
    existe: sem essa saída, quem subiu a foto errada só pode trocar por outra.
  - Emite `saved` com o `Blob` e `removed`; **ele não chama serviço nenhum** — quem chama é a página.
  - O `.spec.ts` trava o fluxo: escolher habilita o recorte, confirmar emite o `Blob`, e o `imageCropped`
    por si só não emite nada.
- [] Task 02: `src/app/pages/perfil/perfil.page.html`, `.ts`, `.scss` e `.spec.ts` — a seção da foto no
  topo de "Seus dados", com o `app-avatar` no tamanho `lg` e o botão que abre o `avatar-dialog` dentro de
  um `@if`.
  No `saved`, chamar `auth.setAvatar(blob)`; no `removed`, `auth.removeAvatar()`. O `AuthStore` já
  atualiza a tela toda pelo `setAvatarUrl`, então **não recarregar o perfil** depois.
  Erro fica na tela com a saída, no molde das outras seções desta página.
- [] Task 03: `src/app/pages/perfil/perfil.page.spec.ts` — o `403` e o `413` da rota virando mensagem
  que diz o que fazer ("a imagem precisa ter no máximo 5 MB"), e não o texto cru do backend.

---

# Fase 04: Submissão na Arena []

Ao fim desta fase o membro manda o código, e o Great Dev+ manda a foto do resultado.

- [] Task 01: `src/app/components/training-dialog/training-dialog.ts`, `.html`, `.scss` — a área de
  resposta antes de "Concluir Desafio":
  - `textarea` para o `mainCode`, com a instrução acima dele: **"Use Ctrl+A, Ctrl+C e Ctrl+V para copiar
    e colar apenas o conteúdo da classe main."** Disponível para todos os tiers.
  - `mainCode` num signal, e o `concluir` passa a emitir `output<CompleteTrainingRequest>()` em vez do
    número de dicas.
  - O desafio já concluído mostra o que foi enviado, em leitura, e não o formulário — a segunda
    conclusão não reescreve a submissão (o back grava a da primeira), e oferecer o campo prometeria uma
    edição que não existe.
- [] Task 02: `training-dialog.ts` e `.html` — o envio da foto, atrás do tier:
  - O gate é o **`authStore.isPaid`, que já existe** (`tier() !== 'dev-tier'`) — não criar um segundo
    computed com a mesma conta.
  - Dev Tier vê a área desabilitada com o badge "O envio de fotos com o resultado é uma feature
    exclusiva para membros Great Dev e superiores". Desabilitada e visível, não ausente: é o mesmo
    desenho da trava de comentários, e um recurso que não aparece não vende upgrade.
  - **O upload acontece na seleção, não no submit** (decisão 2): `uploadResultImage` na hora, com
    estado de enviando e erro com "tentar de novo", e o "Concluir Desafio" só libera quando a URL
    chegou. Um upload disparado junto do submit faria a conclusão falhar pela metade com o XP já em jogo.
  - A miniatura do que foi enviado, com opção de trocar.
  - O `403` da rota virando a mesma mensagem do badge — a tela não oferece o botão, mas a trava de
    verdade é a do servidor, e se ela falar é ela que manda.
- [] Task 03: `training-dialog.spec.ts` — o `textarea` aparece para Dev Tier; a área de foto está
  desabilitada com o badge para Dev Tier e habilitada para Great Dev; selecionar dispara o upload uma
  vez; concluir emite `hintsUsed`, `mainCode` e `resultImageUrl` juntos; concluir fica travado enquanto
  o upload não termina; desafio concluído mostra a submissão em leitura.
- [] Task 04: `src/app/pages/trilha/insignia/insignia.page.ts` e `.spec.ts` — o
  `concluirTreinamento(request)` repassa o objeto inteiro para `trainings.complete(id, request)`.
  **O `AuthStore` continua recebendo `resultado.xp`, o valor do servidor** — nunca uma soma local. É a
  decisão da spec 023, e o comentário do método já diz isso.

---

# Fase 05: Acessibilidade e fechamento []

- [] Task 01: Revisar o modal de avatar com leitor de tela. O cropper é uma área de manipulação
  visual, então o que precisa existir é a alternativa por teclado: o `cropperFrameAriaLabel` preenchido,
  o botão de confirmar alcançável por tab, e o foco voltando para o botão que abriu o modal quando ele
  fecha. Se o arrasto não tiver caminho por teclado, a tela diz isso em texto em vez de fingir que tem.
- [] Task 02: Conferir o `prefers-reduced-motion` na entrada do modal e na troca da foto, e o
  `animate-enter` / `animate-leave` nos dois diálogos novos.
- [] Task 03: Mobile First de verdade, no Chrome em 360px: o cropper com o dedo, a tabela do ranking com
  o avatar novo, e a área de resposta do `training-dialog` sem estourar a largura do modal.
- [] Task 04: `npm test` limpo e `ng build` passando. Anotar o custo no bundle do `ngx-image-cropper`.
- [] Task 05: Percorrer a spec no Chrome contra a API de verdade, com o back local ligado ao
  `dev-liga-dev`. O que só a execução prova: o EXIF de uma foto tirada no celular chegando de pé, o
  `?v=` da URL derrubando o cache depois da segunda troca, o membro sem gamertag continuando fora do
  placar depois de pôr foto, o Dev Tier levando `403` se forçar a rota de upload, e a foto aparecendo no
  aside sem recarregar a página.
- [] Task 06: Marcar as emendas nas specs afetadas, conferindo que cada uma bate com o que foi
  implementado: a **005** e a **013** com `Deprecated` na recusa do avatar, e a **019**, **022**, **023**
  e **025** com o bloco de emendas no topo do `context.md`. A seção "Specs Afetadas" desta spec já lista
  as seis.
