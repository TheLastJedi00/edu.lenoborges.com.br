import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../shared/logo/logo';

export interface MenuItem {
  readonly label: string;
  readonly href?: string;
  readonly route?: string;
}

export interface MenuAction {
  readonly label: string;
  readonly route?: string;
}

/** Barra fixa de navegação. Cada página passa os seus próprios itens. */
@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [Logo, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip" href="#conteudo">Ir para o conteúdo</a>
    <div class="bar u-shell">
      <a class="mark" [routerLink]="homeRoute()" aria-label="Leno Borges, início">
        <app-logo />
      </a>
      <nav aria-label="Seções da página">
        <ul class="menu u-mono">
          @for (item of items(); track item.label) {
            <li>
              @if (item.route; as route) {
                <a [routerLink]="route">{{ item.label }}</a>
              } @else if (item.href; as href) {
                <a [href]="href" (click)="goTo($event, href)">{{ item.label }}</a>
              }
            </li>
          }
        </ul>
      </nav>

      @if (action(); as act) {
        <div class="bar__action">
          @if (act.route) {
            <a class="action-btn u-mono" [routerLink]="act.route">
              {{ act.label }}
            </a>
          } @else {
            <button type="button" class="action-btn u-mono" (click)="actionClick.emit()">
              {{ act.label }}
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: var(--border-w) solid var(--border-soft);
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .skip {
      position: absolute;
      left: -999px;
      top: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--ink);
      color: #fff;
    }

    .skip:focus {
      left: 1rem;
      z-index: 1;
    }

    .bar {
      display: flex;
      gap: 1rem;
      align-items: center;
      justify-content: space-between;
      padding-block: 0.6rem;
    }

    .mark {
      flex: none;
      display: inline-flex;
      text-decoration: none;
    }

    .bar nav {
      min-width: 0;
    }

    .menu {
      display: flex;
      gap: 0.85rem;
      margin: 0;
      padding: 0;
      overflow-x: auto;
      list-style: none;
      scrollbar-width: none;
    }

    .menu::-webkit-scrollbar {
      display: none;
    }

    .menu a {
      color: var(--ink-soft);
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: color 160ms ease-out, border-color 160ms ease-out;
    }

    .menu a:hover {
      color: var(--accent-deep);
      border-bottom-color: var(--accent);
    }

    .bar__action {
      flex: none;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.4rem 0.85rem;
      border: var(--border-w) solid var(--screen-deep);
      border-radius: var(--radius-sm);
      background: var(--screen);
      color: var(--ink);
      font-size: var(--step--1);
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      white-space: nowrap;
      transition: background 160ms ease-out, border-color 160ms ease-out, color 160ms ease-out;
    }

    .action-btn:hover {
      background: var(--screen-lit);
      border-color: var(--accent);
      color: var(--accent-deep);
    }
  `
})
export class MenuBar {
  readonly items = input.required<readonly MenuItem[]>();
  readonly homeRoute = input('/');
  readonly action = input<MenuAction | null>(null);
  readonly actionClick = output<void>();

  protected goTo(event: Event, href: string): void {
    const target = document.querySelector<HTMLElement>(href);
    if (!target) {
      return;
    }

    event.preventDefault();
    const reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    history.replaceState(null, '', href);
  }
}
