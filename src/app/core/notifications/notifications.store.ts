import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { AppNotification } from '../../models/notification.model';

/**
 * O estado do sino (spec 012).
 *
 * Guarda **só as não lidas**, porque é só isso que a API devolve e é só isso que
 * o painel mostra. Não há histórico, e não deve haver: o que aconteceu já está
 * na trilha e no Mural, que são as telas que guardam as coisas de verdade.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly service = inject(NotificationService);

  private readonly items = signal<readonly AppNotification[]>([]);

  readonly unread = this.items.asReadonly();

  readonly unreadCount = computed(() => this.items().length);

  readonly hasUnread = computed(() => this.items().length > 0);

  /**
   * Busca as não lidas.
   *
   * **Falhar aqui não é erro de tela.** A lista fica vazia, o sino fica parado, e
   * nada mais: sem toast, sem faixa vermelha, sem bloqueio. O painel funciona
   * inteiro sem o sino, e um erro de rede numa lista de avisos não pode ser a
   * primeira coisa que a pessoa vê ao abrir o painel.
   */
  async load(): Promise<void> {
    try {
      const list = await firstValueFrom(this.service.list());
      this.items.set(list);
    } catch {
      this.items.set([]);
    }
  }

  /**
   * Marca uma como lida, **otimista**.
   *
   * Sai da lista na hora e volta se a requisição falhar. É o mesmo desenho do
   * voto do Mural, e pela mesma razão: a ação é frequente, e esperar a rede para
   * ver a linha sumir faz o painel parecer travado.
   *
   * A posição é preservada no rollback. Devolver a linha para o fim faria a
   * lista se reorganizar sozinha depois de uma falha, e a pessoa perderia de
   * vista o que estava lendo.
   */
  async markRead(id: string): Promise<void> {
    const before = this.items();
    const index = before.findIndex((item) => item.id === id);
    if (index < 0) {
      return;
    }

    this.items.update((list) => list.filter((item) => item.id !== id));

    try {
      await firstValueFrom(this.service.markRead(id));
    } catch {
      this.items.update((list) => {
        const restored = [...list];
        restored.splice(index, 0, before[index]);
        return restored;
      });
    }
  }

  /** Esvazia tudo, otimista. Mesmo rollback: a lista inteira volta na falha. */
  async markAllRead(): Promise<void> {
    const before = this.items();
    if (before.length === 0) {
      return;
    }

    this.items.set([]);

    try {
      await firstValueFrom(this.service.markAllRead());
    } catch {
      this.items.set(before);
    }
  }
}
