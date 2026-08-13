import { HttpErrorResponse } from '@angular/common/http';

/** Texto para falha que não diz nada de útil ao visitante: rede caída, 500, causa desconhecida. */
export const WAITLIST_ERROR_DEFAULT = 'Não consegui registrar agora. Tente de novo em instantes.';

/**
 * O backend limita a 5 envios por minuto por IP. O texto padrão sugere falha passageira e
 * convida a tentar de novo na hora, o que aqui só queima mais uma tentativa.
 */
const WAITLIST_ERROR_TOO_MANY = 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';

/**
 * Traduz a falha do envio em texto para o visitante.
 *
 * Vive fora do WaitlistDialog de propósito: o componente é dumb e não conhece HTTP.
 * As pages chamam esta função e passam o texto pronto.
 */
export function waitlistErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    return error.status === 429 ? WAITLIST_ERROR_TOO_MANY : WAITLIST_ERROR_DEFAULT;
  }

  // Recusa local do service (consentimento, telefone, e-mail): a mensagem já é específica.
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return WAITLIST_ERROR_DEFAULT;
}
