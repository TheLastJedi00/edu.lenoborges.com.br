import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { AdminUserPage } from '../models/admin.model';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('usuários', () => {
    /**
     * A paginação é a do Firebase Auth, com `pageToken` opaco — não é página
     * numerada, e não dá para saber quantas faltam. A tela precisa ser um
     * "carregar mais", e não um paginador com números.
     */
    it('pagina por pageToken, e o omite na primeira página', () => {
      service.listUsers().subscribe();
      const first = http.expectOne((req) => req.url.endsWith('/admin/users'));
      expect(first.request.params.has('pageToken')).toBeFalse();
      first.flush({ users: [], nextPageToken: 'proxima' });

      service.listUsers('proxima').subscribe();
      const second = http.expectOne((req) => req.url.endsWith('/admin/users'));
      expect(second.request.params.get('pageToken')).toBe('proxima');
      second.flush({ users: [], nextPageToken: null });
    });

    it('mantém na lista quem ainda não tem perfil', () => {
      let page: AdminUserPage | undefined;
      service.listUsers().subscribe((result) => (page = result));

      http.expectOne((req) => req.url.endsWith('/admin/users')).flush({
        users: [
          {
            id: 'uid-1',
            email: 'novo@test.com',
            emailVerified: false,
            disabled: false,
            role: null,
            tier: 'dev-tier',
            createdAt: '2026-08-18T09:00:00.000Z',
            lastSignInAt: null,
            name: null,
            phone: null,
            grade: null,
            profileCompleted: false
          }
        ],
        nextPageToken: null
      });

      expect(page?.users[0].grade).toBeNull();
      expect(page?.users[0].profileCompleted).toBeFalse();
    });

    it('altera só o grade', () => {
      service.updateUserGrade('uid-1', 7).subscribe();

      const request = http.expectOne((req) =>
        req.url.endsWith('/admin/users/uid-1')
      );
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ grade: 7 });
      request.flush(null);
    });
  });

  describe('vídeos', () => {
    it('manda a URL como o admin colou, e deixa a extração para a API', () => {
      // Se o front extraísse o ID, existiriam duas implementações da mesma
      // regra — e a URL chega em cinco formas.
      service
        .createVideo('logica', {
          title: 'Variáveis na prática',
          youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ?si=abc'
        })
        .subscribe();

      const request = http.expectOne((req) =>
        req.url.endsWith('/admin/badges/logica/videos')
      );
      expect(
        (request.request.body as { youtubeUrl: string }).youtubeUrl
      ).toContain('youtu.be');
      request.flush({});
    });

    it('reordena mandando a lista inteira, e não o item movido', () => {
      // O backend valida que o conjunto bate exatamente e escreve num lote
      // atômico. Mandar só o que mudou deixaria o servidor adivinhando o resto.
      service.reorderVideos('logica', ['c', 'a', 'b']).subscribe();

      const request = http.expectOne((req) =>
        req.url.endsWith('/admin/badges/logica/videos/order')
      );
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ videoIds: ['c', 'a', 'b'] });
      request.flush(null);
    });

    it('propaga o 403 de quem não é admin', () => {
      // A claim só vale no próximo token, então um 403 aqui pode significar
      // "acabou de ser promovido e ainda não saiu e entrou". Quem monta essa
      // mensagem é a tela; o service só precisa não engolir o status.
      let status: number | undefined;
      service.listUsers().subscribe({
        error: (error: { status: number }) => (status = error.status)
      });

      http
        .expectOne((req) => req.url.endsWith('/admin/users'))
        .flush('', { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
    });
  });
});
