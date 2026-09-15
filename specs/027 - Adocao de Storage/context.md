# Spec 027: Adoção de Storage

## Objetivo
Introduzir o uso de Storage (armazenamento de arquivos) no Frontend para permitir que os membros da liga tenham avatares em seus perfis e possam enviar fotos dos resultados de seus treinamentos na Arena (feature sujeita ao Tier do usuário).
O Dev Tier passa a contar com um campo para enviar o código de resposta (Ctrl+C / Ctrl+V da classe main), enquanto o Great Dev Tier e superiores ganham a exclusividade de poder enviar o resultado como foto.

O par desta spec no back é a **027**, e as duas entram juntas.

---

## Decisões

### 1. Upload de Avatar (Perfil do Usuário)
Na tela "Meu Perfil" (`/dashboard/perfil`), será introduzida uma UI para alterar a foto (avatar) do usuário.
- A escolha da foto será feita através de um **modal dedicado**, que abrirá o seletor de arquivos.
- **Crop (Recorte):** O modal deve oferecer uma ferramenta de corte com o padrão de formato arredondado (rounded), pela biblioteca **`ngx-image-cropper`** (`roundCropper`).
  É a primeira dependência de UI do repositório, que hoje tem exatamente Angular e rxjs, e a troca é consciente: o que a biblioteca resolve não é o recorte, é o **gesto** — arrastar e dar zoom com mouse e com o dedo, dentro do Mobile First, mais a rotação do EXIF que toda foto de celular traz e que faz o retrato chegar deitado. Escrever isso à mão é o tipo de código que parece pronto no desktop e falha no toque.
- **Compressão:** o recorte sai da própria biblioteca já em `200x200` (`resizeToWidth`/`resizeToHeight`, `output: 'blob'`, `format: 'webp'`, `imageQuality`), então não há um passo de canvas nosso depois — é o mesmo canvas, uma vez.
- **O upload vai para a nossa API, não para o Storage.** O `Blob` do recorte entra num `FormData` e vai em `POST /me/avatar` (`multipart/form-data`, campo `file`), que responde `{ avatarUrl }` **já persistido**. Nada de Client SDK do Firebase no bundle: a spec 005 decidiu que este front não fala com o Firebase, e a spec 020 recusou instalar o SDK web mesmo custando três rotas novas na API para tratar o `oobCode` — uma foto não é motivo para reabrir essa porta.
- **Não há `PATCH /me/profile` no caminho da foto.** Aquela rota exige nome, telefone e bio: trocar o avatar por ela faria o modal reenviar o cadastro inteiro, e um campo que exige reenviar o cadastro é um campo que ninguém mexe.
- **Remover a foto é `DELETE /me/avatar`**, e o modal oferece isso para quem já tem uma — sem essa saída, quem subiu a foto errada só pode trocar por outra.
- O modelo de perfil do membro (`MemberProfile`, em `auth.model.ts`) passará a refletir a existência do `avatarUrl` (string ou null). **Não é o `Profile` de `profile.model.ts`**, que é o perfil do professor na landing (spec 001) e não tem nada a ver com o membro logado.
- **Visibilidade:** O avatar passará a ser exibido no **Ranking da Liga** (spec 022) e no card público de membro (`member-card-dialog`, spec 019), além do próprio Meu Perfil.
- **O fallback de quem não tem foto precisa ser criado, não substituído.** Hoje não existe avatar em tela nenhuma, e nenhuma tela desenha iniciais — o ranking mostra só o `nickname`. Então entra um componente burro novo, `app-avatar`, que recebe `avatarUrl` e um nome e desenha a foto ou as iniciais em círculo. Ele nasce em um lugar só porque senão a regra do fallback é reescrita em cada tela e as três divergem na primeira mudança.

### 2. Respostas e Upload na Arena de Treinamento
No modal de Treinamento (`training-dialog`), o fluxo de submissão do desafio é aprimorado:

**Seção de Resposta:**
- Antes de "Concluir Desafio", o modal exibirá uma área de resposta.
- Essa área conterá um `textarea` destinado ao código. Acima dele, haverá uma instrução clara para o aluno: **"Use Ctrl+A, Ctrl+C e Ctrl+V para copiar e colar apenas o conteúdo da classe main."** Este campo (`mainCode`) estará disponível para todos os Tiers.

**Envio de Foto de Resultado (Restrição de Tier):**
- A funcionalidade de anexar uma foto com o resultado (`resultImageUrl`) é **exclusiva do Great Dev Tier e superiores**.
- Membros do Dev Tier (`tier === 'dev-tier'`) não visualizarão o botão/área de upload da imagem, ou o verão desabilitado com um aviso (badge) informando que "O envio de fotos com o resultado é uma feature exclusiva para membros Great Dev e superiores".
- Se habilitado, o membro seleciona o arquivo e ele sobe em `POST /trainings/:trainingId/result-image` (`multipart/form-data`), que devolve `{ resultImageUrl }`. **A trava de tier de verdade está nessa rota**, que responde `403` para o Dev Tier antes de gravar o arquivo; o que a tela faz é não oferecer o botão, que é cortesia e não segurança.
- **O upload acontece na hora da seleção, e não no submit**, com estado visível de enviando e erro com opção de tentar de novo. Só depois que a URL chega o "Concluir Desafio" fica liberado — um upload disparado junto do submit transformaria a conclusão num pedido que pode falhar pela metade, depois de o XP já estar em jogo.
- Ao clicar em "Concluir Desafio", os novos campos `mainCode` e `resultImageUrl` (se aplicável e preenchido) serão enviados junto com o `hintsUsed` (da spec 025) no payload de `POST /trainings/:trainingId/complete`.

---

## Modificações em Interfaces

### Modelo de Perfil e Auth
Em `src/app/models/auth.model.ts`:
- `MemberProfile` ganha `readonly avatarUrl: string | null;` — **não opcional**, seguindo `linkedin` e `instagram`: o backend sempre manda o campo, e `null` é "não tem foto".
- `UpdateProfileRequest` ganha `readonly avatarUrl?: string;` — **opcional aqui sim**, pela mesma regra já escrita ao lado das redes sociais: campo ausente é "não mencionei" e a API não toca no valor guardado, string vazia é "quero apagar". Mandar `''` "para simplificar" apaga a foto de quem só editou a bio.
- O formulário de edição de perfil deve repassar essa alteração na submissão.

### Modelo do Card Público
`PublicMember` (em `auth.model.ts`) ganha `readonly avatarUrl: string | null;`, que o `member-card-dialog` desenha pelo `app-avatar`.

### Modelo do Ranking
Em `src/app/models/games.model.ts`, `RankingEntry` ganha `readonly avatarUrl: string | null;`, que é o que alimenta a foto ao lado do nickname no placar. **O campo vem da coleção `ranking`, na mesma resposta que já traz `nickname` e `xp`** — o placar não lê a coleção de perfis, e buscar o avatar por membro transformaria uma tela em N requisições. `null` cai no fallback de iniciais do `app-avatar` — que é novo, porque hoje não há avatar nem iniciais em tela nenhuma.

### Dependência nova
`package.json` ganha `ngx-image-cropper` (9.x, `peerDependencies` de Angular `>=17.3.0`, satisfeito pelo 20.3 daqui). É a única dependência que esta spec adiciona — **nada de `firebase`**.

### O Modelo TrainingCompletion (ou Request Payload)
O payload da chamada de conclusão no `TrainingService` (ex: `complete(trainingId, request)`) passará a ter a assinatura que comporta:
```typescript
{
  hintsUsed?: number;
  mainCode?: string;
  resultImageUrl?: string;
}
```

---

## Specs Afetadas

### Spec 005 (Autenticação e Dashboard) — Parcialmente Deprecated
Na seção "Fora de escopo" da spec 005 constava "Alterar e-mail da conta, excluir conta e upload de
avatar", com a nota de que o avatar continuava fora. Essa parte cai e agora está Deprecated.

### Spec 013 (Meu Perfil) — Parcialmente Deprecated
Na seção "Fora de escopo" desta spec, a recusa sobre a troca da foto de perfil ("Não há avatar no produto") cai. O perfil passa a ter suporte de avatar alimentado por Storage, tornando essa restrição Deprecated.

### Spec 019 (Vídeos Assistidos e XP) — Vigente, estendida
O `member-card-dialog` criado na 019 passa a mostrar a foto do membro, pelo `avatarUrl` novo do `PublicMember`. O resto do card não muda.

### Spec 022 (Jogos, GYM Challenge e Ranking) — Vigente, estendida
O Ranking passa a desenhar a foto do membro ao lado do nickname, a partir do `avatarUrl` que já vem
na resposta do placar. A ordenação, o selo de posições ganhas e o restante do card não mudam.

### Spec 023 e 025 (Arena de Treinamento) — Vigentes, estendidas
A mecânica do modal e dos passos/dicas (hints), bem como o cálculo de XP, não mudam. A única adição é o passo extra na UI de preencher a submissão (código e/ou foto) antes de disparar a requisição de conclusão.
