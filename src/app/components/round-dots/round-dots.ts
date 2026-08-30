import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RoundState } from '../../models/games.model';

/**
 * As três bolinhas de rodada (spec 022, decisões 2 e 15).
 *
 * Componente próprio porque aparecem em três lugares — o card, a lista de
 * desafios e a tela do desafio — e três cópias divergiriam no dia em que a
 * quarta rodada existisse.
 *
 * **Não é decoração**: o estado de cada rodada é informação, e o `aria-label`
 * a diz por extenso. Um leitor de tela que ouvisse "três círculos" não saberia
 * quantas foram aprovadas.
 */
@Component({
  selector: 'app-round-dots',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="dots" role="img" [attr.aria-label]="rotulo()">
      @for (dot of dots(); track dot.round) {
        <span
          class="dots__dot"
          [class.dots__dot--passed]="dot.passed"
          [class.dots__dot--current]="dot.current"
          aria-hidden="true"
        ></span>
      }
    </span>
  `,
  styleUrl: './round-dots.scss'
})
export class RoundDots {
  readonly rounds = input.required<readonly RoundState[]>();

  /** A rodada em que o membro está. Zero desliga o destaque de "atual". */
  readonly currentRound = input(0);

  protected readonly dots = computed(() =>
    this.rounds().map((round) => ({
      round: round.round,
      passed: round.passed,
      // A atual só é destacada se ainda não foi aprovada: uma bolinha verde e
      // pulsante ao mesmo tempo diria duas coisas.
      current: round.round === this.currentRound() && !round.passed
    }))
  );

  protected readonly rotulo = computed(() => {
    const aprovadas = this.rounds().filter((round) => round.passed).length;
    const total = this.rounds().length;

    return aprovadas === total
      ? `As ${total} rodadas aprovadas`
      : `${aprovadas} de ${total} rodadas aprovadas`;
  });
}
