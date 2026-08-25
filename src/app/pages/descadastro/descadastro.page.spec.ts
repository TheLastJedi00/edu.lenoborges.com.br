import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthStore } from '../../core/auth/auth.store';
import { DescadastroPage } from './descadastro.page';

function rotaCom(token: string | null) {
  return {
    snapshot: {
      queryParamMap: {
        get: (chave: string) => (chave === 'token' ? token : null)
      }
    }
  };
}

describe('DescadastroPage', () => {
  let fixture: ComponentFixture<DescadastroPage>;
  let http: HttpTestingController;

  function montar(token: string | null) {
    TestBed.configureTestingModule({
      imports: [DescadastroPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: rotaCom(token) }
      ]
    });

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DescadastroPage);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('chama o descadastro na inicializacao, sem pedir confirmacao', () => {
    // Quem clicou no rodapé já confirmou: um segundo botão aqui é a interface
    // duvidando de uma decisão que não é dela.
    montar('abc.def');

    const req = http.expectOne(
      `${environment.apiUrl}/emails/descadastro?token=abc.def`
    );
    expect(req.request.method).toBe('POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Você não vai mais receber nossos e-mails'
    );
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('token invalido mostra a MESMA tela de sucesso', () => {
    // É o que a API responde: 204 sempre. Distinguir seria um oráculo de uid, e
    // é deliberado dos dois lados.
    montar('token-que-nao-confere');

    http
      .expectOne(`${environment.apiUrl}/emails/descadastro?token=token-que-nao-confere`)
      .flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Você não vai mais receber nossos e-mails'
    );
  });

  it('sem token, explica em uma frase e nao chama nada', () => {
    montar(null);

    http.expectNone(() => true);
    expect(fixture.nativeElement.textContent).toContain('link está incompleto');
    expect(fixture.nativeElement.textContent).toContain('Meu Perfil');
  });

  it('falha de rede diz que a pessoa continua na lista', () => {
    montar('abc.def');

    http
      .expectOne(`${environment.apiUrl}/emails/descadastro?token=abc.def`)
      .error(new ProgressEvent('offline'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('continua na lista');
  });

  /**
   * Esperar o refresh de sessão numa página pública é o defeito que só aparece
   * para quem está deslogado — ou seja, para todo mundo que a usa.
   */
  it('teste-trava: renderiza e completa a chamada SEM AuthStore inicializado', () => {
    montar('abc.def');

    const store = TestBed.inject(AuthStore);
    expect(store.status()).toBe('unknown');

    http
      .expectOne(`${environment.apiUrl}/emails/descadastro?token=abc.def`)
      .flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Você não vai mais receber nossos e-mails'
    );
    expect(store.status()).toBe('unknown');
  });

  it('a pagina fica fora dos buscadores', () => {
    // É uma URL com token na query: um rastreador que a visitasse descadastraria
    // a pessoa dona daquele token.
    montar('abc.def');

    const meta = TestBed.inject(Meta);
    expect(meta.getTag('name="robots"')?.content).toContain('noindex');

    http
      .expectOne(`${environment.apiUrl}/emails/descadastro?token=abc.def`)
      .flush(null, { status: 204, statusText: 'No Content' });
  });
});
