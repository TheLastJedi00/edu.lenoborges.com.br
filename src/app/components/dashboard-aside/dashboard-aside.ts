import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { Logo } from '../../shared/logo/logo';
import { IconBilling } from '../icons/icon-billing';
import { IconGames } from '../icons/icon-games';
import { IconMural } from '../icons/icon-mural';
import { IconHome } from '../icons/icon-home';
import { IconLogout } from '../icons/icon-logout';
import { IconTrack } from '../icons/icon-track';
import { IconShield } from '../icons/icon-shield';
import { IconUser } from '../icons/icon-user';

/** Espelha o breakpoint do .scss onde a gaveta vira coluna fixa. */
const MOBILE_QUERY = '(max-width: 63.999rem)';

function matchesMobile(): boolean {
  return globalThis.matchMedia?.(MOBILE_QUERY).matches ?? false;
}

export interface AsideNavItem {
  readonly id: string;
  readonly label: string;
  readonly route?: string;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-dashboard-aside',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    Logo,
    IconHome,
    IconTrack,
    IconUser,
    IconGames,
    IconBilling,
    IconMural,
    IconShield,
    IconLogout
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Fundo escurecido do celular (Drawer Backdrop) -->
    @if (mobileOpen()) {
      <div
        class="backdrop"
        aria-hidden="true"
        (click)="closeMobile.emit()"
      ></div>
    }

    <aside
      class="aside"
      [class.aside--expanded]="expanded()"
      [class.aside--mobile-open]="mobileOpen()"
      [attr.inert]="hidden() ? '' : null"
      aria-label="Menu do painel"
    >
      <div class="aside__head">
        <a routerLink="/dashboard" class="aside__logo" (click)="onNavClick('/dashboard')">
          <app-logo variant="mark" />
          @if (expanded()) {
            <span class="aside__logo-text u-mono">LIGA DEV</span>
          }
        </a>

        <!-- Botão de recolher/expandir (Desktop) -->
        <button
          type="button"
          class="aside__toggle"
          [attr.aria-expanded]="expanded()"
          aria-label="Alternar menu lateral"
          (click)="toggleExpand.emit()"
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            [class.rotate-180]="!expanded()"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      <nav class="aside__nav" aria-label="Navegação principal">
        <ul class="aside__list">
          <!-- 1. Home -->
          <li>
            <a
              routerLink="/dashboard"
              routerLinkActive="is-active"
              #homeLink="routerLinkActive"
              [routerLinkActiveOptions]="{ exact: true }"
              [attr.aria-current]="homeLink.isActive ? 'page' : null"
              class="aside__item"
              [title]="!expanded() ? 'Início do Painel' : ''"
              [attr.aria-label]="!expanded() ? 'Início do Painel' : null"
              (click)="onNavClick('/dashboard')"
            >
              <app-icon-home class="aside__icon" />
              @if (expanded()) {
                <span class="aside__label">Home</span>
              }
            </a>
          </li>

          <!--
            2. Trilha
            Destravada na spec 009. O fallback saiu daqui e foi para dentro da
            tela: insígnia sem conteúdo abre e avisa que o material ainda está
            sendo preparado. Travar o botão esconderia o mapa de quem está
            começando — no lançamento, onze das treze etapas estarão vazias, e um
            menu cinza conta uma história pior do que uma trilha aberta.
          -->
          <li>
            <a
              routerLink="/dashboard/trilha"
              routerLinkActive="is-active"
              #trilhaLink="routerLinkActive"
              [attr.aria-current]="trilhaLink.isActive ? 'page' : null"
              class="aside__item"
              [title]="!expanded() ? 'Trilha' : ''"
              [attr.aria-label]="!expanded() ? 'Trilha' : null"
              (click)="onNavClick('/dashboard/trilha')"
            >
              <app-icon-track class="aside__icon" />
              @if (expanded()) {
                <span class="aside__label">Trilha</span>
              }
            </a>
          </li>

          <!-- 3. Financeiro -->
          <li>
            <a
              routerLink="/dashboard/financeiro"
              routerLinkActive="is-active"
              #financeiroLink="routerLinkActive"
              [attr.aria-current]="financeiroLink.isActive ? 'page' : null"
              class="aside__item"
              [title]="!expanded() ? 'Financeiro' : ''"
              [attr.aria-label]="!expanded() ? 'Financeiro' : null"
              (click)="onNavClick('/dashboard/financeiro')"
            >
              <app-icon-billing class="aside__icon" />
              @if (expanded()) {
                <span class="aside__label">Financeiro</span>
              }
            </a>
          </li>

          <!--
            4. Mural
            Ativo para todo mundo, inclusive Dev Tier: quem nao escreve ainda
            vota, e votar e o ato que da valor ao mural.
          -->
          <li>
            <a
              routerLink="/dashboard/mural"
              routerLinkActive="is-active"
              #muralLink="routerLinkActive"
              [attr.aria-current]="muralLink.isActive ? 'page' : null"
              class="aside__item"
              [title]="!expanded() ? 'Mural de Perguntas' : ''"
              [attr.aria-label]="!expanded() ? 'Mural de Perguntas' : null"
              (click)="onNavClick('/dashboard/mural')"
            >
              <app-icon-mural class="aside__icon" />
              @if (expanded()) {
                <span class="aside__label">Mural</span>
              }
            </a>
          </li>

          <!-- 5. Meu Perfil (Inerte) -->
          <li>
            <button
              type="button"
              disabled
              aria-disabled="true"
              class="aside__item aside__item--disabled"
              [title]="!expanded() ? 'Meu Perfil (Em breve)' : ''"
              [attr.aria-label]="!expanded() ? 'Meu Perfil (Em breve)' : null"
            >
              <app-icon-user class="aside__icon" />
              @if (expanded()) {
                <span class="aside__label">Meu Perfil</span>
                <span class="aside__badge u-mono">Em breve</span>
              }
            </button>
          </li>

          <!-- 5. Jogos (Inerte) -->
          <li>
            <button
              type="button"
              disabled
              aria-disabled="true"
              class="aside__item aside__item--disabled"
              [title]="!expanded() ? 'Jogos (Em breve)' : ''"
              [attr.aria-label]="!expanded() ? 'Jogos (Em breve)' : null"
            >
              <app-icon-games class="aside__icon" />
              @if (expanded()) {
                <span class="aside__label">Jogos</span>
                <span class="aside__badge u-mono">Em breve</span>
              }
            </button>
          </li>
        </ul>
      </nav>

      <div class="aside__foot">
        <!--
          Administração, só para quem tem a claim.
          Fica no rodapé, junto do Sair, porque é ferramenta e não navegação de
          aluno. Esconder aqui é conveniência: quem impede o acesso é o
          AdminGuard do backend, e nenhuma tela pode depender de o botão estar
          escondido.
        -->
        @if (authStore.isAdmin()) {
          <a
            routerLink="/dashboard/admin"
            routerLinkActive="is-active"
            #adminLink="routerLinkActive"
            [attr.aria-current]="adminLink.isActive ? 'page' : null"
            class="aside__item"
            [title]="!expanded() ? 'Administração' : ''"
            [attr.aria-label]="!expanded() ? 'Administração' : null"
            (click)="onNavClick('/dashboard/admin')"
          >
            <app-icon-shield class="aside__icon" />
            @if (expanded()) {
              <span class="aside__label">Administração</span>
            }
          </a>
        }

        <button
          type="button"
          class="aside__item aside__item--logout"
          [title]="!expanded() ? 'Sair da conta' : ''"
          [attr.aria-label]="!expanded() ? 'Sair da conta' : null"
          (click)="onLogoutClick()"
        >
          <app-icon-logout class="aside__icon" />
          @if (expanded()) {
            <span class="aside__label">Sair</span>
          }
        </button>
      </div>
    </aside>
  `,
  styles: `
    /* 1. Mobile First: Gaveta (Drawer) */
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 90;
      background: rgba(16, 24, 40, 0.6);
      backdrop-filter: blur(3px);
      animation: anim-fade 200ms ease-out both;
    }

    .aside {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      z-index: 100;
      width: 17rem;
      max-width: 85vw;
      display: flex;
      flex-direction: column;
      background: var(--paper);
      border-right: var(--border-w) solid var(--border-soft);
      box-shadow: var(--shadow-hard);
      transform: translateX(-100%);
      transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1), width 260ms ease;
      padding: 1.25rem 0.75rem;
    }

    .aside--mobile-open {
      transform: translateX(0);
    }

    .aside__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.25rem 0.5rem 1.25rem;
      border-bottom: 1px solid var(--screen-deep);
    }

    .aside__logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: var(--ink);
    }

    .aside__logo-text {
      font-weight: 700;
      font-size: var(--step-0);
      letter-spacing: 0.05em;
    }

    .aside__toggle {
      display: none; /* No mobile a gaveta usa botão fora */
      align-items: center;
      justify-content: center;
      padding: 0.35rem;
      border: 1px solid var(--screen-deep);
      border-radius: var(--radius-sm);
      background: var(--screen);
      color: var(--ink-soft);
      cursor: pointer;
      transition: all 160ms ease;
    }

    .aside__toggle:hover {
      background: var(--screen-lit);
      color: var(--ink);
    }

    .aside__nav {
      flex: 1;
      padding: 1.25rem 0;
      overflow-y: auto;
    }

    .aside__list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }

    .aside__item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.75rem;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--ink);
      font-family: var(--font-body);
      font-size: var(--step-0);
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 150ms ease;
    }

    .aside__item:hover:not(:disabled) {
      background: var(--screen-lit);
      color: var(--accent-deep);
    }

    .aside__item.is-active {
      background: var(--screen);
      border-color: var(--screen-deep);
      color: var(--accent-deep);
      font-weight: 700;
    }

    .aside__item--disabled {
      opacity: 0.55;
      cursor: not-allowed;
      color: var(--ink-soft);
    }

    .aside__icon {
      flex: none;
      display: inline-flex;
    }

    .aside__label {
      flex: 1;
      text-align: left;
      white-space: nowrap;
    }

    .aside__badge {
      flex: none;
      font-size: 0.65rem;
      padding: 0.15rem 0.4rem;
      border-radius: 999px;
      background: var(--screen-deep);
      color: var(--ink-soft);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .aside__foot {
      padding-top: 1rem;
      border-top: 1px solid var(--screen-deep);
    }

    .aside__item--logout {
      color: #c0392b;
    }

    .aside__item--logout:hover {
      background: #fdf2f2;
      color: #a5281b;
    }

    .rotate-180 {
      transform: rotate(180deg);
    }

    /* 2. Desktop Coluna Fixa (>= 64rem) */
    @media (min-width: 64rem) {
      .backdrop {
        display: none;
      }

      .aside {
        position: sticky;
        top: 0;
        height: 100dvh;
        transform: translateX(0);
        box-shadow: none;
        z-index: 10;
        width: 16rem;
      }

      .aside__toggle {
        display: inline-flex;
      }

      .aside:not(.aside--expanded) {
        width: 4.75rem;
        padding: 1.25rem 0.5rem;
      }

      .aside:not(.aside--expanded) .aside__head {
        justify-content: center;
        flex-direction: column;
        gap: 0.75rem;
      }

      .aside:not(.aside--expanded) .aside__item {
        justify-content: center;
        padding: 0.75rem 0;
      }
    }
  `
})
export class DashboardAside {
  /**
   * Lido direto do store, e nao recebido por input.
   *
   * E signal, entao o OnPush reage sozinho quando o perfil chega depois da
   * sessao e o papel muda. Copiar para uma propriedade comum no construtor
   * congelaria o valor no instante da montagem -- que e o erro classico aqui.
   */
  protected readonly authStore = inject(AuthStore);

  readonly expanded = input<boolean>(true);
  readonly mobileOpen = input<boolean>(false);

  readonly toggleExpand = output<void>();
  readonly closeMobile = output<void>();
  readonly logout = output<void>();
  readonly navigate = output<string>();

  /**
   * No celular a gaveta continua no DOM quando fechada, apenas deslocada por
   * `transform`. Sem `inert`, quem navega por teclado ou leitor de tela tabula
   * para dentro de cinco controles invisíveis fora da tela, o Sair entre eles.
   *
   * O breakpoint espelha o do `.scss`, onde a gaveta vira coluna fixa.
   */
  private readonly isMobile = signal(matchesMobile());

  protected readonly hidden = computed(() => this.isMobile() && !this.mobileOpen());

  constructor() {
    const query = globalThis.matchMedia?.(MOBILE_QUERY);
    if (!query) {
      return;
    }

    const onChange = (event: MediaQueryListEvent) => this.isMobile.set(event.matches);
    query.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => query.removeEventListener('change', onChange));
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.mobileOpen()) {
      this.closeMobile.emit();
    }
  }

  onNavClick(route: string): void {
    this.navigate.emit(route);
    if (this.mobileOpen()) {
      this.closeMobile.emit();
    }
  }

  onLogoutClick(): void {
    this.logout.emit();
    if (this.mobileOpen()) {
      this.closeMobile.emit();
    }
  }
}
