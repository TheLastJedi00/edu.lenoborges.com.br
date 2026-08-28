import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { AcessoPage } from './acesso.page';
import { AuthStore } from '../../core/auth/auth.store';
import { environment } from '../../../environments/environment';

/**
 * A tela de acesso (spec 020).
 *
 * Quase todas as travas daqui são sobre o que a tela **não** faz: não chama
 * serviço sem código, não obedece o `continueUrl` de outro domínio, não deixa o
 * `oobCode` na barra de endereços e não cria sessão. São as coisas que alguém
 * acrescenta de boa-fé, e cada uma delas desfaz uma decisão sem citá-la.
 */
describe('AcessoPage', () => {
  let http: HttpTestingController;

  function setup(queryParams: Record<string, string>) {
    TestBed.configureTestingModule({
      imports: [AcessoPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } }
        }
      ]
    });

    http = TestBed.inject(HttpTestingController);

    const router = TestBed.inject(Router);
    const navegou = spyOn(router, 'navigateByUrl').and.resolveTo(true);

    const fixture = TestBed.createComponent(AcessoPage);
    fixture.detectChanges();

    return { fixture, navegou, el: fixture.nativeElement as HTMLElement };
  }

  it('sem oobCode, desenha o link inválido e não chama serviço nenhum', () => {
    const { el } = setup({ mode: 'resetPassword' });

    expect(el.textContent).toContain('Esse link não vale mais');
    // Nada a conferir, e uma requisição aqui só gastaria o limite de quem tem um
    // link legítimo.
    http.expectNone(() => true);
  });

  it('modo desconhecido cai no mesmo lugar, e também sem serviço', () => {
    const { el } = setup({ mode: 'signIn', oobCode: 'codigo' });

    expect(el.textContent).toContain('Esse link não vale mais');
    http.expectNone(() => true);
  });

  it('o oobCode some da URL depois de lido', () => {
    // A URL inteira entra no histórico do navegador e fica em navegador
    // compartilhado; aparece em print de quem pede ajuda; e vaza no Referer.
    const replace = spyOn(globalThis.history, 'replaceState');

    setup({ mode: 'resetPassword', oobCode: 'codigo-secreto' });

    expect(replace).toHaveBeenCalled();
    const urlNova = replace.calls.mostRecent().args[2] as string;
    expect(urlNova).not.toContain('codigo-secreto');
    expect(urlNova).not.toContain('oobCode');

    http.expectOne(`${environment.apiUrl}/auth/password/check`).flush({
      email: 'f@email.com'
    });
  });

  it('o formulário só aparece depois do check bem-sucedido', () => {
    const { fixture, el } = setup({ mode: 'resetPassword', oobCode: 'codigo' });

    // Enquanto confere: carregamento, e não formulário desabilitado.
    expect(el.querySelector('input[type="password"]')).toBeNull();
    expect(el.textContent).toContain('Conferindo o seu link');

    http
      .expectOne(`${environment.apiUrl}/auth/password/check`)
      .flush({ email: 'fulano@email.com' });
    fixture.detectChanges();

    expect(el.querySelectorAll('input[type="password"]').length).toBe(2);
    // De qual conta é a senha, antes de digitá-la.
    expect(el.textContent).toContain('fulano@email.com');
  });

  it('link morto no check leva à tela com saída, e não a um erro genérico', () => {
    const { fixture, el } = setup({ mode: 'resetPassword', oobCode: 'morto' });

    http
      .expectOne(`${environment.apiUrl}/auth/password/check`)
      .flush({ message: 'qualquer coisa' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(el.textContent).toContain('Esse link não vale mais');
    expect(el.textContent).toContain('Pedir um link novo');
  });

  it('teste-trava: um continueUrl de outro domínio é ignorado', () => {
    // Sem isto a tela seria um redirecionamento aberto com a marca do produto em
    // cima: o phishing perfeito é o link legítimo do nosso e-mail terminando num
    // domínio que não é o nosso.
    const { fixture, navegou } = setup({
      mode: 'resetPassword',
      oobCode: 'codigo',
      continueUrl: 'https://evil.example.com/pegar-senha'
    });

    http
      .expectOne(`${environment.apiUrl}/auth/password/check`)
      .flush({ email: 'f@email.com' });
    fixture.detectChanges();

    preencherESubmeter(fixture);

    http
      .expectOne(`${environment.apiUrl}/auth/password`)
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(navegou).toHaveBeenCalledWith('/?entrar=1');
    expect(navegou).not.toHaveBeenCalledWith(
      jasmine.stringContaining('evil.example.com')
    );
  });

  it('um continueUrl do mesmo origin é o destino', () => {
    const { fixture, navegou } = setup({
      mode: 'resetPassword',
      oobCode: 'codigo',
      continueUrl: `${globalThis.location.origin}/?entrar=1&vindo=email`
    });

    http
      .expectOne(`${environment.apiUrl}/auth/password/check`)
      .flush({ email: 'f@email.com' });
    fixture.detectChanges();

    preencherESubmeter(fixture);

    http
      .expectOne(`${environment.apiUrl}/auth/password`)
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(navegou).toHaveBeenCalledWith('/?entrar=1&vindo=email');
  });

  it('teste-trava: o sucesso navega sem tocar no AuthStore', () => {
    // Decisão 11: definir a senha não loga. Sessão nasce no login, num caminho
    // só, e a resposta daqui é 204 sem token.
    const { fixture, navegou } = setup({ mode: 'resetPassword', oobCode: 'codigo' });
    const store = TestBed.inject(AuthStore);

    http
      .expectOne(`${environment.apiUrl}/auth/password/check`)
      .flush({ email: 'f@email.com' });
    fixture.detectChanges();

    preencherESubmeter(fixture);

    http
      .expectOne(`${environment.apiUrl}/auth/password`)
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(navegou).toHaveBeenCalledWith('/?entrar=1');
    expect(store.status()).not.toBe('authenticated');
  });

  it('a recusa da API é mostrada como veio, e a tela volta ao formulário', () => {
    // A API é quem sabe se o link morreu ou se a senha foi recusada pela
    // política do projeto. Dois tradutores divergem na primeira exceção.
    const { fixture, el } = setup({ mode: 'resetPassword', oobCode: 'codigo' });

    http
      .expectOne(`${environment.apiUrl}/auth/password/check`)
      .flush({ email: 'f@email.com' });
    fixture.detectChanges();

    preencherESubmeter(fixture);

    http.expectOne(`${environment.apiUrl}/auth/password`).flush(
      { message: 'A nova senha não atende à política de segurança do projeto.' },
      { status: 400, statusText: 'Bad Request' }
    );
    fixture.detectChanges();

    expect(el.textContent).toContain(
      'A nova senha não atende à política de segurança do projeto.'
    );
    expect(el.querySelectorAll('input[type="password"]').length).toBe(2);
  });

  it('verifyAndChangeEmail aplica a ação e confirma, sem formulário', () => {
    const { fixture, el } = setup({
      mode: 'verifyAndChangeEmail',
      oobCode: 'codigo'
    });

    const req = http.expectOne(`${environment.apiUrl}/auth/email-action`);
    expect(req.request.body).toEqual({ oobCode: 'codigo' });
    req.flush({ email: 'novo@email.com' });
    fixture.detectChanges();

    expect(el.querySelector('input[type="password"]')).toBeNull();
    expect(el.textContent).toContain('novo@email.com');
  });

  it('tira a página dos buscadores, e devolve a marca ao sair', () => {
    // A URL carrega credencial na query. E a marca precisa sair junto com a
    // página, senão ela tira a landing inteira do índice.
    const { fixture } = setup({ mode: 'resetPassword' });
    const meta = TestBed.inject(Meta);

    expect(meta.getTag('name="robots"')?.content).toContain('noindex');

    fixture.destroy();

    expect(meta.getTag('name="robots"')).toBeNull();
  });

  /** Preenche as duas senhas com um valor válido e submete o formulário. */
  function preencherESubmeter(fixture: { nativeElement: HTMLElement; detectChanges: () => void }) {
    const campos = fixture.nativeElement.querySelectorAll(
      'input[type="password"]'
    ) as NodeListOf<HTMLInputElement>;

    campos.forEach((campo) => {
      campo.value = 'senha-nova-forte';
      campo.dispatchEvent(new Event('input'));
    });
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }
});
