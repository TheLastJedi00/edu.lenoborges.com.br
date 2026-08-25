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
