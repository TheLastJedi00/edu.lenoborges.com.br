import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/**
 * Guard funcional que valida a presença de sessão autenticada.
 * Lê diretamente do estado em memória e nunca dispara chamadas de rede.
 * Em caso de falha, armazena a URL pretendida, abre o modal de login e redireciona para /comunidade.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isLoggedIn()) {
    return true;
  }

  authStore.setIntendedUrl(state.url);
  authStore.openAuthDialog('login');
  return router.createUrlTree(['/comunidade']);
};
