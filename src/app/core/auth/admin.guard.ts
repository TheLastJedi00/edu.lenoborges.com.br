import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/**
 * Fecha as rotas de administração para quem não tem a claim.
 *
 * Roda **depois** do `authGuard` e do `profileCompleteGuard`, e por isso pode
 * confiar que já existe sessão: o que ele decide é só o papel.
 *
 * **Isto é conveniência, não proteção.** Quem impede o acesso de verdade é o
 * `AdminGuard` do backend, que confere a claim dentro do token verificado. O
 * guard daqui existe para o membro comum não bater num 403 sem entender por quê,
 * e para a URL digitada à mão não abrir uma tela que vai falhar em toda
 * requisição.
 *
 * Um caso que confunde: a claim só entra em vigor no **próximo** ID token, e o
 * atual vale por até uma hora. Quem acabou de ser promovido não passa por aqui
 * até sair e entrar de novo — e o painel é o destino certo nesse meio-tempo,
 * porque ele funciona.
 */
export const adminGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
