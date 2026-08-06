import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Marcador de avanço da caixa de diálogo. */
@Component({
  selector: 'app-icon-caret',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 12 8" width="14" height="10" fill="currentColor" focusable="false">
      <path d="M0 0h12v2H0zM2 2h8v2H2zM4 4h4v2H4zM5 6h2v2H5z" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      shape-rendering: crispEdges;
    }
  `
})
export class IconCaret {}
