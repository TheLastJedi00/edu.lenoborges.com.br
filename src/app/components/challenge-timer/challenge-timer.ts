import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  input,
  signal
} from '@angular/core';

/** De onde a barra parte. Referência aos 50 XP, e **não** ao cálculo. */
const TIMER_SECONDS = 50;

/**
 * O timer visual da rodada (spec 022, decisão 5).
 *
 * **Ele não mede nada.** É uma barra que esvazia para criar urgência, e o número
 * que vira XP sai do `AnswerClock`, com `performance.now()`. Este contador pode
 * atrasar, pode ser estrangulado pelo navegador em aba de fundo, e nada disso
 * importa — derivar a medição dele é o erro que o `answer-clock.ts` existe para
 * impedir.
 *
 * **`aria-hidden`, e isso é decisão de acessibilidade, não descuido.** Um
 * contador anunciado a cada segundo torna a tela inutilizável no leitor de tela:
 * a pessoa ouviria "49, 48, 47" por cima do enunciado que está tentando ler. O
 * tempo não é obrigatório para responder — ele não termina a questão, só muda de
 * cor —, então ele é decoração para quem não o vê.
 */
@Component({
  selector: 'app-challenge-timer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="timer" aria-hidden="true">
      <span
        class="timer__fill"
        [class.timer__fill--warn]="faixa() === 'warn'"
        [class.timer__fill--danger]="faixa() === 'danger'"
        [style.width.%]="proporcao()"
      ></span>
    </div>
  `,
  styleUrl: './challenge-timer.scss'
})
export class ChallengeTimer implements OnDestroy {
  /**
   * Muda para reiniciar a contagem.
   *
   * Recebe o índice da questão: cada questão tem o seu tempo, e é a **troca** do
   * valor que reinicia — não um método imperativo que a página precisaria
   * lembrar de chamar.
   */
  readonly questionIndex = input.required<number>();

  /** Congela a barra: a resposta já foi dada e o feedback está na tela. */
  readonly frozen = input(false);

  private readonly restantes = signal(TIMER_SECONDS);
  private handle: ReturnType<typeof setInterval> | null = null;

  protected readonly proporcao = computed(
    () => (this.restantes() / TIMER_SECONDS) * 100
  );

  /** Azul acima de 30s, amarelo entre 10 e 30, vermelho abaixo de 10. */
  protected readonly faixa = computed(() => {
    const s = this.restantes();

    if (s <= 10) {
      return 'danger';
    }

    if (s <= 30) {
      return 'warn';
    }

    return 'ok';
  });

  constructor() {
    effect(() => {
      // Ler o input dentro do effect é o que amarra o reinício à troca dele.
      this.questionIndex();
      const congelado = this.frozen();

      this.parar();
      if (congelado) {
        return;
      }

      this.restantes.set(TIMER_SECONDS);
      this.handle = setInterval(() => {
        // Chão em zero: a barra vazia é o fim da urgência, e **não** o fim da
        // questão. Não há tempo máximo por rodada (ponto Q.5), e um timer que
        // zerasse a questão inventaria uma regra que o produto não tem.
        this.restantes.update((value) => Math.max(0, value - 0.1));
      }, 100);
    });
  }

  ngOnDestroy(): void {
    this.parar();
  }

  private parar(): void {
    if (this.handle !== null) {
      clearInterval(this.handle);
      this.handle = null;
    }
  }
}
