import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type LogoVariant = 'mark' | 'full';

/** Marca do site. `mark` mostra só o símbolo (uso em fundos claros); `full` inclui o wordmark (uso em fundos escuros). */
@Component({
  selector: 'app-logo',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  templateUrl: './logo.html',
  styleUrl: './logo.scss'
})
export class Logo {
  readonly variant = input<LogoVariant>('full');

  protected readonly viewBox = computed(() => (this.variant() === 'mark' ? '0 0 619 560' : '0 0 619 774'));
}
