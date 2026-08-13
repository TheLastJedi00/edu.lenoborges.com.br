# Fase 01: Ambiente e HttpClient [x]
Branch: `feat/004-ambiente-http`

- [x] Task 01: Criar `src/environments/environment.ts` com `apiUrl: 'http://localhost:3000'`.
  Objetivo: a URL da API existir em um único lugar, fora dos componentes.
- [x] Task 02: Criar `src/environments/environment.production.ts` com a URL do backend publicado.
  Objetivo: separar o alvo de produção do de desenvolvimento.
- [x] Task 03: Adicionar `fileReplacements` na configuração `production` do `angular.json`.
  Objetivo: o build de produção trocar o environment. Hoje não existe `fileReplacements` no
  projeto, então esta task cria o mecanismo inteiro.
- [x] Task 04: Registrar `provideHttpClient()` em `src/app/app.config.ts`. Objetivo: dar ao
  `WaitlistService` acesso ao `HttpClient` sem quebrar `provideZonelessChangeDetection`.

# Fase 02: WaitlistService por HTTP (TDD) [x]
Branch: `feat/004-waitlist-http`

- [x] Task 01 (TDD): Reescrever `src/app/services/waitlist.service.spec.ts` **antes** da lógica,
  com `provideHttpClientTesting` e `HttpTestingController`. Objetivo: cobrir os 7 casos do
  context.md, com destaque para a normalização verificada no corpo da requisição, o
  `expectNone` quando falta consentimento e o `receivedAt` voltando como `Date`.
- [x] Task 02: Trocar o mock por `HttpClient.post` em `src/app/services/waitlist.service.ts`.
  Objetivo: manter a assinatura `submit(entry): Observable<WaitlistReceipt>` e a normalização,
  removendo `defer`, `delay`, `of` e a constante `NETWORK_DELAY_MS`.
- [x] Task 03: Mapear `receivedAt` de string ISO para `Date` no retorno. Objetivo: o
  `WaitlistReceipt` parar de mentir sobre o tipo em tempo de execução.
- [x] Task 04: Remover o signal `entries` e o `sent` derivado, junto do teste de ordem das
  inscrições. Arquivos: `waitlist.service.ts` e `waitlist.service.spec.ts`. Objetivo: a memória
  de sessão existia por falta de API e agora duplica o que a tabela guarda. Nenhum componente lê
  `sent`.

# Fase 03: Mensagem de erro no modal [x]
Branch: `feat/004-erro-modal`

- [x] Task 01: Adicionar `errorMessage = input<string>()` ao `WaitlistDialog`, com o texto atual
  como padrão, e usá-lo no bloco `@if (state() === 'error')`. Arquivo:
  `src/app/components/waitlist-dialog/waitlist-dialog.ts`. Objetivo: permitir texto específico
  sem o componente aprender sobre HTTP.
- [x] Task 02: Traduzir o status HTTP em mensagem nas páginas. Arquivos:
  `src/app/pages/comunidade/comunidade.page.ts` e `src/app/pages/landing/landing.page.ts`.
  Objetivo: `429` ganhar texto próprio pedindo para esperar cerca de um minuto, e o restante
  manter o texto atual. As smart pages fazem a tradução; o dumb component só exibe.

# Fase 04: Texto de uso dos dados [x]
Branch: `feat/004-texto-lgpd`

- [x] Task 01: Corrigir a última frase do segundo parágrafo do bloco `.legal` em
  `src/app/components/waitlist-dialog/waitlist-dialog.ts`. Objetivo: substituir "fica registrado
  apenas nesta sessão do navegador, sem servidor de produção" pela descrição real, ou seja,
  armazenamento no banco da Seita Dev, retenção enquanto durar a lista de espera e exclusão a
  pedido, mantendo finalidade, base legal e direitos do titular como estão.

# Fase 05: Validação ponta a ponta [x]
Branch: `feat/004-validacao`

- [x] Task 01: Rodar `ng test` com a suíte inteira verde, incluindo as specs novas do service.
- [x] Task 02: Subir o backend local (`npm run start:dev` em `eduleno-back`) e enviar o formulário
  pelos dois pontos de entrada, na landing e em `/comunidade`. Objetivo: confirmar o estado de
  sucesso, a ausência de erro de CORS no console e a linha chegando na tabela `waitlist_entries`.
- [x] Task 03: Reenviar o mesmo e-mail e confirmar que a resposta continua sendo sucesso, sem erro
  visível. Objetivo: provar a idempotência do backend pela interface.
- [x] Task 04: Disparar seis envios seguidos para provocar o `429` e conferir a mensagem específica.
- [x] Task 05: Validar no Chrome em 390px, 768px e 1440px, sem scroll horizontal e sem erro de
  console, e rodar `ng build --configuration production`.

# Fase 06: Release [x]
- [x] Task 01: Abrir `release/004-acesso-antecipado` unindo as `feat/004-*`.
- [x] Task 02: Merge da release em `dev`.
- [x] Task 03: PR contra a `main` (se houver origin; se não, merge local de `dev` em `main`).

## Checklist final
- [x] `WaitlistService` chamando `POST /waitlist` de verdade, sem mock e sem `delay` simulado
- [x] Assinatura `submit(entry): Observable<WaitlistReceipt>` preservada, páginas intactas
- [x] `receivedAt` devolvido como `Date`, não como string
- [x] Normalização e recusa sem consentimento mantidas, sem gastar requisição
- [x] `429` com mensagem própria, demais erros com o texto atual
- [x] Texto de uso dos dados descrevendo o armazenamento real, sem inventar política
- [x] `ng test` verde e `ng build --configuration production` sem erro
- [x] Envio ponta a ponta com a linha chegando na tabela, sem erro de CORS
- [x] Sem emojis, sem travessões em texto visível, mobile first preservado

## Validação executada (2026-08-13)
- `ng test`: 35/35 verdes no Chrome, incluindo os 7 casos novos do `WaitlistService` e os 5 de
  `waitlistErrorMessage`. As specs foram escritas antes da lógica e falharam primeiro (5 falhas por
  ausência de requisição), como manda o TDD.
- Envio real com o backend local: linha gravada na tabela com `phone` só de dígitos e `email` em
  minúsculas, provando a normalização ponta a ponta. Nenhum erro de console.
- Idempotência pela interface: segundo envio do mesmo e-mail, com nome e telefone diferentes,
  devolveu sucesso e a tabela continuou com uma linha, preservando os dados do primeiro envio.
- `429`: com a cota esgotada, o modal exibiu a mensagem específica ("Muitas tentativas seguidas.
  Espere um minuto e tente de novo.") no lugar do texto genérico.
- Os dois pontos de entrada validados: `/comunidade` e a landing.
- Larguras: 390px e 768px verificadas renderizando a página em iframes dessas larguras exatas, sem
  scroll horizontal (`scrollWidth` igual a `clientWidth`), mais a largura de desktop da janela. O
  `resize_window` do Chrome não teve efeito nesta máquina, a janela ficou presa em 2048px, então
  **1440px não foi verificado**.
- `ng build --configuration production` sem erro, e o bundle confirmou o `fileReplacements`: contém
  `api.lenoborges.com.br` e não contém `localhost:3000`.
