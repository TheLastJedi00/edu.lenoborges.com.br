import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'ghost';

/** Ação da página. Renderiza âncora quando recebe `href`, botão caso contrário. */
@Component({
  selector: 'app-pixel-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (href(); as target) {
      <a
        class="btn"
        [class.btn--ghost]="variant() === 'ghost'"
        [href]="target"
        [attr.target]="external() ? '_blank' : null"
        [attr.rel]="external() ? 'noopener noreferrer' : null"
      >
        <ng-content />
      </a>
    } @else {
      <button type="button" class="btn" [class.btn--ghost]="variant() === 'ghost'">
        <ng-content />
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
      padding: 0.75rem 1.25rem;
      border: var(--border-w) solid var(--ink);
      border-radius: var(--radius);
      background: var(--cartridge);
      box-shadow: var(--shadow-hard-sm);
      color: var(--paper);
      font-family: var(--font-display);
      font-size: var(--step-0);
      font-weight: 700;
      letter-spacing: 0.02em;
      text-decoration: none;
      cursor: pointer;
      transition:
        transform 120ms steps(2, end),
        box-shadow 120ms steps(2, end);
    }

    .btn--ghost {
      background: var(--paper);
      color: var(--ink);
    }

    .btn:hover {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--ink);
    }

    .btn:active {
      transform: translate(4px, 4px);
      box-shadow: 0 0 0 var(--ink);
    }
  `
})
export class PixelButton {
  readonly href = input<string>();
  readonly variant = input<ButtonVariant>('primary');
  readonly external = input(false);
}
