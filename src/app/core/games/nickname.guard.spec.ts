import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { NicknameGate } from './nickname.gate';
import { nicknameGuard } from './nickname.guard';

describe('nicknameGuard', () => {
  let gate: { ask: jasmine.Spy };
  let authStore: AuthStore;

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
        { provide: NicknameGate, useValue: gate }
      ]
    });

    authStore = TestBed.inject(AuthStore);
  });

  it('quem já tem gamertag entra sem ver o modal', async () => {
    authStore.setProfile(perfil('LenoDev'));

    await expectAsync(run()).toBeResolvedTo(true);
    expect(gate.ask).not.toHaveBeenCalled();
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
