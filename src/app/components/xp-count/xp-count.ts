import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Selo de pontos de experiência (spec 019).
 *
 * **Componente burro, como o `BadgeCount` ao lado**: recebe `xp` e desenha. Não
 * pergunta nada a ninguém, não sabe de onde o número veio e **não sabe quanto
 * vale um vídeo** — o 10 é do backend, e não existe neste repositório.
 *
 * Ele fica empilhado *sobre* o `BadgeCount`, e não ao lado: lado a lado os dois
 * viram uma fileira de números competindo, e eles não têm o mesmo peso. O
 * contador de insígnias conta a história do produto — a Liga Dev, a Elite Four;
 * o XP mede o esforço da semana. **XP menor em cima, insígnia maior embaixo.**
 */
@Component({
  selector: 'app-xp-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="xp u-mono" [attr.aria-label]="ariaLabel()">
      <span class="xp__value" aria-hidden="true">{{ xp() }}</span>
      <span class="xp__unit" aria-hidden="true">XP</span>
    </p>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .xp {
      display: inline-flex;
      align-items: baseline;
      gap: 0.25rem;
      margin: 0;
      padding: 0.15rem 0.6rem;
      border: var(--border-w) solid var(--screen-deep);
      border-radius: 999px;
      background: var(--paper);
      color: var(--ink-soft);
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.06em;
    }

    .xp__value {
      color: var(--accent-deep);
    }

    .xp__unit {
      font-size: 0.85em;
      opacity: 0.75;
    }
  `
})
export class XpCount {
  readonly xp = input<number>(0);

  /**
   * O leitor de tela recebe a frase inteira.
   *
   * "340 XP" lido em voz alta vira "trezentos e quarenta xis pê", que não é uma
   * frase. É o mesmo cuidado do `aria-label` do `BadgeCount`.
   */
  protected readonly ariaLabel = computed(() =>
    this.xp() === 1
      ? '1 ponto de experiência'
      : `${this.xp()} pontos de experiência`
  );
}
