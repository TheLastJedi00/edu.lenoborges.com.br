import { httpErrorMessage } from '../core/http-error';

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
 * Vivia fora do diálogo de propósito: o componente era dumb e não conhecia HTTP.
 * O diálogo saiu na spec 009 — o cadastro de conta tornou a lista de espera
 * desnecessária —, mas o mapeamento fica: `POST /waitlist` continua de pé, e é
 * este arquivo que traduz a falha dele em português se ela voltar a ser usada.
 * As pages chamam esta função e passam o texto pronto.
 */
export function waitlistErrorMessage(error: unknown): string {
  return httpErrorMessage(error, WAITLIST_ERROR_DEFAULT, {
    429: WAITLIST_ERROR_TOO_MANY
  });
}
