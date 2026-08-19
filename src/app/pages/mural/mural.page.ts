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
import { RouterLink } from '@angular/router';
import { QuestionCard } from '../../components/question-card/question-card';
import { Logo } from '../../shared/logo/logo';
import { MuralService } from '../../services/mural.service';
import {
  MuralQuestion,
  MuralState,
  MuralWinner
} from '../../models/mural.model';
import { describeCountdown } from '../../core/mural/countdown';

type Aba = 'votacao' | 'coleta' | 'respondidas';
type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-mural-page',
  standalone: true,
  imports: [RouterLink, QuestionCard, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mural.page.html',
  styleUrl: './mural.page.scss'
})
export class MuralPage implements OnInit {
  private readonly mural = inject(MuralService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * **"Em votação" é a aba inicial**, e é decisão.
   *
   * É onde há algo para fazer com um toque, e onde estão as perguntas que já
   * passaram uma semana existindo. Abrir em "Esta semana" mostraria, na manhã de
   * domingo, uma lista vazia como primeira impressão do recurso.
   */
  protected readonly aba = signal<Aba>('votacao');

  protected readonly state = signal<MuralState | null>(null);
  protected readonly questions = signal<readonly MuralQuestion[]>([]);
  protected readonly winners = signal<readonly MuralWinner[]>([]);
  protected readonly loadState = signal<LoadState>('loading');

  protected readonly countdown = computed(() => {
    const state = this.state();
    return state ? describeCountdown(state.currentWeekEndsAt) : '';
  });

  /** Só a semana em votação aceita voto (decisão 1 da spec 010 do backend). */
  protected readonly votable = computed(() => this.aba() === 'votacao');

  protected readonly empty = computed(
    () => this.loadState() === 'ready' && this.questions().length === 0
  );

  ngOnInit(): void {
    this.loadState.set('loading');

    this.mural
      .getState()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (state) => {
          this.state.set(state);
          this.loadQuestions();
        },
        error: () => this.loadState.set('error')
      });
  }

  protected selectTab(aba: Aba): void {
    if (this.aba() === aba) {
      return;
    }

    this.aba.set(aba);

    if (aba === 'respondidas') {
      this.loadWinners();
    } else {
      this.loadQuestions();
    }
  }

  protected loadQuestions(): void {
    const fase = this.aba() === 'coleta' ? 'coleta' : 'votacao';
    this.loadState.set('loading');

    this.mural
      .listQuestions(fase)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          // A ordem vem do servidor e o front não reordena: reordenar por voto
          // no cliente faria dois membros verem listas diferentes por causa de
          // um voto que ainda não sincronizou.
          this.questions.set(list);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error')
      });
  }

  private loadWinners(): void {
    this.loadState.set('loading');

    this.mural
      .listWinners()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.winners.set(list);
          this.loadState.set('ready');
        },
        error: () => this.loadState.set('error')
      });
  }

  /**
   * Voto **otimista, com rollback**.
   *
   * Pinta e conta na hora; a requisição sai atrás. Votar é a ação mais repetida
   * da tela — uma pessoa vota em cinco perguntas numa sessão —, e 300ms de
   * espera cinco vezes é o que faz um recurso parecer lento. Como o backend
   * escreve em lote atômico, o rollback é sempre para um estado íntegro.
   *
   * **A lista não se reordena aqui.** Reordenar embaixo do dedo faria a pessoa
   * votar na pergunta errada no toque seguinte; a nova ordem aparece na próxima
   * carga.
   */
  protected toggleVote(question: MuralQuestion): void {
    const anterior = this.questions();
    const votando = !question.hasVoted;

    this.questions.set(
      anterior.map((item) =>
        item.id === question.id
          ? {
              ...item,
              hasVoted: votando,
              voteCount: item.voteCount + (votando ? 1 : -1)
            }
          : item
      )
    );

    const requisicao = votando
      ? this.mural.vote(question.id)
      : this.mural.unvote(question.id);

    requisicao.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: () => this.questions.set(anterior)
    });
  }
}
