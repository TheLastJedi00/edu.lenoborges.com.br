import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

/**
 * Restaura a sessão a partir do cookie HttpOnly antes de qualquer rota ou guard
 * rodar, para que um F5 dentro do painel não jogue o usuário para fora.
 *
 * A chamada só acontece quando este navegador tem indício de sessão. O cookie é
 * HttpOnly e portanto invisível para o JS, então quem responde essa pergunta é a
 * marca deixada no login (ver `AuthStore`). Sem ela, esperar o `/auth/refresh`
 * atrasaria a landing pública para todo visitante anônimo, incluindo o tempo de
 * a API fora do ar falhar.
 *
 * Em caso de 401 ou erro, o estado vira anônimo sem travar a inicialização: 401
 * aqui é resposta esperada, não falha.
 */
export async function restoreSession(
  authService: AuthService,
  authStore: AuthStore
): Promise<void> {
  if (!authStore.hasSessionHint()) {
    authStore.setAnonymous();
    return;
  }

  try {
    await firstValueFrom(authService.refresh());
  } catch {
    authStore.setAnonymous();
  }
}

export function provideSessionInit(): EnvironmentProviders {
  return provideAppInitializer(async () => {
    const authService = inject(AuthService);
    const authStore = inject(AuthStore);

    await restoreSession(authService, authStore);
  });
}
