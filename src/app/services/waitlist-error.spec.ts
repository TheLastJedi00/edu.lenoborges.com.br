import { HttpErrorResponse } from '@angular/common/http';
import { WAITLIST_ERROR_DEFAULT, waitlistErrorMessage } from './waitlist-error';

describe('waitlistErrorMessage', () => {
  it('pede para esperar quando o limite de envios é estourado', () => {
    const error = new HttpErrorResponse({ status: 429, statusText: 'Too Many Requests' });

    expect(waitlistErrorMessage(error)).toMatch(/minuto/i);
    expect(waitlistErrorMessage(error)).not.toBe(WAITLIST_ERROR_DEFAULT);
  });

  it('usa o texto padrão para falha do servidor', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });

    expect(waitlistErrorMessage(error)).toBe(WAITLIST_ERROR_DEFAULT);
  });

  it('usa o texto padrão quando a rede cai, sem status', () => {
    const error = new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' });

    expect(waitlistErrorMessage(error)).toBe(WAITLIST_ERROR_DEFAULT);
  });

  it('mostra a mensagem da recusa local, que é específica e útil', () => {
    const error = new Error('É preciso dar consentimento para o uso dos dados.');

    expect(waitlistErrorMessage(error)).toBe('É preciso dar consentimento para o uso dos dados.');
  });

  it('cai no texto padrão diante de erro desconhecido', () => {
    expect(waitlistErrorMessage(undefined)).toBe(WAITLIST_ERROR_DEFAULT);
    expect(waitlistErrorMessage('quebrou')).toBe(WAITLIST_ERROR_DEFAULT);
  });
});
