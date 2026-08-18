import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { provideRouter } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthStore } from './auth.store';
import { Session } from '../../models/auth.model';

function session(role: 'admin' | null): Session {
  return {
    accessToken: 'token',
    expiresIn: 3600,
    user: { id: 'uid-1', email: 'membro@test.com' },
    profileCompleted: true,
    grade: 3,
    role,
    tier: 'dev-tier'
  };
}

describe('adminGuard', () => {
  let store: AuthStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    });
    store = TestBed.inject(AuthStore);
  });

  function run() {
    return TestBed.runInInjectionContext(() => adminGuard(null!, null!));
  }

  it('deixa passar quem tem a claim de admin', () => {
    store.setSession(session('admin'));

    expect(run()).toBeTrue();
  });

  it('manda o membro comum de volta para o painel', () => {
    store.setSession(session(null));

    const result = run();
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/dashboard'
    );
  });

  /**
   * O painel é o destino certo, e não a landing: quem chegou aqui está logado e
   * com perfil completo — mandá-lo para fora seria tratar falta de permissão
   * como falta de sessão.
   */
  it('não desloga ninguém ao recusar', () => {
    store.setSession(session(null));

    run();

    expect(store.isLoggedIn()).toBeTrue();
  });
});
