import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';
import { Router } from '@angular/router';
import { NotificationsStore } from '../../core/notifications/notifications.store';
import { AppNotification } from '../../models/notification.model';
import { NotificationBell } from '../notification-bell/notification-bell';
import { NotificationPanel } from '../notification-panel/notification-panel';
import { NotificationDialog } from '../notification-dialog/notification-dialog';

/**
 * Sino, painel e modal, juntos (spec 012).
 *
 * Existe para o conjunto poder ser colocado em dois lugares -- a barra do
 * celular e o topo do menu lateral -- sem que cada host tenha que recabear as
 * três peças. O estado das não lidas é do store, que é singleton: as duas
 * instâncias mostram sempre a mesma contagem, e só uma delas está visível de
 * cada vez.
 */
@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [NotificationBell, NotificationPanel, NotificationDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-notification-bell
      [count]="store.unreadCount()"
      [open]="open()"
      (toggle)="toggle()"
    />

    <app-notification-panel
      [open]="open()"
      [notifications]="store.unread()"
      (select)="openDetail($event)"
      (markRead)="markRead($event)"
      (markAllRead)="markAllRead()"
      (close)="close()"
    />

    <app-notification-dialog
      [notification]="detail()"
      (go)="goTo($event)"
      (close)="closeDetail()"
    />
  `,
  styles: `
    :host {
      /* Âncora do painel, que é posicionado em relação ao sino. */
      position: relative;
      display: inline-flex;
    }
  `
})
export class NotificationCenter {
  private readonly router = inject(Router);

  protected readonly store = inject(NotificationsStore);

  protected readonly open = signal(false);
  protected readonly detail = signal<AppNotification | null>(null);

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);

    // Rebusca ao abrir. Sem polling: a notificação chega na próxima vez que a
    // pessoa abre o painel, e um recurso que só existe com o painel aberto não
    // perde nada com isso.
    if (next) {
      void this.store.load();
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  /**
   * Ler é abrir o modal.
   *
   * **Não é abrir o painel**: marcar tudo ao abrir esvaziaria a lista no
   * primeiro olhar, e como não há histórico, o que some aqui some para sempre.
   */
  protected openDetail(item: AppNotification): void {
    this.detail.set(item);
    void this.store.markRead(item.id);
  }

  protected closeDetail(): void {
    this.detail.set(null);
  }

  /** O check da linha: marca e só. Sem abrir modal e sem navegar. */
  protected markRead(id: string): void {
    void this.store.markRead(id);
  }

  protected markAllRead(): void {
    void this.store.markAllRead();
  }

  /**
   * O destino é lista, não item.
   *
   * O Mural abre em "Esta semana" com as mais novas em cima, que é a única
   * ordem em que a pergunta anunciada está visível sem rolar. A ordem padrão da
   * aba não muda para quem chega pelo menu.
   */
  protected goTo(item: AppNotification): void {
    this.detail.set(null);
    this.open.set(false);

    if (item.kind === 'video') {
      void this.router.navigate(['/dashboard/trilha', item.badgeId]);
      return;
    }

    void this.router.navigate(['/dashboard/mural'], {
      queryParams: { ordem: 'recentes' }
    });
  }
}
