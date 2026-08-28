import { Injectable, computed, signal } from '@angular/core';
import {
  AuthStatus,
  MemberProfile,
  MemberUser,
  Session,
  TierId,
  UserRole
} from '../../models/auth.model';

/**
 * Único dado de sessão que toca o armazenamento do navegador, e de propósito não
 * é um dado: é um booleano. Ver `hasSessionHint`.
 */
const SESSION_HINT_KEY = 'eduleno.session';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  /**
   * Token JWT mantido estritamente em memória.
   * NUNCA utilizar localStorage ou sessionStorage para tokens para prevenir ataques XSS.
   */
  readonly accessToken = signal<string | null>(null);
  readonly user = signal<MemberUser | null>(null);
  /** Perfil completo, carregado por `GET /me`. Nulo até alguma page pedir. */
  readonly profile = signal<MemberProfile | null>(null);
  readonly status = signal<AuthStatus>('unknown');

  /**
   * `profileCompleted` e `grade` chegam na resposta da sessão, achatados, e são
   * guardados aqui separados do perfil completo. Os guards rodam antes de
   * qualquer page pedir `GET /me`, então precisam de uma resposta que já esteja
   * em memória: sem isso, o F5 dentro do painel devolve o usuário ao onboarding.
   */
  private readonly sessionProfileCompleted = signal(false);
  private readonly sessionGrade = signal(1);
  private readonly sessionRole = signal<UserRole | null>(null);
  private readonly sessionTier = signal<TierId>('dev-tier');

  readonly isLoggedIn = computed(() => this.status() === 'authenticated');

  /** O perfil carregado manda quando existe, porque é o dado mais recente. */
  readonly profileCompleted = computed(
    () => this.profile()?.profileCompleted ?? this.sessionProfileCompleted()
  );

  readonly grade = computed(() => this.profile()?.grade ?? this.sessionGrade());

  /**
   * Pontos de experiência (spec 019).
   *
   * **Uma fonte, e é a que já existia.** O check é clicado na tela da insígnia e
   * o selo vive no painel; as duas telas não se conhecem, e um segundo signal de
   * XP em qualquer componente seria o que fica velho na navegação de volta — o
   * painel mostrando o número de antes de a pessoa assistir a três vídeos.
   *
   * Diferente de `grade` e `role`, **não há fallback de sessão**: o campo chega
   * no `GET /me`, que o painel já faz ao montar. Uma segunda fonte para o mesmo
   * valor divergiria no primeiro check dado antes do refresh. Até o perfil
   * chegar, o valor é zero — e o selo simplesmente não é desenhado, porque um
   * `0` que pisca e vira `340` é pior que um espaço vazio.
   */
  readonly xp = computed(() => this.profile()?.xp ?? 0);

  /**
   * Papel do usuário, com a mesma precedência de `grade`: o perfil carregado
   * manda quando existe, porque é o dado mais recente.
   */
  readonly role = computed(() => this.profile()?.role ?? this.sessionRole());

  /**
   * Se o painel desenha a Administração.
   *
   * **Isto é conveniência, não proteção.** Quem impede o acesso é o AdminGuard do
   * backend; esconder o botão existe para o membro comum não bater num 403 sem
   * entender por quê. Nenhuma tela pode depender de o botão estar escondido.
   */
  readonly isAdmin = computed(() => this.role() === 'admin');

  /** Tier de acesso, com a mesma precedência de `grade`: o perfil manda. */
  readonly tier = computed(() => this.profile()?.tier ?? this.sessionTier());

  /**
   * Se o membro tem tier pago.
   *
   * Usado só para explicar a interface -- desabilitar o campo de pergunta, por
   * exemplo. **A regra de quem pode escrever no Mural NÃO sai daqui**: ela vem
   * pronta da API, em `canAsk`, porque tem duas partes (ser pagante e ainda não
   * ter perguntado) e duas implementações divergiriam na primeira exceção.
   */
  readonly isPaid = computed(() => this.tier() !== 'dev-tier');

  /** URL tentada por usuário não autenticado para redirecionamento pós-login. */
  readonly intendedUrl = signal<string | null>(null);

  /** Controle global do modal de autenticação. */
  readonly isAuthDialogOpen = signal<boolean>(false);
  readonly authDialogTab = signal<'login' | 'signup'>('login');

  setSession(session: Session): void {
    const trocouDeUsuario = this.user()?.id !== session.user.id;

    this.accessToken.set(session.accessToken);
    this.user.set(session.user);
    this.sessionProfileCompleted.set(session.profileCompleted);
    this.sessionGrade.set(session.grade);
    this.sessionRole.set(session.role ?? null);
    this.sessionTier.set(session.tier ?? 'dev-tier');
    this.status.set('authenticated');
    this.markSessionHint();

    // Perfil de outra pessoa não pode sobreviver a um login novo. Num refresh do
    // mesmo usuário ele é mantido, para a tela não piscar sem nome.
    if (trocouDeUsuario) {
      this.profile.set(null);
    }
  }

  setProfile(profile: MemberProfile): void {
    this.profile.set(profile);
  }

  /**
   * Escreve o XP novo, vindo da resposta de quem marcou um vídeo (spec 019).
   *
   * **Sem perfil carregado, não faz nada** — e isso é a decisão, não um
   * descuido. Criar um perfil pela metade aqui deixaria `profileCompleted`
   * falso, e o guard de onboarding sequestraria quem só marcou um vídeo. O
   * número certo chega no `GET /me` seguinte de qualquer forma.
   */
  setXp(xp: number): void {
    const current = this.profile();
    if (!current) {
      return;
    }

    this.profile.set({ ...current, xp });
  }

  clearSession(): void {
    this.accessToken.set(null);
    this.user.set(null);
    this.profile.set(null);
    this.sessionProfileCompleted.set(false);
    this.sessionGrade.set(1);
    this.sessionRole.set(null);
    this.sessionTier.set('dev-tier');
    this.status.set('anonymous');
    this.clearSessionHint();
  }

  /**
   * Marca que este navegador chegou a ter sessão.
   *
   * Não é credencial e não serve para autenticar nada: é um booleano que responde
   * "vale a pena tentar o /auth/refresh na abertura?". O refresh token de verdade
   * está no cookie HttpOnly, invisível para o JS, e por isso o app não conseguiria
   * responder essa pergunta sozinho. Sem a marca, todo visitante anônimo da
   * landing esperaria uma requisição de sessão que nunca teria como dar certo.
   */
  hasSessionHint(): boolean {
    try {
      return globalThis.localStorage?.getItem(SESSION_HINT_KEY) === '1';
    } catch {
      // Navegador com armazenamento bloqueado: sem marca, sem tentativa.
      return false;
    }
  }

  private markSessionHint(): void {
    try {
      globalThis.localStorage?.setItem(SESSION_HINT_KEY, '1');
    } catch {
      // Sem armazenamento o app segue funcionando; só perde a restauração no F5.
    }
  }

  private clearSessionHint(): void {
    try {
      globalThis.localStorage?.removeItem(SESSION_HINT_KEY);
    } catch {
      // Idem.
    }
  }

  setAnonymous(): void {
    this.clearSession();
  }

  setIntendedUrl(url: string | null): void {
    this.intendedUrl.set(url);
  }

  openAuthDialog(tab: 'login' | 'signup' = 'login'): void {
    this.authDialogTab.set(tab);
    this.isAuthDialogOpen.set(true);
  }

  closeAuthDialog(): void {
    this.isAuthDialogOpen.set(false);
  }
}
