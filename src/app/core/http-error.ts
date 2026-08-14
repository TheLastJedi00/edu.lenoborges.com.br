import { HttpErrorResponse } from '@angular/common/http';

/**
 * Status HTTP do erro, quando ele veio de uma requisição.
 *
 * Aceita também um objeto solto com `status` numérico, que é o formato que
 * aparece em mock de teste e em erro reembrulhado por interceptor.
 */
export function httpStatus(error: unknown): number | null {
  if (error instanceof HttpErrorResponse) {
    return error.status;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    typeof (error as { status?: unknown }).status === 'number'
  ) {
    return (error as { status: number }).status;
  }

  return null;
}

/**
 * Traduz a falha de uma chamada em texto para o usuário ler.
 *
 * A regra que parece detalhe e não é: a propriedade `message` de um
 * `HttpErrorResponse` **nunca** vai para a tela. Ela sempre existe, com o texto
 * técnico do Angular e a URL da API dentro, então o padrão
 * `error.message || fallback` faz o fallback nunca rodar e publica
 * "Http failure response for http://localhost:3000/me/profile: 500..." para o
 * usuário.
 *
 * O que pode aparecer, em ordem de prioridade:
 *
 * 1. O texto que a tela definiu para aquele status (`byStatus`).
 * 2. A mensagem que a **nossa** API mandou no corpo, e só abaixo de 500: são
 *    mensagens escritas em português para o usuário ler ("Bio deve ter entre 10 e
 *    500 caracteres"). De 500 para cima o corpo é genérico ou técnico.
 * 3. A mensagem de um `Error` comum, que vem da validação local dos services e
 *    também é escrita para ser lida.
 * 4. O fallback.
 *
 * Vive fora dos componentes de propósito: as pages chamam e passam o texto pronto
 * para os componentes burros. Mesmo desenho de `services/waitlist-error.ts`, que
 * agora é um caso particular desta função.
 */
export function httpErrorMessage(
  error: unknown,
  fallback: string,
  byStatus: Readonly<Record<number, string>> = {}
): string {
  const status = httpStatus(error);

  if (status !== null) {
    const forStatus = byStatus[status];
    if (forStatus) {
      return forStatus;
    }

    if (status < 500) {
      const fromBody = apiMessage(error);
      if (fromBody) {
        return fromBody;
      }
    }

    return fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

/**
 * Mensagem que a API mandou no corpo. O Nest devolve string em exceção de
 * negócio e array de strings quando o ValidationPipe recusa o DTO; nesse caso a
 * primeira já basta para o usuário corrigir o campo.
 */
function apiMessage(error: unknown): string | null {
  const body = (error as { error?: unknown } | null)?.error;

  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const message = (body as { message?: unknown }).message;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (Array.isArray(message) && typeof message[0] === 'string' && message[0].trim()) {
    return message[0];
  }

  return null;
}
