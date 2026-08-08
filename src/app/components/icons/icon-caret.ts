import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marcador de avanço da caixa de diálogo. */
@Component({
  selector: 'app-icon-caret',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 12 8"
      width="14"
      height="10"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      <path d="M1 1l5 5 5-5" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
  `
})
export class IconCaret {}
