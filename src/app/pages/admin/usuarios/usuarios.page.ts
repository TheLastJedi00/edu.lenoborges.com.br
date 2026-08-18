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
  protected readonly nextPageToken = signal<string | null>(null);
  protected readonly loadingMore = signal(false);

  /** Usuário em edição de `grade`, ou nulo. */
  protected readonly editing = signal<AdminUser | null>(null);
  protected gradeDraft = 0;
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

  protected readonly hasMore = computed(() => this.nextPageToken() !== null);

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
          this.nextPageToken.set(page.nextPageToken);
          this.state.set('ready');
        },
        error: (error: { status?: number }) => {
          this.forbidden.set(error.status === 403);
          this.state.set('error');
        }
      });
  }

  /**
   * "Carregar mais", e não paginação numerada.
   *
   * O `pageToken` do Firebase Auth é opaco e não diz quantas páginas existem —
   * um paginador com números precisaria de um total que a fonte não fornece.
   */
  protected loadMore(): void {
    const token = this.nextPageToken();
    if (!token || this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);

    this.admin
      .listUsers(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.users.update((current) => [...current, ...page.users]);
          this.nextPageToken.set(page.nextPageToken);
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
}
