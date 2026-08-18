import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../../components/confirm-dialog/confirm-dialog';
import { MuralService } from '../../../services/mural.service';
import { MuralQuestion, MuralWinner } from '../../../models/mural.model';

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-admin-mural-page',
  standalone: true,
  imports: [RouterLink, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mural-admin.page.html',
  styleUrl: './mural-admin.page.scss'
})
export class AdminMuralPage implements OnInit {
  private readonly mural = inject(MuralService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly confirmDialog = viewChild.required(ConfirmDialog);

  protected readonly state = signal<LoadState>('loading');
  protected readonly votacao = signal<readonly MuralQuestion[]>([]);
  protected readonly coleta = signal<readonly MuralQuestion[]>([]);
  protected readonly winners = signal<readonly MuralWinner[]>([]);

  private pendingRemoval: MuralQuestion | null = null;
  protected readonly removalTarget = signal<MuralQuestion | null>(null);

  /**
   * A mensagem do diálogo carrega **o texto da pergunta**.
   *
   * A remoção é irreversível e leva os votos junto. Confirmar sem ver o que se
   * apaga é confirmar no escuro — e numa lista de trinta cartões, "tem certeza?"
   * sozinho não diz qual deles vai sumir.
   */
  protected readonly confirmMessage = computed(() => {
    const question = this.removalTarget();
    return question
      ? `"${question.title}" sai do Mural, com os votos dela. Isso não pode ser desfeito.`
      : '';
  });

  /** A vencedora mais recente que ainda não virou vídeo. */
  protected readonly pendingWinner = computed(() =>
    this.winners().find(
      (semana) => semana.question && !semana.question.answerVideoId
    )
  );

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');

    this.mural
      .listQuestions('votacao')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.votacao.set(list);
          this.loadColeta();
        },
        error: () => this.state.set('error')
      });
  }

  private loadColeta(): void {
    this.mural
      .listQuestions('coleta')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.coleta.set(list);
          this.loadWinners();
        },
        error: () => this.state.set('error')
      });
  }

  private loadWinners(): void {
    this.mural
      .listWinners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.winners.set(list);
          this.state.set('ready');
        },
        error: () => this.state.set('error')
      });
  }

  protected askRemove(question: MuralQuestion): void {
    this.pendingRemoval = question;
    this.removalTarget.set(question);
    this.confirmDialog().open();
  }

  protected cancelRemove(): void {
    this.pendingRemoval = null;
    this.removalTarget.set(null);
  }

  protected confirmRemove(): void {
    const question = this.pendingRemoval;
    this.pendingRemoval = null;
    this.removalTarget.set(null);

    if (!question) {
      return;
    }

    this.mural
      .removeQuestion(question.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.votacao.update((list) =>
            list.filter((item) => item.id !== question.id)
          );
          this.coleta.update((list) =>
            list.filter((item) => item.id !== question.id)
          );
        }
      });
  }
}
