export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface SignupRequest {
  readonly email: string;
  readonly emailConfirmation: string;
}

export interface SetPasswordRequest {
  readonly tokenHash: string;
  readonly password: string;
  readonly passwordConfirmation: string;
}

export interface MemberUser {
  readonly id: string;
  readonly email: string;
}

/**
 * Resposta de `GET /me` e de `PATCH /me/profile`, também achatada.
 *
 * `name`, `phone` e `bio` chegam nulos enquanto o onboarding não for concluído.
 */
export interface MemberProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly phone: string | null;
  readonly bio: string | null;
  readonly grade: number;
  readonly profileCompleted: boolean;
}

export interface UpdateProfileRequest {
  readonly name: string;
  readonly phone: string;
  readonly bio: string;
}

/**
 * Resposta de `POST /auth/login` e `POST /auth/refresh`.
 *
 * O formato é achatado, e é assim que o backend responde: não existe um objeto
 * `profile` aninhado aqui. A sessão carrega só o que o app precisa para decidir
 * o destino da navegação sem uma segunda ida à rede, ou seja `profileCompleted`
 * e `grade`. Nome, telefone e bio vêm de `GET /me`, no `MemberProfile`.
 *
 * Já foi tipada com um `profile` aninhado, que a API nunca mandou. O resultado
 * era `profileCompleted` sempre falso depois de um refresh, e o F5 dentro do
 * painel devolvia o usuário para o onboarding.
 */
export interface Session {
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly user: MemberUser;
  readonly profileCompleted: boolean;
  readonly grade: number;
}

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';
