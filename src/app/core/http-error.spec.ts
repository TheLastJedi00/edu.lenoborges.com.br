import { HttpErrorResponse } from '@angular/common/http';
import { httpErrorMessage, httpStatus } from './http-error';

const FALLBACK = 'Não foi possível concluir. Tente novamente.';

describe('httpErrorMessage', () => {
  it('nunca usa a mensagem técnica de um HttpErrorResponse', () => {
    // HttpErrorResponse sempre tem .message, com o texto do Angular e a URL da
    // API dentro. Usar `error.message || fallback` faz o fallback nunca rodar e
    // joga "Http failure response for http://localhost:3000/me/profile: 500..."
    // na tela do usuário.
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      url: 'http://localhost:3000/me/profile'
    });

    const message = httpErrorMessage(error, FALLBACK);

    expect(message).toBe(FALLBACK);
    expect(message).not.toContain('Http failure');
    expect(message).not.toContain('localhost');
  });

  it('usa o texto especifico do status quando houver', () => {
    const error = new HttpErrorResponse({ status: 429, statusText: 'Too Many Requests' });

    expect(httpErrorMessage(error, FALLBACK, { 429: 'Espere um minuto.' })).toBe(
      'Espere um minuto.'
    );
  });

  it('cai no fallback para status sem texto proprio', () => {
    const error = new HttpErrorResponse({ status: 503, statusText: 'Unavailable' });

    expect(httpErrorMessage(error, FALLBACK, { 429: 'Espere um minuto.' })).toBe(FALLBACK);
  });

  it('repassa a mensagem de um Error comum, que vem da validacao local', () => {
    // Os services recusam entrada inválida antes da rede, com Error puro e sem
    // status. Essa mensagem é específica e escrita para o usuário ler.
    expect(httpErrorMessage(new Error('Informe um e-mail válido.'), FALLBACK)).toBe(
      'Informe um e-mail válido.'
    );
  });

  it('cai no fallback para Error sem mensagem e para valores estranhos', () => {
    expect(httpErrorMessage(new Error(''), FALLBACK)).toBe(FALLBACK);
    expect(httpErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(httpErrorMessage('quebrou', FALLBACK)).toBe(FALLBACK);
  });

  it('prefere o texto do status a qualquer mensagem do proprio erro', () => {
    const error = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      error: { message: 'invalid grant' }
    });

    expect(httpErrorMessage(error, FALLBACK, { 401: 'E-mail ou senha inválidos.' })).toBe(
      'E-mail ou senha inválidos.'
    );
  });

  it('usa a mensagem que a nossa API mandou no corpo, abaixo de 500', () => {
    const error = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: { message: 'Bio deve ter entre 10 e 500 caracteres.' }
    });

    expect(httpErrorMessage(error, FALLBACK)).toBe('Bio deve ter entre 10 e 500 caracteres.');
  });

  it('usa a primeira mensagem quando o ValidationPipe devolve um array', () => {
    const error = new HttpErrorResponse({
      status: 400,
      statusText: 'Bad Request',
      error: { message: ['Telefone deve ter 10 ou 11 dígitos', 'Nome é obrigatório'] }
    });

    expect(httpErrorMessage(error, FALLBACK)).toBe('Telefone deve ter 10 ou 11 dígitos');
  });

  it('ignora o corpo de 500 para cima, onde a mensagem e generica ou tecnica', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      error: { message: 'Internal server error' }
    });

    expect(httpErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  it('httpStatus le o status de HttpErrorResponse e de objeto solto', () => {
    expect(httpStatus(new HttpErrorResponse({ status: 404, statusText: 'Not Found' }))).toBe(404);
    expect(httpStatus({ status: 400 })).toBe(400);
    expect(httpStatus(new Error('sem status'))).toBeNull();
    expect(httpStatus(undefined)).toBeNull();
  });
});
