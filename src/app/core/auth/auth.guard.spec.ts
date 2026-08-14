import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthStore } from './auth.store';

describe('authGuard (TDD)', () => {
  let store: AuthStore;
  let router: Router;

  const mockRoute = {} as ActivatedRouteSnapshot;
  const mockState = (url: string) => ({ url }) as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        AuthStore
      ]
    });

    store = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
  });

  it('permite acesso quando o usuário está logado', () => {
    store.setSession({
      accessToken: 'token-123',
      user: { id: 'u1', email: 'test@example.com' },
      profile: {
        id: 'p1',
        name: 'Leno',
        phone: '47999991234',
        bio: 'Bio',
        grade: 1,
        profileCompleted: true
      }
    });

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState('/dashboard')));
    expect(result).toBeTrue();
  });

  it('redireciona para /comunidade, abre modal e guarda URL tentada quando não logado', () => {
    store.clearSession();

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState('/dashboard/trilha')));
    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/comunidade');
    expect(store.intendedUrl()).toBe('/dashboard/trilha');
    expect(store.isAuthDialogOpen()).toBeTrue();
    expect(store.authDialogTab()).toBe('login');
  });
});
