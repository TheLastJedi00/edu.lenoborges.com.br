import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { NotificationCenter } from './notification-center';
import { AppNotification } from '../../models/notification.model';

function notification(over: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'video__git-github__abc',
    kind: 'video',
    title: 'Rebase sem medo',
    badgeId: 'git-github',
    createdAt: new Date().toISOString(),
    ...over
  };
}

describe('NotificationCenter', () => {
  let fixture: ComponentFixture<NotificationCenter>;
  let http: HttpTestingController;
  let el: HTMLElement;

  /** Abre o sino e responde a busca que ele dispara. */
  async function openWith(list: readonly AppNotification[]): Promise<void> {
    el.querySelector<HTMLButtonElement>('.bell')?.click();
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/notificacoes')).flush(list);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCenter],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationCenter);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    el = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    http.verify();
    fixture.destroy();
  });

  it('abrir o sino rebusca as não lidas', async () => {
    await openWith([notification()]);

    expect(el.querySelector('.panel')).not.toBeNull();
    expect(el.querySelectorAll('.row').length).toBe(1);
  });

  /**
   * **Abrir o painel não marca nada.** Como não há histórico, o que some aqui
   * some para sempre: esvaziar a lista no primeiro olhar seria apagar o que o
   * sino acabou de anunciar.
   */
  it('abrir e fechar o painel sem tocar em nada não marca nada', async () => {
    await openWith([notification()]);

    el.querySelector<HTMLElement>('.backdrop')?.click();
    fixture.detectChanges();

    http.expectNone((req) => req.url.includes('/lida'));
  });

  it('tocar a linha abre o modal e marca aquela como lida', async () => {
    await openWith([notification({ id: 'a', title: 'Rebase sem medo' })]);

    el.querySelector<HTMLButtonElement>('.row__open')?.click();
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/notificacoes/a/lida')).flush(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('.modal__title')?.textContent?.trim()).toBe(
      'Rebase sem medo'
    );
  });

  it('o check marca sem abrir o modal', async () => {
    await openWith([notification({ id: 'a' })]);

    el.querySelector<HTMLButtonElement>('.row__check')?.click();
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/notificacoes/a/lida')).flush(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('.modal__title')).toBeNull();
    expect(el.querySelectorAll('.row').length).toBe(0);
  });

  it('marcar todas esvazia a lista', async () => {
    await openWith([notification({ id: 'a' }), notification({ id: 'b' })]);

    el.querySelector<HTMLButtonElement>('.panel__all')?.click();
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/notificacoes/lidas'))
      .flush(null);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.textContent).toContain('Nada novo por aqui');
  });

  it('vídeo leva à trilha da insígnia', async () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    await openWith([notification({ id: 'a', kind: 'video', badgeId: 'poo' })]);
    el.querySelector<HTMLButtonElement>('.row__open')?.click();
    fixture.detectChanges();
    http.expectOne((req) => req.url.endsWith('/notificacoes/a/lida')).flush(null);
    await fixture.whenStable();
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.modal__go')?.click();

    expect(navigate).toHaveBeenCalledWith(['/dashboard/trilha', 'poo']);
  });

  /** O destino é lista, não item: a mais nova em cima é a única ordem em que a anunciada aparece sem rolar. */
  it('pergunta leva ao Mural com as mais recentes em cima', async () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    await openWith([notification({ id: 'a', kind: 'pergunta' })]);
    el.querySelector<HTMLButtonElement>('.row__open')?.click();
    fixture.detectChanges();
    http.expectOne((req) => req.url.endsWith('/notificacoes/a/lida')).flush(null);
    await fixture.whenStable();
    fixture.detectChanges();

    el.querySelector<HTMLButtonElement>('.modal__go')?.click();

    expect(navigate).toHaveBeenCalledWith(['/dashboard/mural'], {
      queryParams: { ordem: 'recentes' }
    });
  });

  it('falha ao carregar deixa o sino parado, sem erro na tela', async () => {
    el.querySelector<HTMLButtonElement>('.bell')?.click();
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/notificacoes'))
      .flush('erro', { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('.bell__count')).toBeNull();
    expect(el.textContent).toContain('Nada novo por aqui');
  });
});
