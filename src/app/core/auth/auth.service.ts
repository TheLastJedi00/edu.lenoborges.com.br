import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Credentials,
  MemberProfile,
  MemberUser,
  Session,
  SignupRequest,
  UpdateProfileRequest
} from '../../models/auth.model';
import { EMAIL_PATTERN, normalizeEmail, normalizeName, normalizePhone } from '../normalize';
import { AuthStore } from './auth.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);

  /**
   * Envia o pedido de cadastro.
   *
   * O backend responde 202 mesmo para e-mail já cadastrado (idempotente).
   * O front valida previamente e compara confirmação sem diferenciação de maiúsculas/espaços.
   */
  signup(request: SignupRequest): Observable<void> {
    const normalizedEmail = normalizeEmail(request.email);
    const normalizedConfirmation = normalizeEmail(request.emailConfirmation);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return throwError(() => new Error('Informe um e-mail válido.'));
    }

    if (normalizedEmail !== normalizedConfirmation) {
      return throwError(() => new Error('Os e-mails informados devem ser iguais.'));
    }

    return this.http.post<void>(`${environment.apiUrl}/auth/signup`, {
      email: normalizedEmail,
      emailConfirmation: normalizedConfirmation
    });
  }

  /**
   * Realiza login com e-mail e senha.
   * Em caso de sucesso, armazena o token e a sessão em memória no AuthStore.
   */
  login(credentials: Credentials): Observable<Session> {
    const normalizedEmail = normalizeEmail(credentials.email);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return throwError(() => new Error('Informe um e-mail válido.'));
    }

    if (!credentials.password || credentials.password.length < 8) {
      return throwError(() => new Error('A senha deve conter no mínimo 8 caracteres.'));
    }

    return this.http
      .post<Session>(`${environment.apiUrl}/auth/login`, {
        email: normalizedEmail,
        password: credentials.password
      })
      .pipe(
        tap((session) => {
          this.authStore.setSession(session);
        })
      );
  }

  // Não existe `setPassword`, e a ausência é proposital.
  //
  // A senha passou a ser definida na tela hospedada pelo Firebase, para onde o
  // link do e-mail aponta. O `oobCode` não chega no front nem na API, e o
  // endpoint `POST /auth/password` deixou de existir.
  //
  // O mínimo de 8 caracteres que era validado aqui virou configuração de console
  // (Authentication > Settings > Password policy). Se o piso parecer ter caído,
  // é lá que se olha, não aqui.

  /**
   * Renova a sessão usando o cookie HttpOnly de refresh token.
   */
  refresh(): Observable<Session> {
    return this.http.post<Session>(`${environment.apiUrl}/auth/refresh`, {}).pipe(
      tap({
        next: (session) => {
          this.authStore.setSession(session);
        },
        error: () => {
          this.authStore.setAnonymous();
        }
      })
    );
  }

  /**
   * Encerra a sessão.
   * Sempre limpa o AuthStore local, mesmo se a requisição ao servidor falhar.
   */
  logout(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}).pipe(
      tap(() => {
        this.authStore.clearSession();
      }),
      catchError(() => {
        this.authStore.clearSession();
        return of(undefined);
      }),
      map(() => undefined)
    );
  }

  /**
   * Atualiza os dados do perfil do usuário autenticado no onboarding ou edição.
   */
  updateProfile(request: UpdateProfileRequest): Observable<MemberProfile> {
    const normalizedName = normalizeName(request.name);
    const normalizedPhone = normalizePhone(request.phone);
    const trimmedBio = request.bio.trim();

    if (normalizedName.length < 2 || normalizedName.length > 120) {
      return throwError(() => new Error('O nome deve ter entre 2 e 120 caracteres.'));
    }

    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      return throwError(() => new Error('Informe um telefone com DDD válido.'));
    }

    if (trimmedBio.length < 10 || trimmedBio.length > 500) {
      return throwError(() => new Error('A bio deve ter entre 10 e 500 caracteres.'));
    }

    return this.http
      .patch<MemberProfile>(`${environment.apiUrl}/me/profile`, {
        name: normalizedName,
        phone: normalizedPhone,
        bio: trimmedBio
      })
      .pipe(
        tap((profile) => {
          this.authStore.setProfile(profile);
        })
      );
  }

  /**
   * Carrega o perfil completo do membro autenticado.
   *
   * A resposta é achatada, sem `user` nem `profile` aninhados. Quem chama são as
   * pages que precisam de nome, telefone ou bio, dados que a resposta da sessão
   * não carrega.
   */
  getMe(): Observable<MemberProfile> {
    return this.http.get<MemberProfile>(`${environment.apiUrl}/me`).pipe(
      tap((profile) => {
        this.authStore.setProfile(profile);
      })
    );
  }
}
