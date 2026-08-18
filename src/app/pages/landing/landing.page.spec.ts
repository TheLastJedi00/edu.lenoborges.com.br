import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { LandingPage } from './landing.page';
import { AuthStore } from '../../core/auth/auth.store';

/**
 * Cobre só o retorno do cadastro.
 *
 * Desde a spec 007 a senha é definida na tela hospedada pelo Firebase, e o botão
 * de retorno de lá traz o usuário para a landing com `?entrar=1`. Esse parâmetro
 * é o último elo do fluxo: sem ele, quem acabou de criar a senha cai na home sem
 * nenhum sinal de que já pode entrar.
 */
describe('LandingPage · retorno com ?entrar=1', () => {
  function setup(queryParams: Record<string, string>) {
    TestBed.configureTestingModule({
      imports: [LandingPage],
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

    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    const fixture = TestBed.createComponent(LandingPage);
    const store = TestBed.inject(AuthStore);

    return { fixture, store, router };
  }

  it('abre o diálogo de login quando entrar=1', () => {
    const { fixture, store } = setup({ entrar: '1' });

    fixture.detectChanges();

    expect(store.isAuthDialogOpen()).toBeTrue();
    expect(store.authDialogTab()).toBe('login');
  });

  it('limpa o parâmetro da URL sem empilhar histórico', () => {
    // replaceUrl: um F5 depois não pode reabrir o diálogo, e o botão voltar deve
    // continuar levando para onde levava.
    const { fixture, router } = setup({ entrar: '1' });

    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: {}, replaceUrl: true })
    );
  });

  it('não abre nada sem o parâmetro', () => {
    const { fixture, store, router } = setup({});

    fixture.detectChanges();

    expect(store.isAuthDialogOpen()).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('ignora valor diferente de 1', () => {
    // Comparação estrita: `?entrar=0` ou `?entrar=talvez` não é intenção de
    // entrar, e tratar qualquer presença como verdadeira abriria o diálogo por
    // engano em link malformado.
    const { fixture, store } = setup({ entrar: '0' });

    fixture.detectChanges();

    expect(store.isAuthDialogOpen()).toBeFalse();
  });
});

/**
 * O CTA público da spec 009.
 *
 * A página inteira deixou de mostrar preço, e o único próximo passo que ela
 * oferece é a conta grátis. Estes testes cobrem as duas formas de errar isso: o
 * botão abrir a aba de login em vez da de cadastro, e a lista de espera voltar.
 */
describe('LandingPage · CTA gratuito', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [LandingPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } }
        }
      ]
    });

    const fixture = TestBed.createComponent(LandingPage);
    fixture.detectChanges();

    return { fixture, store: TestBed.inject(AuthStore) };
  }

  it('oferece "Começar gratuitamente" como chamada principal', () => {
    const { fixture } = setup();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.textContent).toContain('Começar gratuitamente');
  });

  /**
   * `openAuthDialog()` tem `'login'` como padrão, então esquecer o argumento
   * manda quem nunca teve conta para um formulário de senha que ela não tem. O
   * erro não quebra nada visivelmente — a pessoa é que desiste.
   */
  it('abre o diálogo na aba de cadastro, não na de login', () => {
    const { fixture, store } = setup();
    const el = fixture.nativeElement as HTMLElement;

    const cta = Array.from(el.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Começar gratuitamente')
    );
    cta?.click();

    expect(store.isAuthDialogOpen()).toBeTrue();
    expect(store.authDialogTab()).toBe('signup');
  });

  it('não oferece mais a lista de espera', () => {
    // O cadastro de conta já funciona, e a lista existia para capturar interesse
    // enquanto não havia porta de entrada. Duas portas para o mesmo lugar, uma
    // delas pior.
    const { fixture } = setup();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).not.toContain('lista de espera');
    expect(texto).not.toContain('acesso antecipado');
  });
});
