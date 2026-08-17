import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { describeProgress } from '../../core/progress/progress';

/**
 * Selo de progresso do membro.
 *
 * Exibe três coisas diferentes conforme a fase, porque `grade` sozinho muda de
 * significado no meio da faixa: contagem de insígnias até a oitava, a rodada da
 * Elite Four depois dela, e o título no pós-game.
 *
 * Dumb component: recebe `grade` e não pergunta nada a ninguém. Quem sabe a
 * tabela é `core/progress`.
 */
@Component({
  selector: 'app-badge-count',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="badge-count u-mono" [attr.aria-label]="ariaLabel()">
      @if (progress().phase === 'gym') {
        <span class="badge-count__current">Insígnia {{ progress().badges }}</span>
        <span class="badge-count__divider" aria-hidden="true">/</span>
        <span class="badge-count__total" aria-hidden="true">{{ total() }}</span>
      } @else {
        <span class="badge-count__current">{{ progress().label }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .badge-count {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border: var(--border-w) solid var(--screen-deep);
      border-radius: 999px;
      background: var(--screen);
      color: var(--ink);
      font-size: var(--step--1);
      font-weight: 700;
      letter-spacing: 0.03em;
      box-shadow: var(--shadow-hard-sm);
    }

    .badge-count__current {
      color: var(--accent-deep);
    }

    .badge-count__divider {
      color: var(--ink-soft);
      opacity: 0.6;
    }

    .badge-count__total {
      color: var(--ink-soft);
      font-size: 0.85em;
    }
  `
})
export class BadgeCount {
  readonly grade = input<number>(0);

  protected readonly progress = computed(() => describeProgress(this.grade()));

  protected readonly total = computed(() => 8);

  /**
   * O leitor de tela recebe a frase inteira.
   *
   * "Insígnia 3 / 8" lido em voz alta vira "insígnia três barra oito", que não é
   * o que a barra quer dizer. Por isso os dois números ficam `aria-hidden` e o
   * rótulo é escrito por extenso aqui.
   */
  protected readonly ariaLabel = computed(() => {
    const p = this.progress();
    if (p.phase === 'gym') {
      return p.badges === 0
        ? 'Nenhuma insígnia conquistada, de 8'
        : `${p.badges} de 8 insígnias conquistadas`;
    }
    return p.label;
  });
}
