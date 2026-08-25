import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangeEmailRequest,
  ChangePasswordRequest,
  Credentials,
  MemberProfile,
  MemberUser,
  Session,
  SignupRequest,
  UpdateProfileRequest
} from '../../models/auth.model';
import { EMAIL_PATTERN, normalizeEmail, normalizeName, normalizePhone } from '../normalize';
import { toInstagramUrl, toLinkedinUrl } from '../social-url';
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

    // As redes entram no corpo **só quando o chamador as mencionou**. Sem elas o
    // corpo é byte a byte o de antes da spec 013 — e precisa ser: o onboarding
    // chama este mesmo método e não pode passar a mandar `linkedin: ''` para
    // toda a base, apagando o que ninguém pediu para apagar.
    const body: Record<string, string> = {
      name: normalizedName,
      phone: normalizedPhone,
      bio: trimmedBio
    };

    if (request.linkedin !== undefined) {
      const linkedin = toLinkedinUrl(request.linkedin);
      if (linkedin === null) {
        return throwError(
          () => new Error('Informe um perfil do LinkedIn válido, ou deixe o campo vazio.')
        );
      }
      body['linkedin'] = linkedin;
    }

    if (request.instagram !== undefined) {
      const instagram = toInstagramUrl(request.instagram);
      if (instagram === null) {
        return throwError(
          () => new Error('Informe um perfil do Instagram válido, ou deixe o campo vazio.')
        );
      }
      body['instagram'] = instagram;
    }

    return this.http
      .patch<MemberProfile>(`${environment.apiUrl}/me/profile`, body)
      .pipe(
        tap((profile) => {
          this.authStore.setProfile(profile);
        })
      );
  }

  /**
   * Pede a troca do e-mail de acesso.
   *
   * **Não mexe no `AuthStore`, e é o ponto inteiro.** A resposta é `202`: o
   * pedido foi aceito, a troca não aconteceu. Quem troca é o Firebase, quando o
   * link chegar no endereço novo e alguém clicar nele. Atualizar o e-mail em
   * memória aqui seria mentir sobre o estado do sistema, e a mentira só
   * apareceria no próximo login, falhando.
   */
  changeEmail(request: ChangeEmailRequest): Observable<void> {
    const normalizedEmail = normalizeEmail(request.newEmail);

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return throwError(() => new Error('Informe um e-mail válido.'));
    }

    return this.http.post<void>(`${environment.apiUrl}/me/email`, {
      newEmail: normalizedEmail,
      password: request.password
    });
  }

  /**
   * Troca a senha, e **encerra a sessão no sucesso**.
   *
   * O backend revoga os refresh tokens de todos os aparelhos e limpa o cookie; o
   * `clearSession()` daqui é o lado do front da mesma decisão — sem ele o app
   * seguiria com um token em memória e um marcador de sessão no `localStorage`
   * que o próximo F5 tentaria renovar, sem chance de dar certo.
   *
   * **Só no sucesso.** Um `401` de senha errada não pode deslogar quem errou a
   * digitação.
   */
  changePassword(request: ChangePasswordRequest): Observable<void> {
    return this.http
      .post<void>(`${environment.apiUrl}/me/password`, {
        currentPassword: request.currentPassword,
        newPassword: request.newPassword
      })
      .pipe(
        tap(() => {
          this.authStore.clearSession();
        }),
        map(() => undefined)
      );
  }

  /**
   * Exclui a conta. Imediato, irreversível, sem carência.
   *
   * **O corpo vai dentro de `options`**: `HttpClient.delete` não aceita corpo
   * como segundo argumento posicional, como `post` e `patch` aceitam. Passá-lo
   * assim faz a requisição sair sem senha e voltar `400` sem explicação — é o
   * erro mais fácil de cometer neste arquivo.
   */
  deleteAccount(password: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiUrl}/me`, { body: { password } })
      .pipe(
        tap(() => {
          this.authStore.clearSession();
        }),
        map(() => undefined)
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
