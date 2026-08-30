import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthStore } from '../auth/auth.store';
import { NicknameGate } from './nickname.gate';

/**
 * Sem gamertag, ninguém entra em Jogos (spec 022, decisão 16).
 *
 * **Um guard, e não um `if` em quatro páginas.** As quatro telas de Jogos
 * precisam da mesma regra, e quatro cópias dela divergem na primeira mudança —
 * e a quinta tela, quando existir, nasceria sem nenhuma.
 *
 * Ele fica **no nó** `jogos` das rotas, e não em cada filha: entrar direto em
 * `/dashboard/jogos/ranking` pela barra de endereços passa pelo mesmo lugar.
 *
 * Roda depois do `authGuard` e do `profileCompleteGuard`, herdados do `dashboard`
 * — e essa ordem importa: o perfil que este guard lê é o que aqueles garantiram
 * existir.
 */
export const nicknameGuard: CanActivateFn = async (): Promise<
  boolean | UrlTree
> => {
  const authStore = inject(AuthStore);
  const gate = inject(NicknameGate);
  const router = inject(Router);

  if (authStore.nickname()) {
    return true;
  }

  const escolheu = await gate.ask();

  if (escolheu) {
    return true;
  }

  // Desistiu. **Volta para o painel, e não fica onde estava**: um `false` cru
  // cancela a navegação e deixa a URL no lugar antigo — o que funciona quando se
  // clicou no menu, e deixa a pessoa numa tela em branco quando ela abriu o
  // link direto, porque não havia lugar antigo.
  return router.createUrlTree(['/dashboard']);
};
