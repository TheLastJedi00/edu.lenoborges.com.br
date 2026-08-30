import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * O selo de evolução diária no ranking (spec 022, decisão 6).
 *
 * **Só aparece quando há variação.** `null` é "ainda não sei" — o primeiro dia
 * do membro no placar — e zero é "não mudou": os dois desenham nada, e são
 * coisas diferentes que por acaso têm a mesma consequência visual. Um selo
 * dizendo "0 posições" seria ruído numa lista onde a maioria não se moveu.
 *
 * As setas são SVG inline e **não caracteres**: `↑` herda a fonte, muda de
 * desenho entre plataformas e às vezes vira o glifo de tofu. Regra 1 do
 * repositório, com o motivo prático à vista.
 */
@Component({
  selector: 'app-position-delta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visivel()) {
      <span
        class="delta"
        [class.delta--up]="subiu()"
        [class.delta--down]="!subiu()"
        [attr.aria-label]="rotulo()"
      >
        <svg
          viewBox="0 0 12 12"
          width="10"
          height="10"
          aria-hidden="true"
          focusable="false"
        >
          @if (subiu()) {
            <path d="M6 2 L10 8 L2 8 Z" fill="currentColor" />
          } @else {
            <path d="M6 10 L2 4 L10 4 Z" fill="currentColor" />
          }
        </svg>
        <span aria-hidden="true">{{ magnitude() }}</span>
      </span>
    }
  `,
  styleUrl: './position-delta.scss'
})
export class PositionDelta {
  readonly change = input.required<number | null>();

  protected readonly visivel = computed(() => {
    const value = this.change();

    return value !== null && value !== 0;
  });

  protected readonly subiu = computed(() => (this.change() ?? 0) > 0);

  protected readonly magnitude = computed(() => Math.abs(this.change() ?? 0));

  /**
   * O rótulo é a informação inteira, por extenso.
   *
   * Quem usa leitor de tela ouve "subiu 3 posições hoje" — a seta e o número
   * sozinhos seriam "triângulo três".
   */
  protected readonly rotulo = computed(() => {
    const n = this.magnitude();
    const posicoes = n === 1 ? 'posição' : 'posições';

    return this.subiu()
      ? `Subiu ${n} ${posicoes} hoje`
      : `Desceu ${n} ${posicoes} hoje`;
  });
}
