import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/**
 * Impede que membros com perfil incompleto acessem rotas do dashboard,
 * redirecionando-os obrigatoriamente para /completar-perfil.
 */
export const profileCompleteGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.profileCompleted()) {
    return true;
  }

  return router.createUrlTree(['/completar-perfil']);
};

/**
 * Impede que membros que já concluíram o onboarding acessem /completar-perfil novamente pela URL,
 * redirecionando-os de volta ao /dashboard.
 */
export const onboardingPendingGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.profileCompleted()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
