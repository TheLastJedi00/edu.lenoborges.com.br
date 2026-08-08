import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'ghost';

/** Ação da página. Renderiza âncora quando recebe `href`, botão caso contrário. */
@Component({
  selector: 'app-pixel-button',
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template #label><ng-content /></ng-template>

    @if (href(); as target) {
      <a
        class="btn"
        [class.btn--ghost]="variant() === 'ghost'"
        [href]="target"
        [attr.target]="external() ? '_blank' : null"
        [attr.rel]="external() ? 'noopener noreferrer' : null"
      >
        <ng-container [ngTemplateOutlet]="label" />
      </a>
    } @else {
      <button type="button" class="btn" [class.btn--ghost]="variant() === 'ghost'">
        <ng-container [ngTemplateOutlet]="label" />
      </button>
    }
  `,
  styles: `
    :host {
      display: inline-block;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.85rem 1.5rem;
      border: none;
      border-radius: 999px;
      background: var(--gradient-accent-strong);
      box-shadow: var(--shadow-hard-sm);
      color: #fff;
      font-family: var(--font-display);
      font-size: var(--step-0);
      font-weight: 700;
      letter-spacing: 0.01em;
      text-decoration: none;
      cursor: pointer;
      transition:
        transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    .btn--ghost {
      background: var(--paper);
      box-shadow: none;
      color: var(--ink);
      border: var(--border-w) solid var(--border-soft);
    }

    .btn:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hard);
    }

    .btn:active {
      transform: translateY(0);
      box-shadow: var(--shadow-hard-sm);
    }
  `
})
export class PixelButton {
  readonly href = input<string>();
  readonly variant = input<ButtonVariant>('primary');
  readonly external = input(false);
}
