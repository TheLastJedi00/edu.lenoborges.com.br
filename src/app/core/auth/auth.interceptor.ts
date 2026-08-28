import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Session } from '../../models/auth.model';
import { LegalDocumentSummary } from '../../models/legal.model';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';
import { LegalStore } from '../legal/legal.store';

let refreshInProgress$: Observable<Session> | null = null;

export function resetRefreshInProgress(): void {
  refreshInProgress$ = null;
}

/**
 * Rotas que dependem do cookie HttpOnly de refresh.
 *
 * O cookie tem Path=/auth, então só estas precisam de credenciais. O login entra
 * na lista porque é a resposta dele que traz o Set-Cookie: sem withCredentials, o
 * navegador descarta o cookie de uma resposta cross-origin e a sessão nunca
 * sobrevive a um F5.
 *
 * /auth/password fica de fora de propósito: aquele endpoint responde 204 sem
 * sessão e sem cookie.
 */
const CREDENTIALED_ROUTES = ['/auth/login', '/auth/refresh', '/auth/logout'];

/** Rotas onde 401 é resposta de negócio, não sessão expirada. Refresh aqui viraria loop. */
const NO_REFRESH_ROUTES = ['/auth/login', '/auth/signup', '/auth/refresh', '/auth/password'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);
  const legalStore = inject(LegalStore);
  const router = inject(Router);

  const isApiUrl = req.url.startsWith(environment.apiUrl);
  let clonedReq = req;

  if (CREDENTIALED_ROUTES.some((route) => req.url.includes(route))) {
    clonedReq = clonedReq.clone({ withCredentials: true });
  }

  const token = authStore.accessToken();
  if (isApiUrl && token && !clonedReq.headers.has('Authorization')) {
    clonedReq = clonedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: unknown) => {
      // O 428 vem ANTES do 401, e a ordem é o ponto (spec 018, decisão 8).
      //
      // Ele não é sessão expirada: não chama `refresh()`, não limpa a sessão e
      // não navega. Cair no caminho do 401 deslogaria a base inteira no deploy
      // desta spec — a pior estreia possível para uma feature cujo assunto é
      // confiança.
      //
      // O erro segue adiante depois de preencher o store: quem chamou precisa
      // saber que a requisição falhou, e quem desenha o bloqueio é o shell.
      if (error instanceof HttpErrorResponse && error.status === 428) {
        legalStore.setPending(pendingFrom(error));
        return throwError(() => error);
      }

      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !isApiUrl ||
        NO_REFRESH_ROUTES.some((route) => req.url.includes(route))
      ) {
        return throwError(() => error);
      }

      if (!refreshInProgress$) {
        // O finalize precisa ficar ANTES do shareReplay, sobre a fonte. Depois
        // dele, ele roda por assinante, inclusive no unsubscribe: uma requisição
        // cancelada liberaria o controle com o refresh ainda em voo, e o 401
        // seguinte dispararia um segundo refresh com o token já rotacionado.
        refreshInProgress$ = authService.refresh().pipe(
          finalizeSource(() => {
            refreshInProgress$ = null;
          }),
          shareReplay(1)
        );
      }

      return refreshInProgress$.pipe(
        // O catchError vem antes do switchMap: aqui só chega falha do refresh.
        // Depois do switchMap ele também pegaria a falha da requisição refeita, e
        // um 500 no retry derrubaria uma sessão perfeitamente válida.
        catchError((refreshError: unknown) => {
          authStore.clearSession();
          // A navegação não pode virar rejeição solta: o erro que importa para
          // quem chamou é o do refresh, e é ele que segue adiante.
          router.navigateByUrl('/comunidade').catch(() => undefined);
          return throwError(() => refreshError);
        }),
        switchMap((session) => {
          const retriedReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${session.accessToken}`
            }
          });
          return next(retriedReq);
        })
      );
    })
  );
};

/**
 * Lê a lista de pendentes do corpo do 428.
 *
 * Defensivo de propósito: se o corpo vier vazio ou com outro formato, o
 * resultado é lista vazia e o bloqueio simplesmente não sobe — melhor que um
 * `TypeError` dentro do interceptor, que quebraria **todas** as requisições do
 * app, e não só a que falhou.
 */
function pendingFrom(error: HttpErrorResponse): LegalDocumentSummary[] {
  const pending = (error.error as { pending?: unknown } | null)?.pending;
  return Array.isArray(pending) ? (pending as LegalDocumentSummary[]) : [];
}

/**
 * `finalize` do RxJS aplicado à fonte, e não ao observable compartilhado: dispara
 * quando o refresh termina (sucesso ou erro), nunca no unsubscribe de quem estava
 * apenas escutando o resultado.
 */
function finalizeSource<T>(callback: () => void) {
  return (source: Observable<T>): Observable<T> =>
    new Observable<T>((subscriber) =>
      source.subscribe({
        next: (value) => subscriber.next(value),
        error: (err: unknown) => {
          callback();
          subscriber.error(err);
        },
        complete: () => {
          callback();
          subscriber.complete();
        }
      })
    );
}
