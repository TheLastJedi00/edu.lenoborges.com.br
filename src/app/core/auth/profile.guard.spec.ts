import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthStore } from './auth.store';
import { onboardingPendingGuard, profileCompleteGuard } from './profile.guard';

describe('profile Guards (TDD)', () => {
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

  describe('profileCompleteGuard', () => {
    it('libera o acesso quando o perfil está completo', () => {
      store.setSession({
        accessToken: 'token-123',
        expiresIn: 3600,
        user: { id: 'u1', email: 'test@example.com' },
        profileCompleted: true,
        grade: 1
      });

      const result = TestBed.runInInjectionContext(() => profileCompleteGuard(mockRoute, mockState('/dashboard')));
      expect(result).toBeTrue();
    });

    it('redireciona para /completar-perfil quando o perfil está incompleto', () => {
      store.setSession({
        accessToken: 'token-123',
        expiresIn: 3600,
        user: { id: 'u1', email: 'test@example.com' },
        profileCompleted: false,
        grade: 1
      });

      const result = TestBed.runInInjectionContext(() => profileCompleteGuard(mockRoute, mockState('/dashboard')));
      expect(result instanceof UrlTree).toBeTrue();
      expect((result as UrlTree).toString()).toBe('/completar-perfil');
    });
  });

  describe('onboardingPendingGuard', () => {
    it('libera acesso ao onboarding quando perfil está incompleto', () => {
      store.setSession({
        accessToken: 'token-123',
        expiresIn: 3600,
        user: { id: 'u1', email: 'test@example.com' },
        profileCompleted: false,
        grade: 1
      });

      const result = TestBed.runInInjectionContext(() =>
        onboardingPendingGuard(mockRoute, mockState('/completar-perfil'))
      );
      expect(result).toBeTrue();
    });

    it('redireciona perfil já completo de volta ao /dashboard para não reabrir onboarding', () => {
      store.setSession({
        accessToken: 'token-123',
        expiresIn: 3600,
        user: { id: 'u1', email: 'test@example.com' },
        profileCompleted: true,
        grade: 1
      });

      const result = TestBed.runInInjectionContext(() =>
        onboardingPendingGuard(mockRoute, mockState('/completar-perfil'))
      );
      expect(result instanceof UrlTree).toBeTrue();
      expect((result as UrlTree).toString()).toBe('/dashboard');
    });
  });
});
