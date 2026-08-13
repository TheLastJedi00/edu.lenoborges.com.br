# Fase 01: Ambiente e HttpClient []
Branch: `feat/004-ambiente-http`

- [] Task 01: Criar `src/environments/environment.ts` com `apiUrl: 'http://localhost:3000'`.
  Objetivo: a URL da API existir em um único lugar, fora dos componentes.
- [] Task 02: Criar `src/environments/environment.production.ts` com a URL do backend publicado.
  Objetivo: separar o alvo de produção do de desenvolvimento.
- [] Task 03: Adicionar `fileReplacements` na configuração `production` do `angular.json`.
  Objetivo: o build de produção trocar o environment. Hoje não existe `fileReplacements` no
  projeto, então esta task cria o mecanismo inteiro.
- [] Task 04: Registrar `provideHttpClient()` em `src/app/app.config.ts`. Objetivo: dar ao
  `WaitlistService` acesso ao `HttpClient` sem quebrar `provideZonelessChangeDetection`.

# Fase 02: WaitlistService por HTTP (TDD) []
Branch: `feat/004-waitlist-http`

- [] Task 01 (TDD): Reescrever `src/app/services/waitlist.service.spec.ts` **antes** da lógica,
  com `provideHttpClientTesting` e `HttpTestingController`. Objetivo: cobrir os 7 casos do
  context.md, com destaque para a normalização verificada no corpo da requisição, o
  `expectNone` quando falta consentimento e o `receivedAt` voltando como `Date`.
- [] Task 02: Trocar o mock por `HttpClient.post` em `src/app/services/waitlist.service.ts`.
  Objetivo: manter a assinatura `submit(entry): Observable<WaitlistReceipt>` e a normalização,
  removendo `defer`, `delay`, `of` e a constante `NETWORK_DELAY_MS`.
- [] Task 03: Mapear `receivedAt` de string ISO para `Date` no retorno. Objetivo: o
  `WaitlistReceipt` parar de mentir sobre o tipo em tempo de execução.
- [] Task 04: Remover o signal `entries` e o `sent` derivado, junto do teste de ordem das
  inscrições. Arquivos: `waitlist.service.ts` e `waitlist.service.spec.ts`. Objetivo: a memória
  de sessão existia por falta de API e agora duplica o que a tabela guarda. Nenhum componente lê
  `sent`.

# Fase 03: Mensagem de erro no modal []
Branch: `feat/004-erro-modal`

- [] Task 01: Adicionar `errorMessage = input<string>()` ao `WaitlistDialog`, com o texto atual
  como padrão, e usá-lo no bloco `@if (state() === 'error')`. Arquivo:
  `src/app/components/waitlist-dialog/waitlist-dialog.ts`. Objetivo: permitir texto específico
  sem o componente aprender sobre HTTP.
- [] Task 02: Traduzir o status HTTP em mensagem nas páginas. Arquivos:
  `src/app/pages/comunidade/comunidade.page.ts` e `src/app/pages/landing/landing.page.ts`.
  Objetivo: `429` ganhar texto próprio pedindo para esperar cerca de um minuto, e o restante
  manter o texto atual. As smart pages fazem a tradução; o dumb component só exibe.

# Fase 04: Texto de uso dos dados []
Branch: `feat/004-texto-lgpd`

- [] Task 01: Corrigir a última frase do segundo parágrafo do bloco `.legal` em
  `src/app/components/waitlist-dialog/waitlist-dialog.ts`. Objetivo: substituir "fica registrado
  apenas nesta sessão do navegador, sem servidor de produção" pela descrição real, ou seja,
  armazenamento no banco da Seita Dev, retenção enquanto durar a lista de espera e exclusão a
  pedido, mantendo finalidade, base legal e direitos do titular como estão.

# Fase 05: Validação ponta a ponta []
Branch: `feat/004-validacao`

- [] Task 01: Rodar `ng test` com a suíte inteira verde, incluindo as specs novas do service.
- [] Task 02: Subir o backend local (`npm run start:dev` em `eduleno-back`) e enviar o formulário
  pelos dois pontos de entrada, na landing e em `/comunidade`. Objetivo: confirmar o estado de
  sucesso, a ausência de erro de CORS no console e a linha chegando na tabela `waitlist_entries`.
- [] Task 03: Reenviar o mesmo e-mail e confirmar que a resposta continua sendo sucesso, sem erro
  visível. Objetivo: provar a idempotência do backend pela interface.
- [] Task 04: Disparar seis envios seguidos para provocar o `429` e conferir a mensagem específica.
- [] Task 05: Validar no Chrome em 390px, 768px e 1440px, sem scroll horizontal e sem erro de
  console, e rodar `ng build --configuration production`.

# Fase 06: Release []
- [] Task 01: Abrir `release/004-acesso-antecipado` unindo as `feat/004-*`.
- [] Task 02: Merge da release em `dev`.
- [] Task 03: PR contra a `main` (se houver origin; se não, merge local de `dev` em `main`).

## Checklist final
- [] `WaitlistService` chamando `POST /waitlist` de verdade, sem mock e sem `delay` simulado
- [] Assinatura `submit(entry): Observable<WaitlistReceipt>` preservada, páginas intactas
- [] `receivedAt` devolvido como `Date`, não como string
- [] Normalização e recusa sem consentimento mantidas, sem gastar requisição
- [] `429` com mensagem própria, demais erros com o texto atual
- [] Texto de uso dos dados descrevendo o armazenamento real, sem inventar política
- [] `ng test` verde e `ng build --configuration production` sem erro
- [] Envio ponta a ponta com a linha chegando na tabela, sem erro de CORS
- [] Sem emojis, sem travessões em texto visível, mobile first preservado
