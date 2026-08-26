import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { AdminUser } from '../../../models/admin.model';
import type { TierId } from '../../../models/auth.model';
import { describeProgress, MAX_GRADE } from '../../../core/progress/progress';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-usuarios-page',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './usuarios.page.html',
  styleUrl: './usuarios.page.scss'
})
export class AdminUsuariosPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<LoadState>('loading');
  protected readonly users = signal<readonly AdminUser[]>([]);
  /**
   * O tamanho do **recorte**, e não da base (spec 015, decisão 6).
   *
   * Sem filtro os dois coincidem; com filtro, não — e é por isso que a tela
   * escreve "12 de 213 membros" em vez de um número solto. Um número grande
   * sozinho é lido como o tamanho da comunidade.
   */
  protected readonly total = signal(0);
  protected readonly loadingMore = signal(false);

  /** Usuário em edição de `grade`, ou nulo. */
  protected readonly editing = signal<AdminUser | null>(null);
  protected gradeDraft = 0;
  protected tierDraft: TierId = 'dev-tier';
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  /**
   * Mensagem própria para o 403.
   *
   * A claim de admin só entra em vigor no **próximo** ID token, e o atual vale
   * por até uma hora. Sem esta explicação, quem acabou de ser promovido lê
   * "acesso negado" e abre um chamado — a resposta certa é sair e entrar de
   * novo.
   */
  protected readonly forbidden = signal(false);

  /** A faixa vem do módulo de progresso, nunca reescrita à mão. */
  protected readonly maxGrade = MAX_GRADE;
  protected readonly gradeOptions = Array.from(
    { length: MAX_GRADE + 1 },
    (_, index) => index
  );

  protected readonly hasMore = computed(() => this.users().length < this.total());

  /**
   * Quantos ainda faltam no recorte.
   *
   * O "Carregar mais" de antes não conseguia dizer isto, porque o `pageToken` do
   * Auth é opaco e não carrega total. Agora ele sabe: **"Carregar mais (163
   * restantes)"**.
   */
  protected readonly restantes = computed(() =>
    Math.max(this.total() - this.users().length, 0)
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    this.forbidden.set(false);

    this.admin
      .listUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.users.set(page.users);
          this.total.set(page.total);
          this.state.set('ready');
        },
        error: (error: { status?: number }) => {
          this.forbidden.set(error.status === 403);
          this.state.set('error');
        }
      });
  }

  /**
   * "Carregar mais", e não paginação numerada — agora sabendo quantos faltam.
   *
   * **O `offset` é o tamanho do que já está na tela**, e não um contador
   * próprio: um contador paralelo é como a segunda página vem duplicada, que é o
   * erro clássico ao trocar cursor por deslocamento.
   */
  protected loadMore(): void {
    if (!this.hasMore() || this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);

    this.admin
      .listUsers({}, this.users().length)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.users.update((current) => [...current, ...page.users]);
          this.total.set(page.total);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false)
      });
  }

  protected labelFor(grade: number): string {
    return describeProgress(grade).label;
  }

  protected startEdit(user: AdminUser): void {
    this.saveError.set(null);
    this.gradeDraft = user.grade ?? 0;
    // O seletor abre NO VALOR DO MEMBRO. Ele abria vazio desde a spec 010,
    // porque a API declarava o campo e nunca o devolvia — e o admin escolhia às
    // cegas. `dev-tier` aqui é só o caso de quem ainda não tem perfil.
    this.tierDraft = user.tier ?? 'dev-tier';
    this.editing.set(user);
  }

  protected cancelEdit(): void {
    this.editing.set(null);
  }

  protected saveGrade(): void {
    const user = this.editing();
    if (!user) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    this.admin
      .updateUserGrade(user.id, this.gradeDraft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.users.update((current) =>
            current.map((item) =>
              item.id === user.id ? { ...item, grade: this.gradeDraft } : item
            )
          );
          this.saving.set(false);
          this.editing.set(null);
        },
        error: (error: { status?: number }) => {
          this.saving.set(false);
          this.saveError.set(
            error.status === 404
              ? 'Esse usuário ainda não concluiu o onboarding, então não tem perfil para editar.'
              : 'Não consegui salvar agora. Tente de novo.'
          );
        }
      });
  }

  /**
   * Concede ou remove acesso. **Requisição própria, e nunca junto do `grade`.**
   *
   * `tier` é acesso; `grade` é conquista. Mandar os dois no mesmo PATCH faria
   * uma edição de acesso escrever o progresso junto — e é assim que alguém que
   * acabou de pagar perde a trilha inteira.
   */
  protected saveTier(): void {
    const user = this.editing();
    if (!user) {
      return;
    }

    this.saving.set(true);
    this.saveError.set(null);

    this.admin
      .updateUserTier(user.id, this.tierDraft)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.users.update((current) =>
            current.map((item) =>
              item.id === user.id ? { ...item, tier: this.tierDraft } : item
            )
          );
          this.saving.set(false);
          this.editing.set(null);
        },
        error: (error: { status?: number }) => {
          this.saving.set(false);
          this.saveError.set(
            error.status === 404
              ? 'Esse usuário ainda não concluiu o onboarding, então não tem perfil para editar.'
              : 'Não consegui salvar agora. Tente de novo.'
          );
        }
      });
  }

  protected readonly tierOptions: readonly { id: TierId; label: string }[] = [
    { id: 'dev-tier', label: 'Dev Tier (gratuito)' },
    { id: 'great-dev-tier', label: 'Great Dev Tier' },
    { id: 'ultra-dev-tier', label: 'Ultra Dev Tier' },
    { id: 'master-dev-tier', label: 'Master Dev Tier' }
  ];
}
