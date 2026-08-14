import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Session } from '../../models/auth.model';
import { AuthService } from './auth.service';
import { AuthStore } from './auth.store';

let refreshInProgress$: Observable<Session> | null = null;

export function resetRefreshInProgress(): void {
  refreshInProgress$ = null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  const isApiUrl = req.url.startsWith(environment.apiUrl);
  let clonedReq = req;

  // Adiciona withCredentials nas rotas de autenticação (necessário para o cookie HttpOnly do refresh token)
  if (req.url.includes('/auth/refresh') || req.url.includes('/auth/logout')) {
    clonedReq = clonedReq.clone({ withCredentials: true });
  }

  // Injeta o access token em memória para chamadas à API
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
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        !isApiUrl ||
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/signup') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/password')
      ) {
        return throwError(() => error);
      }

      // 401 em rota protegida: dispara refresh ou compartilha o refresh em andamento
      if (!refreshInProgress$) {
        refreshInProgress$ = authService.refresh().pipe(
          shareReplay(1),
          finalize(() => {
            refreshInProgress$ = null;
          })
        );
      }

      return refreshInProgress$.pipe(
        switchMap((session) => {
          const retriedReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${session.accessToken}`
            }
          });
          return next(retriedReq);
        }),
        catchError((refreshError) => {
          authStore.clearSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
