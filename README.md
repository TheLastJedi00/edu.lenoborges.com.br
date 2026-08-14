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
