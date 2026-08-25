import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
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
      #bell
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
  private readonly destroyRef = inject(DestroyRef);

  // `read: ElementRef` é obrigatório: sem ele a referência devolve a instância
  // do componente, e o `.focus()` some sem erro nenhum.
  private readonly bell = viewChild('bell', { read: ElementRef });

  protected readonly store = inject(NotificationsStore);

  protected readonly open = signal(false);
  protected readonly detail = signal<AppNotification | null>(null);

  constructor() {
    // Navegar fecha o painel. Sem isto ele fica pairando sobre a tela nova,
    // ancorado a um sino que pode nem estar mais no mesmo lugar.
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.open.set(false);
        this.detail.set(null);
      });
  }

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

  /**
   * Fecha e **devolve o foco ao sino**.
   *
   * Sem isso, quem navega por teclado é jogado para o começo da página ao
   * apertar Esc: o elemento focado deixou de existir, e o navegador recomeça do
   * topo. Sair de um painel não pode custar a posição na tela.
   */
  protected close(): void {
    if (!this.open()) {
      return;
    }

    this.open.set(false);
    (this.bell()?.nativeElement as HTMLElement | undefined)
      ?.querySelector<HTMLButtonElement>('button')
      ?.focus();
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
