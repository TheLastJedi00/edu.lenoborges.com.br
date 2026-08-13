# Spec 004: Acesso Antecipado (lista de espera real)

## Objetivo
Trocar o envio mockado da lista de espera pela chamada real ao backend, e corrigir o texto de uso
dos dados do modal, que hoje afirma algo que deixou de ser verdade.

## Origem
A spec [003 - Comunidade](../003%20-%20Comunidade/context.md) entregou o modal com o
`WaitlistService` mockado e registrou em "Fora de escopo": _"Backend real da lista de espera (o
service é mock; a troca por HTTP é spec futura)"_. Esta é a spec futura.

O backend já existe. A spec 004 do repositório `eduleno-back` subiu o endpoint, mergeou em `dev` e
abriu PR contra a `main` (PR #1 em `TheLastJedi00/api.lenoborges.com.br`). A tabela
`waitlist_entries` está criada no projeto Supabase `Seita Dev` e vazia.

## Contrato da API

### `POST /waitlist`

Corpo enviado:

```json
{ "name": "Maria Silva", "phone": "11999998888", "email": "maria@exemplo.com", "consent": true }
```

Regras que o backend aplica, iguais às que o `WaitlistService` já aplica hoje:
`name` de 2 a 120 caracteres, `phone` com 10 ou 11 dígitos depois de remover não dígitos, `email`
válido, `consent` obrigatoriamente `true`. O backend normaliza de novo por conta própria, então o
front normalizar antes não é redundância perigosa, é só economia de ida e volta.

Resposta `201`:

```json
{ "id": "0f4c...uuid", "receivedAt": "2026-08-13T18:20:31.412Z" }
```

Erros: `400` (validação ou consentimento), `429` (limite de 5 requisições por minuto por IP),
`500` (falha de banco, sem detalhe do driver).

### Três detalhes do contrato que mudam código

1. **`receivedAt` chega como string ISO, não como `Date`.** O `WaitlistReceipt` do front declara
   `readonly receivedAt: Date`. O `HttpClient` não desserializa datas, então o service precisa
   mapear com `new Date(...)`. Sem isso o tipo mente: em tempo de execução seria uma string
   tipada como `Date`, e qualquer `.toLocaleDateString()` futuro quebraria.

2. **E-mail repetido responde `201`, não erro.** O backend é idempotente: devolve o recibo original
   sem criar linha nova. Para o front isso é sucesso puro e nada precisa ser tratado. Vale saber
   para não interpretar o `id` como "inscrição nova".

3. **`429` é um erro novo, que o mock nunca produziu.** O limite é de 5 envios por minuto por IP.
   A mensagem genérica atual ("Tente de novo em instantes") é enganosa nesse caso, porque sugere
   uma falha passageira de rede quando na verdade a pessoa precisa esperar cerca de um minuto.

## Configuração de ambiente
O projeto **não tem** `src/environments/` nem `fileReplacements` no `angular.json` (as
configurações `production` e `development` só mexem em budgets, hashing, otimização e source map).
Ou seja, esta spec cria a estrutura de ambiente do zero:

- `src/environments/environment.ts` com `apiUrl: 'http://localhost:3000'`;
- `src/environments/environment.production.ts` com a URL do backend publicado;
- `fileReplacements` na configuração `production` do `angular.json`.

A URL fica no environment e é lida uma vez pelo service. Nenhum componente conhece endereço de API.

O backend libera CORS apenas para as origens de `FRONTEND_URL`, que em desenvolvimento é
`http://localhost:4200`, a porta padrão do `ng serve`. Se a porta local mudar, o backend precisa
saber.

## `WaitlistService` com HTTP

Assinatura preservada: `submit(entry: WaitlistEntry): Observable<WaitlistReceipt>`. As páginas
(`landing.page.ts` e `comunidade.page.ts`) chamam com `subscribe({ next, error })` e não mudam.

O que muda por dentro:
- `inject(HttpClient)` e `post<WaitlistReceiptResponse>(\`${environment.apiUrl}/waitlist\`, body)`;
- `map` convertendo `receivedAt` de string para `Date`;
- `defer` e `delay` saem, junto com a constante `NETWORK_DELAY_MS`: o atraso deixa de ser simulado
  porque agora existe latência de verdade.

O que **fica**:
- a normalização (`name` com espaços colapsados, `phone` só dígitos, `email` em minúsculas);
- a validação local antes de enviar. O service continua não confiando no chamador, e com rate limit
  de 5 por minuto uma requisição gasta com corpo inválido é uma requisição a menos para a pessoa.

O que **sai**: o signal `entries` e o `sent` derivado. Eles existiam porque, sem API, a memória da
sessão era o único registro que sobrava. Agora o registro é a tabela. Nenhum componente lê `sent`
(confirmado por busca no `src/app`), então some sem impacto, junto com o teste que cobria a ordem
das inscrições guardadas.

### Testes (TDD, regra 6 do clauderc)
A spec atual do service usa o mock direto. Passa a usar `provideHttpClient` com
`provideHttpClientTesting` e `HttpTestingController`, escrita **antes** da troca da lógica.

Casos, sendo os quatro primeiros herdados da 003:
1. sucesso: `POST` para `${apiUrl}/waitlist` com o corpo normalizado e recibo devolvido;
2. normalização de telefone e e-mail verificada **no corpo da requisição**, não só no retorno;
3. recusa sem consentimento, com `httpMock.expectNone` provando que nada foi enviado;
4. propagação de erro para o assinante;
5. `receivedAt` chega como string ISO e volta como instância de `Date`;
6. telefone fora de 10 ou 11 dígitos e e-mail malformado seguem recusados sem requisição;
7. `429` e `500` chegam ao assinante distinguíveis, para a página escolher a mensagem.

## Mensagem de erro no modal
Hoje o `WaitlistDialog` tem o texto de erro fixo no template, e o `WaitlistState` só diz
`'idle' | 'sending' | 'success' | 'error'`. Para o `429` ter texto próprio sem o componente
aprender sobre HTTP:

- o `WaitlistDialog` ganha `errorMessage = input<string>()` com o texto atual como padrão;
- as páginas, que são as smart pages, traduzem o status em mensagem: `429` vira algo como "muitas
  tentativas seguidas, espere um minuto e tente de novo"; o resto mantém o texto atual.

O componente segue dumb: recebe texto pronto e não conhece `HttpErrorResponse`.

## Texto de uso dos dados (LGPD)
Arquivo `src/app/components/waitlist-dialog/waitlist-dialog.ts`, bloco `.legal`
(`id="uso-dos-dados"`). A última frase do segundo parágrafo diz hoje:

> "Enquanto a plataforma está em construção, o envio fica registrado apenas nesta sessão do
> navegador, sem servidor de produção."

Isso **deixou de ser verdade** no momento em que o backend passou a gravar. A frase passa a
descrever o armazenamento real: os dados são enviados e guardados no banco do serviço da Seita Dev,
mantidos enquanto durar a lista de espera, e apagados a pedido do titular.

O resto do bloco continua igual porque continua verdadeiro: finalidade única, base legal do
consentimento (art. 7º, I), ausência de compartilhamento para publicidade e direito de consulta,
correção, exclusão e revogação.

Regra que se mantém da 003: não inventar política de privacidade que não existe. O texto descreve
o que o backend faz, nada além.

## Fora de escopo
- Qualquer tela de administração ou listagem de inscritos (o backend não expõe `GET /waitlist`).
- E-mail de confirmação para quem se inscreve.
- Página de política de privacidade completa. Segue valendo o aviso resumido dentro do modal.
- Deploy do front e configuração da URL de produção do backend, que ainda não está publicado.
