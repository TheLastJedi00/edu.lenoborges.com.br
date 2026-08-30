import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Logo } from '../../../shared/logo/logo';
import { IconCheck } from '../../../components/icons/icon-check';
import { RoundDots } from '../../../components/round-dots/round-dots';
import { ChallengeTimer } from '../../../components/challenge-timer/challenge-timer';
import { GamesService } from '../../../services/games.service';
import { AuthStore } from '../../../core/auth/auth.store';
import {
  AnswerResult,
  ChallengeState,
  DIFFICULTY_LABELS,
  RoundQuestion,
  StartedRound
} from '../../../models/games.model';
import { AnswerClock } from './answer-clock';

/**
 * As cinco fases da tela.
 *
 * **Um signal com cinco valores, e não cinco booleanos.** Cinco booleanos
 * produzem o estado inválido em que dois deles são `true`, e ele aparece como
 * duas telas sobrepostas — o aviso por cima da questão, ou o resultado por cima
 * do feedback.
 */
type Fase = 'carregando' | 'aviso' | 'pronto' | 'jogando' | 'feedback' | 'resultado';

/** Quanto tempo o feedback de certo/errado fica na tela antes de avançar. */
const FEEDBACK_MS = 1500;

/**
 * O GYM Challenge: a tela onde se joga (spec 022, decisão 4).
 *
 * **Recarregar a página volta para o aviso, e isso é o comportamento certo.** A
 * rodada continua viva no servidor, o `GET` diz onde ela está, e o membro passa
 * pelo ritual de novo — o aviso aparece antes de *toda* rodada, e uma recarga no
 * meio não é exceção.
 */
@Component({
  selector: 'app-desafio-page',
  imports: [RouterLink, Logo, IconCheck, RoundDots, ChallengeTimer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './desafio.page.html',
  styleUrl: './desafio.page.scss'
})
export class DesafioPage {
  private readonly games = inject(GamesService);
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  /** O relógio que vira XP. Não é o timer visual. */
  private readonly clock = new AnswerClock();

  protected readonly badgeId = this.route.snapshot.paramMap.get('badgeId') ?? '';

  protected readonly fase = signal<Fase>('carregando');
  protected readonly challenge = signal<ChallengeState | null>(null);
  protected readonly round = signal<StartedRound | null>(null);
  protected readonly questionIndex = signal(0);
  protected readonly lastAnswer = signal<AnswerResult | null>(null);
  protected readonly chosenIndex = signal<number | null>(null);
  protected readonly aceitouAviso = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly enviando = signal(false);

  /** Acertos desta rodada, para o resultado. Contado das respostas recebidas. */
  private readonly acertos = signal(0);

  protected readonly question = computed<RoundQuestion | null>(() => {
    const round = this.round();

    return round ? (round.questions[this.questionIndex()] ?? null) : null;
  });

  protected readonly totalQuestoes = computed(
    () => this.round()?.questions.length ?? 0
  );

  protected readonly rotuloDaRodada = computed(() => {
    const state = this.challenge();
    if (!state) {
      return '';
    }

    const round = state.rounds[state.currentRound - 1];

    return `Rodada ${state.currentRound}: ${DIFFICULTY_LABELS[round.difficulty]}`;
  });

  /** O selo de treino: a rodada corrente já foi aprovada (decisão 17). */
  protected readonly treino = computed(
    () => this.round()?.replay ?? this.challenge()?.replay ?? false
  );

  protected readonly aprovado = computed(() => {
    const result = this.lastAnswer();

    return result?.roundPassed ?? false;
  });

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.fase.set('carregando');
    this.erro.set(null);

    this.games.getChallenge(this.badgeId).subscribe({
      next: (state) => {
        this.challenge.set(state);
        // **O aviso aparece toda vez**, e o checkbox nasce desmarcado. Ele não é
        // gravado em lugar nenhum — nem no servidor, nem no `localStorage` — e
        // essa repetição é o ritual, não burocracia (decisão 4).
        this.aceitouAviso.set(false);
        this.fase.set(state.status === 'em-breve' ? 'pronto' : 'aviso');
      },
      error: () => {
        this.erro.set('Não consegui carregar esse desafio agora.');
        this.fase.set('pronto');
      }
    });
  }

  protected confirmarAviso(): void {
    if (!this.aceitouAviso()) {
      return;
    }

    this.fase.set('pronto');
  }

  protected iniciar(): void {
    this.enviando.set(true);
    this.erro.set(null);

    this.games.startRound(this.badgeId).subscribe({
      next: (round) => {
        this.round.set(round);
        this.questionIndex.set(0);
        this.acertos.set(0);
        this.lastAnswer.set(null);
        this.chosenIndex.set(null);
        this.enviando.set(false);
        this.fase.set('jogando');
        // O relógio começa quando a questão vai para a tela.
        this.clock.start();
      },
      error: (failure: unknown) => {
        this.enviando.set(false);
        this.erro.set(this.mensagemDe(failure));
      }
    });
  }

  protected responder(chosenIndex: number): void {
    if (this.fase() !== 'jogando' || this.enviando()) {
      return;
    }

    const question = this.question();
    if (!question) {
      return;
    }

    // Para o relógio **antes** da requisição: o que se mede é o tempo até o
    // dedo tocar a alternativa, e não o tempo até o servidor responder.
    const clientElapsedMs = this.clock.stop();

    this.enviando.set(true);
    this.chosenIndex.set(chosenIndex);

    this.games
      .answer(this.badgeId, {
        questionIndex: question.index,
        chosenIndex,
        clientElapsedMs
      })
      .subscribe({
        next: (result) => {
          this.enviando.set(false);
          this.lastAnswer.set(result);
          this.fase.set('feedback');

          if (result.correct) {
            this.acertos.update((value) => value + 1);
          }

          // **O XP vem pronto do servidor.** Somar `xp + xpAwarded` aqui erraria
          // no treino, que paga zero, e em toda resposta errada.
          this.authStore.setXp(result.totalXp);

          setTimeout(() => this.avancar(result), FEEDBACK_MS);
        },
        error: (failure: unknown) => {
          this.enviando.set(false);
          this.chosenIndex.set(null);
          this.erro.set(this.mensagemDe(failure));
        }
      });
  }

  private avancar(result: AnswerResult): void {
    if (result.roundComplete) {
      this.fase.set('resultado');
      // Relê o estado: as bolinhas, a rodada corrente e o status do card mudaram.
      this.games.getChallenge(this.badgeId).subscribe({
        next: (state) => this.challenge.set(state)
      });

      return;
    }

    this.chosenIndex.set(null);
    this.lastAnswer.set(null);
    this.questionIndex.update((value) => value + 1);
    this.fase.set('jogando');
    this.clock.start();
  }

  /** Próxima rodada, ou tentar de novo: os dois voltam para o aviso. */
  protected proximaRodada(): void {
    this.round.set(null);
    this.lastAnswer.set(null);
    this.aceitouAviso.set(false);
    this.fase.set('aviso');
  }

  protected voltar(): void {
    void this.router.navigate(['/dashboard/jogos/desafios']);
  }

  protected readonly acertosDaRodada = computed(() => this.acertos());

  /**
   * A mensagem que a pessoa lê, **do corpo e nunca do status**.
   *
   * O `403` tem dois motivos — "o desafio ainda não existe" e "você precisa de
   * mais XP" — e a diferença é tudo o que importa para quem está lendo.
   */
  private mensagemDe(failure: unknown): string {
    if (failure instanceof HttpErrorResponse) {
      const body = failure.error as { message?: string | string[] } | null;
      const message = Array.isArray(body?.message)
        ? body?.message[0]
        : body?.message;

      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }

    return 'Algo deu errado agora. Tente de novo em instantes.';
  }
}
