import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Duas espadas cruzadas: o duelo (spec 022).
 *
 * SVG componentizado, e não emoji — regra 1 do repositório. O motivo prático
 * aparece exatamente aqui: um `⚔️` herdaria a fonte do sistema, mudaria de
 * desenho entre Windows, Android e iOS, e não aceitaria `currentColor` — o card
 * desabilitado de Duels precisa que o ícone acompanhe a opacidade do resto.
 */
@Component({
  selector: 'app-icon-duels',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      focusable="false"
    >
      <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
      <path d="m13 19 6-6" />
      <path d="m16 16 4 4" />
      <path d="M19 21c0-1.7 1.3-3 3-3" />
      <path d="M9.5 6.5 21 18v3h-3L6.5 9.5" />
      <path d="m5 16 4-4" />
      <path d="m8 20-4-4" />
      <path d="M5 21c0-1.7-1.3-3-3-3" />
    </svg>
  `,
  styles: ':host { display: inline-flex; }'
})
export class IconDuels {}
