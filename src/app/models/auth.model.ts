import { LegalAcceptance, LegalDocumentSummary } from './legal.model';

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
  /** URL completa do perfil no LinkedIn, ou nulo. Nunca handle (spec 013). */
  readonly linkedin: string | null;
  /** URL completa do perfil no Instagram, ou nulo. */
  readonly instagram: string | null;
  /**
   * Se este membro saiu da lista de e-mails (spec 014).
   *
   * **É o inverso do interruptor da tela**: `emailOptOut: true` desenha o
   * switch DESLIGADO. Ler o booleano às pressas e ligar o switch é o erro que
   * mostra "recebendo" para quem acabou de descadastrar.
   */
  readonly emailOptOut: boolean;
  readonly profileCompleted: boolean;
  /** Papel vindo da custom claim do Firebase Auth. Nulo para o membro comum. */
  readonly role: UserRole | null;
  readonly tier: TierId;
  /**
   * Documentos legais vigentes que esta pessoa ainda não aceitou (spec 018).
   *
   * Lista vazia é o estado normal. **É a mesma lista que o corpo do `428`
   * carrega**, calculada pelo mesmo serviço do backend — este avisa na entrada,
   * o `428` pega a versão publicada enquanto a aba estava aberta.
   */
  readonly pendingLegal: readonly LegalDocumentSummary[];
  /** O aceite vigente de cada documento, por id. É o que Contratos mostra. */
  readonly legalAcceptances: Readonly<Record<string, LegalAcceptance>>;
  /**
   * Pontos de experiência: 10 por vídeo assistido, uma vez cada (spec 019).
   *
   * **Chega calculado, e a tela nunca multiplica nada.** Remarcar um vídeo não
   * paga XP, então uma soma local acertaria no primeiro clique de cada vídeo e
   * erraria em todos os seguintes — e o erro só apareceria quando alguém
   * recarregasse a página e visse o número cair.
   */
  readonly xp: number;
  /**
   * Se as redes deste membro aparecem no cartão que os outros membros abrem.
   *
   * **Nasce desligado.** É o que deixa o interruptor de Meu Perfil abrir já na
   * posição certa — sem este campo a tela chuta, e chuta ligado.
   */
  readonly socialLinksPublic: boolean;
}

/**
 * O cartão de outro membro, aberto pelo nome no Mural (spec 019).
 *
 * **É o que a API devolve, e nada além disso**: sem e-mail, sem telefone, sem
 * tier e sem papel. Quem decide o que é público é o servidor — um front que
 * recebesse o campo e escolhesse não desenhá-lo já o teria recebido.
 *
 * `linkedin` e `instagram` vêm `null` quando o membro não ligou o interruptor
 * **e** quando ele simplesmente não os preencheu. Os dois casos são o mesmo para
 * quem lê: não há link a mostrar.
 */
export interface PublicMember {
  readonly id: string;
  readonly name: string | null;
  readonly bio: string | null;
  readonly grade: number;
  readonly xp: number;
  readonly linkedin: string | null;
  readonly instagram: string | null;
}

export interface UpdateProfileRequest {
  readonly name: string;
  readonly phone: string;
  readonly bio: string;
  /**
   * As redes são **opcionais, e ausência não é o mesmo que vazio**.
   *
   * Campo ausente é "não mencionei" e a API deixa o valor guardado intacto;
   * string vazia é "quero apagar" e a API grava `null`. São coisas diferentes e
   * o backend as trata diferente — quem mandar `''` "para simplificar" apaga o
   * LinkedIn de quem só editou a bio.
   */
  readonly linkedin?: string;
  readonly instagram?: string;
}

/** Corpo de `POST /me/email`. A troca só acontece depois do clique no link. */
export interface ChangeEmailRequest {
  readonly newEmail: string;
  readonly password: string;
}

/** Corpo de `POST /me/password`. A confirmação da nova senha não vem aqui. */
export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
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
