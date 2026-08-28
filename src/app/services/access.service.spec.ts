import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { AccessService } from './access.service';
import { environment } from '../../environments/environment';

/**
 * As três chamadas da tela de acesso (spec 020).
 *
 * São **públicas**: sem `AuthStore`, sem `withCredentials` e sem token. A única
 * credencial em jogo é o `oobCode` do corpo, e ele chegou por uma caixa de
 * entrada — quem está nesta tela ainda não tem sessão, e é exatamente por isso
 * que ela existe.
 */
describe('AccessService', () => {
  let service: AccessService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AccessService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('confere o código em POST /auth/password/check e devolve o e-mail', () => {
    let email = '';
    service.checkOobCode('codigo-vivo').subscribe((check) => (email = check.email));

    const req = http.expectOne(`${environment.apiUrl}/auth/password/check`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ oobCode: 'codigo-vivo' });
    req.flush({ email: 'fulano@email.com' });

    expect(email).toBe('fulano@email.com');
  });

  it('define a senha em POST /auth/password, e o 204 não traz corpo', () => {
    let concluiu = false;
    service
      .confirmPassword('codigo-vivo', 'senha-nova-forte')
      .subscribe(() => (concluiu = true));

    const req = http.expectOne(`${environment.apiUrl}/auth/password`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      oobCode: 'codigo-vivo',
      newPassword: 'senha-nova-forte'
    });
    req.flush(null, { status: 204, statusText: 'No Content' });

    expect(concluiu).toBeTrue();
  });

  it('aplica a ação de e-mail em POST /auth/email-action', () => {
    let email = '';
    service.applyEmailAction('codigo-vivo').subscribe((check) => (email = check.email));

    const req = http.expectOne(`${environment.apiUrl}/auth/email-action`);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ oobCode: 'codigo-vivo' });
    req.flush({ email: 'novo@email.com' });

    expect(email).toBe('novo@email.com');
  });

  it('teste-trava: nenhuma das três chamadas manda o mode no corpo', () => {
    // O `mode` chega da URL, escrito por quem manda o link, e a API não o
    // aceita: o corpo com um campo extra volta 400 pelo whitelist. Mandá-lo
    // "por garantia" quebraria as três de uma vez.
    service.checkOobCode('a').subscribe();
    service.confirmPassword('b', 'senha-nova-forte').subscribe();
    service.applyEmailAction('c').subscribe();

    const reqs = http.match(() => true);

    expect(reqs.length).toBe(3);
    reqs.forEach((req) => {
      expect(req.request.body as Record<string, unknown>).not.toEqual(
        jasmine.objectContaining({ mode: jasmine.anything() })
      );
      req.flush({ email: 'f@email.com' });
    });
  });

  it('teste-trava: nenhuma chamada manda credencial de sessão junto', () => {
    // Estas rotas são públicas e precisam funcionar para quem nunca esteve
    // logado naquele navegador. Um `withCredentials` aqui seria o cookie de
    // refresh viajando para uma rota que não o lê, e um `Authorization` seria um
    // token que quem está nesta tela ainda não tem.
    service.checkOobCode('codigo').subscribe();

    const req = http.expectOne(`${environment.apiUrl}/auth/password/check`);

    expect(req.request.withCredentials).toBeFalse();
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ email: 'f@email.com' });
  });

  it('teste-trava: o serviço não guarda o oobCode em campo nenhum', () => {
    // Decisão 9: um código de uso único guardado fora da tela que o usa é um
    // código que sobrevive à tela. O serviço recebe, envia e esquece.
    //
    // A asserção é sobre a **forma** do serviço, e não sobre o valor: o único
    // campo dele é o HttpClient. Qualquer signal, cache ou "último código
    // conferido" acrescentado aqui aparece nesta lista e fica vermelho — e é
    // isso que se quer pegar, porque o campo nasceria vazio e passaria por uma
    // verificação de valor.
    service.checkOobCode('codigo-secreto').subscribe();
    http.expectOne(`${environment.apiUrl}/auth/password/check`).flush({
      email: 'f@email.com'
    });

    expect(Object.keys(service)).toEqual(['http']);

    for (const valor of Object.values(service)) {
      expect(typeof valor === 'string' ? valor : '').not.toContain('codigo-secreto');
    }
  });
});
