import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { AuthService } from '../auth/auth.service';
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
  const authService = inject(AuthService);
  const gate = inject(NicknameGate);
  const router = inject(Router);

  // **O perfil pode ainda não estar em memória, e isto custou um defeito real.**
  //
  // O `session-init` só chama `/auth/refresh`, que devolve a sessão — e a sessão
  // não carrega o `nickname`. Num F5 dentro de Jogos, ou ao abrir o link direto,
  // `profile()` é nulo, `nickname()` responde `null`, e o modal abria **para
  // quem já tinha gamertag**: a pessoa digitaria um nome e levaria `409` sobre
  // uma escolha que ela já tinha feito.
  //
  // O `profileCompleteGuard` não protege contra isso — ele tem um fallback para
  // o sinal da sessão (`profileCompleted`), e o `nickname` não tem de onde cair.
  // Uma leitura a mais na primeira entrada é o preço, e ela só acontece uma vez
  // por carga da aba.
  if (!authStore.profile()) {
    try {
      await firstValueFrom(authService.getMe());
    } catch {
      // Sem perfil não dá para decidir, e **abrir o modal seria o erro**: quem
      // já tem gamertag veria o pedido de novo por causa de uma falha de rede.
      // O painel é o lugar seguro.
      return router.createUrlTree(['/dashboard']);
    }
  }

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
