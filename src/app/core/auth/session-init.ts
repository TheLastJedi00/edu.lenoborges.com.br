import { EnvironmentProviders, inject, provideAppInitializer } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

/**
 * Inicializador da aplicação que tenta restaurar a sessão via cookie HttpOnly
 * antes de qualquer rota ou guard ser executado.
 *
 * Em caso de 401 ou erro, define o estado como anônimo sem travar a inicialização.
 */
export function provideSessionInit(): EnvironmentProviders {
  return provideAppInitializer(async () => {
    const authService = inject(AuthService);
    const authStore = inject(AuthStore);

    try {
      await firstValueFrom(authService.refresh());
    } catch {
      authStore.setAnonymous();
    }
  });
}
