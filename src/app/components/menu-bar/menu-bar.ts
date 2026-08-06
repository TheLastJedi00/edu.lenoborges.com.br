import { ChangeDetectionStrategy, Component } from '@angular/core';

interface MenuItem {
  readonly href: string;
  readonly label: string;
}

/** Barra fixa de navegação por âncoras. */
@Component({
  selector: 'app-menu-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip" href="#conteudo">Ir para o conteúdo</a>
    <div class="bar u-shell">
      <a class="mark" href="#topo">LB</a>
      <nav aria-label="Seções da página">
        <ul class="menu u-mono">
          @for (item of items; track item.href) {
            <li>
              <a [href]="item.href" (click)="goTo($event, item.href)">{{ item.label }}</a>
            </li>
          }
        </ul>
      </nav>
    </div>
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 10;
      border-bottom: var(--border-w) solid var(--ink);
      background: var(--screen-lit);
    }

    .skip {
      position: absolute;
      left: -999px;
      top: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--ink);
      color: var(--screen-lit);
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
      padding: 0.25rem 0.5rem;
      border: 3px solid var(--ink);
      background: var(--cartridge);
      color: var(--paper);
      font-family: var(--font-display);
      font-weight: 700;
      text-decoration: none;
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
      color: var(--ink);
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
      border-bottom: 3px solid transparent;
    }

    .menu a:hover {
      border-bottom-color: var(--cartridge);
    }
  `
})
export class MenuBar {
  protected readonly items: readonly MenuItem[] = [
    { href: '#stack', label: 'Stack' },
    { href: '#dev', label: 'Dev' },
    { href: '#ensino', label: 'Ensino' },
    { href: '#formacao', label: 'Formação' },
    { href: '#contato', label: 'Contato' }
  ];

  /** Leva até a seção e move o foco para ela, mantendo o link utilizável sem JavaScript. */
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
