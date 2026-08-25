import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { NotificationsStore } from './notifications.store';
import { AppNotification } from '../../models/notification.model';

function notification(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'video__git-github__abc',
    kind: 'video',
    title: 'Rebase sem medo',
    badgeId: 'git-github',
    createdAt: '2026-08-25T18:03:11.204Z',
    ...over
  };
}

describe('NotificationsStore', () => {
  let store: NotificationsStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    store = TestBed.inject(NotificationsStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('carrega as não lidas e conta', async () => {
    const loading = store.load();

    http
      .expectOne((req) => req.url.endsWith('/notificacoes'))
      .flush([notification({ id: 'a' }), notification({ id: 'b' })]);
    await loading;

    expect(store.unreadCount()).toBe(2);
    expect(store.hasUnread()).toBe(true);
  });

  /**
   * O painel funciona inteiro sem o sino. Um erro de rede numa lista de avisos
   * não pode virar a primeira coisa que a pessoa vê ao abrir o painel.
   */
  it('falha ao carregar deixa o sino parado, sem estado de erro', async () => {
    const loading = store.load();

    http
      .expectOne((req) => req.url.endsWith('/notificacoes'))
      .flush('erro', { status: 500, statusText: 'Server Error' });
    await loading;

    expect(store.unreadCount()).toBe(0);
    expect(store.hasUnread()).toBe(false);
  });

  it('marcar uma como lida tira só aquela, na hora', async () => {
    const loading = store.load();
    http
      .expectOne((req) => req.url.endsWith('/notificacoes'))
      .flush([notification({ id: 'a' }), notification({ id: 'b' })]);
    await loading;

    const marking = store.markRead('a');
    expect(store.unreadCount()).toBe(1);

    http
      .expectOne((req) => req.url.endsWith('/notificacoes/a/lida'))
      .flush(null);
    await marking;

    expect(store.unread().map((item) => item.id)).toEqual(['b']);
  });

  /**
   * A posição é preservada no rollback: devolver a linha para o fim faria a
   * lista se reorganizar sozinha depois de uma falha.
   */
  it('devolve a linha ao lugar dela quando a marcação falha', async () => {
    const loading = store.load();
    http
      .expectOne((req) => req.url.endsWith('/notificacoes'))
      .flush([
        notification({ id: 'a' }),
        notification({ id: 'b' }),
        notification({ id: 'c' })
      ]);
    await loading;

    const marking = store.markRead('b');
    http
      .expectOne((req) => req.url.endsWith('/notificacoes/b/lida'))
      .flush('erro', { status: 500, statusText: 'Server Error' });
    await marking;

    expect(store.unread().map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('marcar todas esvazia, e devolve tudo na falha', async () => {
    const loading = store.load();
    http
      .expectOne((req) => req.url.endsWith('/notificacoes'))
      .flush([notification({ id: 'a' }), notification({ id: 'b' })]);
    await loading;

    const marking = store.markAllRead();
    expect(store.unreadCount()).toBe(0);

    http
      .expectOne((req) => req.url.endsWith('/notificacoes/lidas'))
      .flush('erro', { status: 500, statusText: 'Server Error' });
    await marking;

    expect(store.unreadCount()).toBe(2);
  });

  it('marcar todas sem nada a marcar não bate na API', async () => {
    await store.markAllRead();

    http.expectNone((req) => req.url.endsWith('/notificacoes/lidas'));
    expect(store.unreadCount()).toBe(0);
  });
});
