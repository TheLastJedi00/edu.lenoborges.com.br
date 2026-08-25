# Spec 013: Meu Perfil

## Objetivo
O cartão **Meu Perfil** está no painel desde a spec 005, cinza, com o selo "Em breve". O item do menu
lateral idem, `disabled`, há oito specs. O comentário no `dashboard.page.html` é honesto sobre o motivo:
*"não existe rota de perfil em `app.routes.ts`"*.

Esta spec cria a rota. Ela é a primeira tela do produto onde a pessoa **muda o que o produto sabe sobre
ela** — nome, bio, telefone, redes — e a primeira onde ela pode **ir embora**: trocar o e-mail de acesso,
trocar a senha, ou apagar a conta inteira.

As três de baixo não são formulário, são credencial e direito de eliminação. O que a spec faz com elas é
menos desenho e mais **dizer a verdade antes do clique**: trocar a senha desloga, trocar o e-mail exige
confirmar no endereço novo, e excluir a conta não tem volta. Nenhuma das três pode surpreender.

O par desta spec no backend é a **013**, e as duas entram juntas.

---

## Numeração
Os números são iguais nos dois repositórios: 011 é a Sessão que Sobrevive ao F5, 012 é Notificações
Internas, 013 é esta.

---

## Decisões

### 1. Uma tela, quatro seções, nenhuma sub-rota
`/dashboard/perfil`, e tudo mora nela:

| Seção | O que tem |
|---|---|
| **Seus dados** | nome, telefone, bio — um formulário, um botão de salvar |
| **Suas redes** | LinkedIn e Instagram, os dois opcionais |
| **Acesso** | trocar de e-mail, trocar de senha |
| **Excluir conta** | a saída, separada de tudo |

Quatro rotas dariam quatro telas em branco para editar três campos. E a seção de exclusão precisa estar
**na mesma tela**, no fim, longe: escondê-la atrás de uma rota própria é o padrão que faz a pessoa
procurar no suporte como sair do produto — e ninguém deveria precisar pedir ajuda para ir embora.

Redes ficam numa seção separada de "Seus dados", com botão próprio, porque são opcionais e o resto não é.
Juntas num formulário só, um LinkedIn mal colado bloquearia salvar a bio.

### 2. Salvar é um botão, e a tela não salva sozinha
Sem autosave, sem salvar ao sair do campo. O botão fica desabilitado enquanto nada mudou e enquanto o
formulário estiver inválido, e vira "Salvando…" durante a requisição.

Autosave em campo de texto livre é o padrão que grava a bio pela metade toda vez que alguém para de
digitar para pensar. E não há como desfazer: o `PATCH` sobrescreve.

**Sair da tela com alteração não salva avisa** — um `confirm-dialog`, não um `beforeunload`. Trocar de
aba do painel é um clique, e a bio é o campo mais longo que o produto tem.

### 3. Nome novo não reescreve as perguntas antigas
`authorName` está gravado dentro de cada pergunta do Mural (spec 010, denormalização deliberada). Trocar
o nome aqui **não** volta atrás e reescreve o que já foi publicado: as perguntas antigas continuam
assinadas com o nome de quando foram escritas.

A tela diz isso, em uma linha discreta abaixo do campo. É a única forma de a pessoa não achar que salvou
errado ao abrir o Mural em seguida — e reescrever seria uma varredura de escrita por troca de nome, para
corrigir uma assinatura histórica que não está errada.

### 4. Rede social aceita `@fulano`, `fulano` ou a URL inteira
Os três formatos entram; o que sai para a API é sempre a URL completa. A normalização acontece **antes**
do envio, e o campo mostra o resultado normalizado assim que perde o foco — a pessoa vê no que o texto
dela virou, em vez de descobrir depois.

Exigir a URL completa é exigir que a pessoa vá até o navegador, abra o próprio perfil e copie a barra de
endereço, para salvar um dado opcional. É a fricção que faz um campo opcional ficar vazio para sempre.

Campo apagado remove a rede: string vazia vira `null` na API, não `''`.

Os ícones já existem — `icon-linkedin.ts` e `icon-instagram.ts`, do rodapé da landing. **Nenhum ícone
novo**, e nenhuma segunda cópia deles.

### 5. E-mail e senha são dois formulários fechados, e cada um pede a senha atual
Na seção **Acesso**, cada um é um bloco que abre ao toque e fecha ao salvar ou cancelar. Fechado, mostra
só o estado: o e-mail atual, e "Senha · alterada por você" sem nenhum dado.

Os dois pedem a senha atual, porque o backend pede (decisão 5 da spec 013 dele). A tela não trata isso
como burocracia: o texto diz **por que** — "Confirmamos que é você antes de mudar o acesso." Um campo de
senha sem explicação em uma tela de perfil parece bug ou golpe.

### 6. Trocar o e-mail termina com "vá ver sua caixa nova", e a tela não finge que mudou
A resposta do backend é `202`: o pedido foi aceito, a troca não aconteceu. A tela mostra exatamente isso:

> **Confirmação enviada para `novo@email.com`.** O e-mail só muda depois que você clicar no link. Até lá,
> continue entrando com o endereço atual.

O campo do e-mail atual **não muda de valor**. Trocar o texto na tela antes de a confirmação ser clicada
seria mentir sobre o estado do sistema, e a mentira só apareceria no próximo login, que falharia.

E a tela avisa que **a sessão termina quando a troca for confirmada** — o Firebase revoga o acesso ao
aplicar a mudança, e quem não foi avisado interpreta isso como a conta ter sido invadida.

### 7. Trocar a senha desloga, e o aviso vem antes do botão, não depois
Texto fixo acima do botão: *"Ao trocar a senha, você sai de todos os aparelhos e precisa entrar de novo."*

Depois do `204`: limpar o `AuthStore`, navegar para a landing com `?entrar=1` — o parâmetro que já abre o
diálogo de login (spec 007) — e uma mensagem de sucesso. **Sem `confirm-dialog`**: o aviso já está na
tela e a operação é reversível trocando de novo. Diálogo em cima de aviso é o que ensina a clicar em
"Confirmar" sem ler.

O caminho de volta importa mais que o aviso. Trocar a senha e cair numa tela de login sem contexto é
indistinguível de ter sido deslogado por erro.

### 8. A exclusão lista o que some e o que fica, com essas palavras
O bloco de exclusão fica no fim, separado por um respiro grande, com borda de atenção — e **não é
vermelho gritante**: é a seção mais séria da tela, não a mais barulhenta. Vermelho é do botão final,
dentro do diálogo.

Antes do botão, uma lista literal:

| Some para sempre | Fica, sem o seu nome |
|---|---|
| Sua conta e seu acesso | As perguntas que você escreveu no Mural |
| Nome, telefone, bio e redes | |
| Seus votos no Mural | |
| Seu progresso na trilha | |

E uma linha explicando a coluna da direita: *"As perguntas continuam no Mural porque outras pessoas
votaram nelas e algumas viraram vídeo — mas passam a aparecer como 'Membro removido'."*

Isto é requisito, não gentileza. Consentimento sobre eliminação de dados só existe se a pessoa souber o
que vai ser eliminado — e "sua conta será excluída" não informa nada sobre a pergunta dela que virou
vídeo na trilha.

### 9. O diálogo de exclusão pede a senha, e só isso
Um `dialog-box` com o resumo em uma frase, o campo de senha, e dois botões: **Cancelar** e
**Excluir minha conta**. O botão de excluir fica desabilitado enquanto o campo estiver vazio.

Sem "digite EXCLUIR para confirmar". Digitar uma palavra prova atenção; digitar a senha prova identidade
— e identidade é o que uma operação irreversível precisa. Pedir as duas é atrito empilhado que não
compra nada.

**O foco inicial é o Cancelar**, não o campo de senha. É a única tela do produto onde o botão perigoso
não deve estar a um `Enter` de distância.

### 10. Excluir termina na landing, e não em lugar nenhum
`204` → `AuthStore.clearSession()` → `router.navigate(['/'])`. Sem toast de sucesso na tela seguinte:
"Conta excluída com sucesso!" para quem acabou de sair é uma comemoração fora de hora.

Falhar é diferente: o diálogo continua aberto, com a mensagem do backend. `401` vira "Senha incorreta."
e `403` — admin — vira o texto do backend, literal, porque a pessoa nesse caso é a que consegue resolver.

### 11. Erro de rede em qualquer das quatro operações não sai da tela
Mensagem no lugar do erro — abaixo do formulário que falhou, com `role="alert"` —, nunca um toast global
e nunca uma navegação. O `httpErrorMessage` que as outras telas já usam continua sendo quem traduz.

Salvar o perfil e ser jogado para fora por um `500` é o comportamento que faz a pessoa parar de editar o
perfil.

### 12. Os dois "Em breve" caem juntos
`dashboard.page.html` e `dashboard-aside.ts` têm hoje um cartão e um item inertes, os dois com o selo
"Em breve" e os dois com comentário explicando a ausência da rota. Os dois viram links para
`/dashboard/perfil`, e **os comentários saem**.

A regra do `dashboard.page.html` continua valendo e é o motivo de os dois caírem juntos: todo item do
menu tem um cartão no painel, com o mesmo rótulo, o mesmo ícone e o mesmo estado. Destravar um e esquecer
o outro é a assimetria que aquele comentário existe para impedir.

### 13. A tela é do próprio membro, e não existe perfil de terceiros
Sem `/dashboard/perfil/:id`, sem lista de membros, sem visualização pública. A rota lê o `AuthStore` e o
`GET /me`, e não aceita parâmetro nenhum.

É por isso que LinkedIn e Instagram, por ora, só são vistos por quem os cadastrou (ver **Fora de
escopo**): não há tela onde eles apareceriam para outra pessoa. O campo existe pronto para a spec que
criar essa tela — e essa spec vai ter que decidir sobre exposição de rede social de membro, que é uma
decisão de privacidade e não cabe de carona aqui.

### 14. Vocabulário

| Termo | Uso |
|---|---|
| **Meu Perfil** | o rótulo do cartão, do menu e o título da tela. Não é "Minha conta" |
| **Seus dados** / **Suas redes** / **Acesso** | os três primeiros títulos de seção, literais |
| **Excluir conta** | o título da quarta seção e o rótulo do botão que abre o diálogo |
| **Excluir minha conta** | o botão final, dentro do diálogo. A primeira pessoa é proposital |
| **Membro removido** | como o autor anônimo aparece no Mural. O mesmo texto do backend |
| **Confirmação enviada para …** | o estado de sucesso da troca de e-mail |
| **Senha atual** / **Nova senha** | os rótulos, literais |

---

## Rotas

| Rota | O que muda |
|---|---|
| `/dashboard/perfil` | **Nova.** Atrás de `authGuard` e `profileCompleteGuard`, como as outras do painel |
| `/dashboard` | O cartão "Meu Perfil" deixa de ser inerte |
| `/**` (casca) | O item "Meu Perfil" do aside deixa de ser `disabled` |

O `profileCompleteGuard` fica: quem ainda não completou o onboarding tem `/completar-perfil`, que é a
mesma edição com outro propósito. Duas telas de edição abertas ao mesmo tempo para a mesma pessoa é
confusão sem ganho.

---

## Fora de escopo

- **Perfil público de membro e lista de membros** (decisão 13). É onde as redes sociais passariam a ser
  vistas por terceiros, e é decisão de privacidade que merece spec própria.
- **Foto de perfil.** Nenhuma tela do produto mostra avatar, e armazenamento de imagem é infraestrutura
  nova.
- **Exportar meus dados.** É o outro direito da LGPD, e é spec própria nos dois repositórios.
- **Desfazer a exclusão.** Não existe carência: o backend apaga na hora (decisão 9 da spec 013 dele).
- **Preferências de notificação.** O cartão do painel promete "preferências de notificações" desde a spec
  005 — e a spec 012 decidiu que dois eventos não sustentam uma tela de configuração. **O texto do cartão
  muda nesta spec**, para parar de prometer o que não existe.
- **Segundo fator, sessões ativas, histórico de acesso.** Nenhum tem endpoint atrás.
- **Editar `grade` ou `tier`.** São conquista e acesso; nenhum dos dois é campo de perfil que a pessoa
  mexe. Quem move é o admin.

---

## Specs afetadas

### Spec 005 (Autenticação e Dashboard) — vigente, com dois selos revogados
O cartão "Meu Perfil" e o item do aside deixam de ser "Em breve" (decisão 12). O `completar-perfil`
continua existindo e continua sendo o onboarding — não vira redirecionamento para esta tela.

### Spec 010 (Mural de Perguntas) — vigente, com uma consequência
`authorName` pode passar a ser **"Membro removido"**, e a tela do Mural não trata isso como caso especial:
é texto, e já era. O que muda é que trocar o nome aqui **não** reescreve assinatura antiga (decisão 3).

### Spec 012 (Notificações Internas) — vigente
O "Fora de escopo" de lá dizia que preferências de notificação não têm tela onde morar. Continua
verdadeiro, e agora a tela existe e mesmo assim não as recebe — a razão é a mesma de lá: dois eventos.

### Spec 007 (Firestore e Firebase Auth) — vigente
O `?entrar=1` da landing, criado lá para o retorno da tela de senha do Firebase, é reusado como destino
depois da troca de senha (decisão 7). Mesmo parâmetro, mesma função, nenhum caminho novo.

### Spec 011 (Sessão que Sobrevive ao F5) — vigente
Trocar a senha limpa o `AuthStore` **e** o marcador de sessão do `localStorage`, pelo `clearSession()`
que já faz as duas coisas. Sem isso, o próximo F5 na landing tentaria um `/auth/refresh` que já não pode
dar certo.

---

## Pontos em aberto

1. **A pessoa vai achar a exclusão?** Está no fim da tela de perfil, que é o lugar convencional. Se
   virar pergunta de suporte, a resposta não é mover — é linkar do Financeiro, que é de onde a vontade de
   sair costuma nascer.
2. **Confirmar sair da tela com alteração não salva pode irritar** (decisão 2). Escrito como diálogo, e o
   risco é ele aparecer quando a pessoa só clicou num campo e apagou um espaço. Se acontecer, a
   comparação passa a ser contra o valor normalizado, não contra o texto cru.
3. **O bloco de troca de e-mail some depois do `202`?** Escrito como **não**: ele fica, com a mensagem de
   confirmação enviada, para a pessoa reenviar se o e-mail não chegar. O risco é ela pedir três vezes e
   receber três links — todos válidos, todos para o mesmo endereço, e o throttle do backend segura em
   três por minuto.
4. **O nome do botão final.** "Excluir minha conta" na primeira pessoa é deliberado — é a pessoa dizendo
   o que quer, não o sistema anunciando o que vai fazer. Se soar estranho em teste com usuário, a
   alternativa é "Sim, excluir", que é mais curta e menos clara.
5. **A lista da decisão 8 precisa continuar verdadeira.** Ela descreve o que o backend apaga hoje. No dia
   em que uma spec nova criar uma coleção com dado do membro, **essa lista é o segundo lugar a mudar** —
   e é o que ninguém lembra de abrir.
