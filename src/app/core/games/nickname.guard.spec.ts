import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { AuthStore } from '../auth/auth.store';
import { NicknameGate } from './nickname.gate';
import { nicknameGuard } from './nickname.guard';

describe('nicknameGuard', () => {
  let gate: { ask: jasmine.Spy };
  let authStore: AuthStore;
  let http: HttpTestingController;

  function perfil(nickname: string | null) {
    return {
      id: 'uid-1',
      email: 'membro@exemplo.com',
      name: 'Membro',
      phone: null,
      bio: null,
      grade: 1,
      linkedin: null,
      instagram: null,
      emailOptOut: false,
      profileCompleted: true,
      role: null,
      tier: 'dev-tier' as const,
      pendingLegal: [],
      legalAcceptances: {},
      xp: 0,
      socialLinksPublic: false,
      nickname
    };
  }

  function run(): Promise<boolean | UrlTree> {
    return TestBed.runInInjectionContext(
      () =>
        nicknameGuard(
          {} as never,
          {} as never
        ) as Promise<boolean | UrlTree>
    );
  }

  beforeEach(() => {
    gate = { ask: jasmine.createSpy('ask') };

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NicknameGate, useValue: gate }
      ]
    });

    authStore = TestBed.inject(AuthStore);
    http = TestBed.inject(HttpTestingController);
  });

  it('quem já tem gamertag entra sem ver o modal', async () => {
    authStore.setProfile(perfil('LenoDev'));

    await expectAsync(run()).toBeResolvedTo(true);
    expect(gate.ask).not.toHaveBeenCalled();
    http.verify();
  });

  it('teste-trava: com o perfil ainda não carregado, carrega antes de decidir', async () => {
    // **O defeito que este teste impede, encontrado na passada de navegador.**
    // O `session-init` só chama `/auth/refresh`, e a sessão não traz o
    // `nickname`. Num F5 dentro de Jogos, `profile()` é nulo e `nickname()`
    // responde `null` — o modal abria para quem JÁ TINHA gamertag, e a pessoa
    // levava 409 sobre uma escolha que já tinha feito.
    const pendente = run();

    http.expectOne((r) => r.url.endsWith('/me')).flush(perfil('LenoDev'));

    await expectAsync(pendente).toBeResolvedTo(true);
    expect(gate.ask).not.toHaveBeenCalled();
  });

  it('teste-trava: se o GET /me falhar, NÃO abre o modal', async () => {
    // Abrir seria o erro: quem já tem gamertag veria o pedido de novo por causa
    // de uma falha de rede. O painel é o lugar seguro.
    const pendente = run();

    http
      .expectOne((r) => r.url.endsWith('/me'))
      .flush({}, { status: 500, statusText: 'erro' });

    const resultado = await pendente;
    const router = TestBed.inject(Router);

    expect(gate.ask).not.toHaveBeenCalled();
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/dashboard');
  });

  it('quem não tem vê o modal, e entra ao escolher', async () => {
    authStore.setProfile(perfil(null));
    gate.ask.and.resolveTo(true);

    await expectAsync(run()).toBeResolvedTo(true);
    expect(gate.ask).toHaveBeenCalled();
  });

  it('teste-trava: desistir manda para o painel, e não deixa a URL parada', async () => {
    // Um `false` cru cancela a navegação e deixa a URL onde estava — o que
    // funciona quando se clicou no menu, e deixa a pessoa numa tela em branco
    // quando ela abriu o link direto, porque não havia lugar antigo.
    authStore.setProfile(perfil(null));
    gate.ask.and.resolveTo(false);

    const resultado = await run();
    const router = TestBed.inject(Router);

    expect(resultado).not.toBe(false);
    expect(router.serializeUrl(resultado as UrlTree)).toBe('/dashboard');
  });

  it('um modal por vez: o gate decide, e o guard só obedece', async () => {
    // Duas navegações rápidas não abrem dois modais — a trava é do gate, e o
    // guard não a duplica.
    authStore.setProfile(perfil(null));
    gate.ask.and.resolveTo(false);

    await run();
    await run();

    expect(gate.ask).toHaveBeenCalledTimes(2);
  });
});
