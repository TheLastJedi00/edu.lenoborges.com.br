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
| `/dashboard/perfil` | Meu Perfil: dados, redes, e-mail, senha e exclusão de conta | Protegida | `authGuard`, `profileCompleteGuard`, `unsavedChangesGuard` (saída) |

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
