export interface Credentials {
  readonly email: string;
  readonly password: string;
}

export interface SignupRequest {
  readonly email: string;
  readonly emailConfirmation: string;
}

// `SetPasswordRequest` foi removida na spec 007: a senha é definida na tela
// hospedada pelo Firebase, e o front não participa mais desse passo.

export interface MemberUser {
  readonly id: string;
  readonly email: string;
}

/**
 * Resposta de `GET /me` e de `PATCH /me/profile`, também achatada.
 *
 * `name`, `phone` e `bio` chegam nulos enquanto o onboarding não for concluído.
 */
export type UserRole = 'admin';

export type TierId =
  | 'dev-tier'
  | 'great-dev-tier'
  | 'ultra-dev-tier'
  | 'master-dev-tier';

export interface MemberProfile {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly phone: string | null;
  readonly bio: string | null;
  readonly grade: number;
  readonly profileCompleted: boolean;
  /** Papel vindo da custom claim do Firebase Auth. Nulo para o membro comum. */
  readonly role: UserRole | null;
  readonly tier: TierId;
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
  /**
   * Papel do usuário, achatado como `grade` e `profileCompleted` já são.
   *
   * **O front nunca decodifica o ID token para descobrir isto.** Dá para fazer,
   * e é errado: o token é do backend, o formato é dele, e um `atob` no meio do
   * app cria um segundo lugar que sabe ler credencial.
   */
  readonly role: UserRole | null;
  /**
   * Tier de acesso, também achatado.
   *
   * **É acesso, não conquista.** Não se deriva de `grade` nem o contrário — a
   * pessoa que cancelou com seis insígnias continua com seis, e o que ela perde
   * é o avanço. Diferente de `role`, vale na hora: não espera token novo.
   */
  readonly tier: TierId;
}

export type AuthStatus = 'unknown' | 'anonymous' | 'authenticated';
