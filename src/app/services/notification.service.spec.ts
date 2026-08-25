import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import { AppNotification } from '../models/notification.model';

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca as não lidas', () => {
    let received: readonly AppNotification[] | undefined;

    service.list().subscribe((list) => (received = list));

    http.expectOne((req) => req.url.endsWith('/notificacoes')).flush([
      {
        id: 'video__git-github__abc',
        kind: 'video',
        title: 'Rebase sem medo',
        badgeId: 'git-github',
        createdAt: '2026-08-25T18:03:11.204Z'
      }
    ]);

    expect(received?.length).toBe(1);
    expect(received?.[0].kind).toBe('video');
  });

  /**
   * Lista vazia é o estado normal: quase todo dia não há nada novo. Tratar
   * "vazio" como falha é o bug mais provável desta camada, e é o mesmo
   * teste-trava que a trilha e o Mural já têm.
   */
  it('resolve lista vazia como sucesso, não como erro', () => {
    let received: readonly AppNotification[] | undefined;
    let failed = false;

    service.list().subscribe({
      next: (list) => (received = list),
      error: () => (failed = true)
    });

    http.expectOne((req) => req.url.endsWith('/notificacoes')).flush([]);

    expect(received).toEqual([]);
    expect(failed).toBe(false);
  });

  it('marca uma como lida', () => {
    let done = false;

    service.markRead('video__git-github__abc').subscribe(() => (done = true));

    const request = http.expectOne((req) =>
      req.url.endsWith('/notificacoes/video__git-github__abc/lida')
    );
    expect(request.request.method).toBe('POST');
    request.flush(null);

    expect(done).toBe(true);
  });

  it('marca todas como lidas', () => {
    let done = false;

    service.markAllRead().subscribe(() => (done = true));

    const request = http.expectOne((req) =>
      req.url.endsWith('/notificacoes/lidas')
    );
    expect(request.request.method).toBe('POST');
    request.flush(null);

    expect(done).toBe(true);
  });
});
