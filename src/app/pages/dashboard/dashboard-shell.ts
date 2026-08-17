import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../components/confirm-dialog/confirm-dialog';
import { DashboardAside } from '../../components/dashboard-aside/dashboard-aside';
import { IconMenu } from '../../components/icons/icon-menu';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { Logo } from '../../shared/logo/logo';

const ASIDE_EXPANDED_STORAGE_KEY = 'eduleno.aside.expanded';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    DashboardAside,
    ConfirmDialog,
    IconMenu,
    Logo
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell">
      <!-- Barra de cabeçalho mobile -->
      <header class="mobile-header">
        <button
          type="button"
          class="mobile-header__btn"
          aria-label="Abrir menu de navegação"
          (click)="openMobileAside()"
        >
          <app-icon-menu />
        </button>
        <a routerLink="/dashboard" class="mobile-header__logo" aria-label="Liga Dev, início do painel">
          <app-logo variant="mark" />
          <span class="mobile-header__title u-mono">LIGA DEV</span>
        </a>
      </header>

      <div class="shell__layout">
        <app-dashboard-aside
          [expanded]="asideExpanded()"
          [mobileOpen]="mobileAsideOpen()"
          (toggleExpand)="toggleAside()"
          (closeMobile)="closeMobileAside()"
          (logout)="openLogoutConfirm()"
        />

        <main class="shell__main" id="conteudo-painel">
          <router-outlet />
        </main>
      </div>
    </div>

    <app-confirm-dialog
      #logoutDialog
      title="Sair da Liga Dev?"
      message="Deseja encerrar sua sessão no painel da Liga Dev?"
      confirmLabel="Sair"
      cancelLabel="Cancelar"
      [danger]="true"
      (confirmed)="confirmLogout()"
    />
  `,
  styles: `
    .shell {
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
      background: var(--paper);
      color: var(--ink);
    }

    .mobile-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--paper);
      border-bottom: var(--border-w) solid var(--border-soft);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .mobile-header__btn {
      display: inline-flex;
      padding: 0.4rem;
      border: 1px solid var(--screen-deep);
      border-radius: var(--radius-sm);
      background: var(--screen);
      color: var(--ink);
      cursor: pointer;
      transition: background 150ms ease;
    }

    .mobile-header__btn:hover {
      background: var(--screen-lit);
    }

    .mobile-header__logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: var(--ink);
    }

    .mobile-header__title {
      font-weight: 700;
      font-size: var(--step-0);
      letter-spacing: 0.05em;
    }

    .shell__layout {
      flex: 1;
      display: flex;
      width: 100%;
    }

    .shell__main {
      flex: 1;
      min-width: 0;
      padding: 1.5rem 1rem;
    }

    @media (min-width: 64rem) {
      .mobile-header {
        display: none;
      }

      .shell__main {
        padding: 2.5rem 2.5rem;
      }
    }
  `
})
export class DashboardShell implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly authStore = inject(AuthStore);

  private readonly logoutDialog = viewChild<ConfirmDialog>('logoutDialog');

  readonly asideExpanded = signal<boolean>(true);
  readonly mobileAsideOpen = signal<boolean>(false);

  ngOnInit(): void {
    try {
      const saved = localStorage.getItem(ASIDE_EXPANDED_STORAGE_KEY);
      if (saved !== null) {
        this.asideExpanded.set(saved !== 'false');
      }
    } catch {
      // Ignora erro de acesso a storage se cookies/storage estiverem bloqueados
    }
  }

  toggleAside(): void {
    const next = !this.asideExpanded();
    this.asideExpanded.set(next);
    try {
      localStorage.setItem(ASIDE_EXPANDED_STORAGE_KEY, String(next));
    } catch {
      // Ignora erro
    }
  }

  openMobileAside(): void {
    this.mobileAsideOpen.set(true);
  }

  closeMobileAside(): void {
    this.mobileAsideOpen.set(false);
  }

  openLogoutConfirm(): void {
    this.logoutDialog()?.open();
  }

  async confirmLogout(): Promise<void> {
    await firstValueFrom(this.authService.logout());
    await this.router.navigate(['/comunidade']);
  }
}
