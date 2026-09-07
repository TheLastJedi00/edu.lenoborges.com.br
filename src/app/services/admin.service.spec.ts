import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { AdminUserDetail, AdminUserPage } from '../models/admin.model';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('usuários', () => {
    /**
     * A paginação é por `offset` desde a spec 015: o `pageToken` era cursor do
     * Firebase Auth, e a lista não é mais uma página do Auth — ela é a base
     * inteira, já filtrada e reordenada, que o Auth nunca viu.
     */
    it('pagina por offset, e nunca mais por pageToken', () => {
      service.listUsers({}, 0, 50).subscribe();
      const primeira = http.expectOne((req) => req.url.endsWith('/admin/users'));
      expect(primeira.request.params.get('offset')).toBe('0');
      expect(primeira.request.params.get('limit')).toBe('50');
      expect(primeira.request.params.has('pageToken')).toBeFalse();
      primeira.flush({ users: [], total: 0, offset: 0, limit: 50 });

      service.listUsers({}, 50).subscribe();
      const segunda = http.expectOne((req) => req.url.endsWith('/admin/users'));
      expect(segunda.request.params.get('offset')).toBe('50');
      segunda.flush({ users: [], total: 0, offset: 50, limit: 50 });
    });

    /**
     * **Teste-trava: filtro ausente não aparece na URL.**
     *
     * `q=` e `tiers=` vazios são ruído que acaba virando filtro por string vazia
     * no dia em que alguém trocar a validação do backend — e o sintoma seria uma
     * lista vazia sem nada na tela explicando por quê.
     */
    it('teste-trava: parâmetro vazio não vai na URL', () => {
      service.listUsers({ q: '', tiers: [], gradeMin: null }).subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/users'));
      expect(req.request.params.has('q')).toBeFalse();
      expect(req.request.params.has('tiers')).toBeFalse();
      expect(req.request.params.has('gradeMin')).toBeFalse();
      expect(req.request.params.has('onboarding')).toBeFalse();
      req.flush({ users: [], total: 0, offset: 0, limit: 50 });
    });

    /**
     * **Teste-trava: dois tiers viram dois valores do MESMO parâmetro.** Uma
     * string com vírgulas chegaria ao backend como um tier chamado "a,b", e o
     * recorte voltaria vazio sem erro nenhum.
     */
    it('teste-trava: tiers com dois itens vira dois valores do mesmo parâmetro', () => {
      service.listUsers({ tiers: ['ultra-dev-tier', 'master-dev-tier'] }).subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/users'));
      expect(req.request.params.getAll('tiers')).toEqual(['ultra-dev-tier', 'master-dev-tier']);
      req.flush({ users: [], total: 0, offset: 0, limit: 50 });
    });

    it('manda a busca e os filtros quando eles existem', () => {
      service
        .listUsers({
          q: 'borges',
          onboarding: 'pendente',
          gradeMin: 0,
          gradeMax: 8,
        })
        .subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/users'));
      expect(req.request.params.get('q')).toBe('borges');
      expect(req.request.params.get('onboarding')).toBe('pendente');
      // Zero e um valor legitimo de piso, e nao "sem filtro": um `if (gradeMin)`
      // no lugar do `!= null` apagaria este parametro em silencio.
      expect(req.request.params.get('gradeMin')).toBe('0');
      expect(req.request.params.get('gradeMax')).toBe('8');
      req.flush({ users: [], total: 0, offset: 0, limit: 50 });
    });

    it('devolve o total do recorte, e não da base', () => {
      let page: AdminUserPage | undefined;
      service.listUsers({ q: 'silva' }).subscribe((r) => (page = r));

      http
        .expectOne((r) => r.url.endsWith('/admin/users'))
        .flush({ users: [], total: 12, offset: 0, limit: 50 });

      expect(page?.total).toBe(12);
    });

    describe('o detalhe', () => {
      it('busca o membro por id', () => {
        let detalhe: AdminUserDetail | undefined;
        service.getUser('uid-1').subscribe((r) => (detalhe = r));

        const req = http.expectOne((r) => r.url.endsWith('/admin/users/uid-1'));
        expect(req.request.method).toBe('GET');
        req.flush({
          id: 'uid-1',
          email: 'membro@test.com',
          emailVerified: true,
          disabled: false,
          role: null,
          createdAt: '2026-08-18T09:00:00.000Z',
          lastSignInAt: null,
          name: 'Leno Borges',
          grade: 4,
          tier: 'great-dev-tier',
          profileCompleted: true,
          emailOptOut: false,
          phone: '47999990000',
          bio: 'Estudando back-end.',
          linkedin: null,
          instagram: null,
          emailOptOutReason: null,
          emailOptOutAt: null,
          waitlistEntryId: 'membro@test.com',
          profileCreatedAt: '2026-08-18T09:02:00.000Z',
          profileUpdatedAt: '2026-08-24T11:00:00.000Z',
          canReceiveEmail: true,
          cannotReceiveReason: null,
        });

        // O telefone so existe aqui: ele nao trafega na listagem.
        expect(detalhe?.phone).toBe('47999990000');
        expect(detalhe?.canReceiveEmail).toBeTrue();
      });

      it('o motivo de não receber vem como código, e não como frase', () => {
        let detalhe: AdminUserDetail | undefined;
        service.getUser('uid-1').subscribe((r) => (detalhe = r));

        http
          .expectOne((r) => r.url.endsWith('/admin/users/uid-1'))
          .flush({
            canReceiveEmail: false,
            cannotReceiveReason: 'descadastrado',
            emailOptOutReason: 'bounce',
          });

        // A tela escolhe o texto por este codigo. Ler a mensagem do backend
        // quebraria na primeira revisao de copy de la.
        expect(detalhe?.cannotReceiveReason).toBe('descadastrado');
      });
    });

    describe('o e-mail direto', () => {
      it('manda só assunto e corpo, sem botão de ação', () => {
        service
          .enviarEmailDireto('uid-1', {
            subject: 'Sobre a sua dúvida',
            body: 'Oi. Vi sua pergunta no Mural.',
          })
          .subscribe();

        const req = http.expectOne((r) => r.url.endsWith('/admin/users/uid-1/email'));
        expect(req.request.method).toBe('POST');
        // Sem ctaLabel e sem ctaUrl: e o primeiro campo que alguem vai querer
        // "so adicionar", e um recado para uma pessoa nao tem para onde apontar.
        expect(req.request.body).toEqual({
          subject: 'Sobre a sua dúvida',
          body: 'Oi. Vi sua pergunta no Mural.',
        });
        req.flush({ id: 'camp-1', status: 'concluida', sentCount: 1 });
      });
    });

    it('mantém na lista quem ainda não tem perfil', () => {
      let page: AdminUserPage | undefined;
      service.listUsers().subscribe((result) => (page = result));

      http
        .expectOne((req) => req.url.endsWith('/admin/users'))
        .flush({
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
              grade: null,
              profileCompleted: false,
            },
          ],
          total: 1,
          offset: 0,
          limit: 50,
        });

      expect(page?.users[0].grade).toBeNull();
      expect(page?.users[0].profileCompleted).toBeFalse();
    });

    it('altera só o grade', () => {
      service.updateUserGrade('uid-1', 7).subscribe();

      const request = http.expectOne((req) => req.url.endsWith('/admin/users/uid-1'));
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
          youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ?si=abc',
        })
        .subscribe();

      const request = http.expectOne((req) => req.url.endsWith('/admin/badges/logica/videos'));
      expect((request.request.body as { youtubeUrl: string }).youtubeUrl).toContain('youtu.be');
      request.flush({});
    });

    it('reordena mandando a lista inteira, e não o item movido', () => {
      // O backend valida que o conjunto bate exatamente e escreve num lote
      // atômico. Mandar só o que mudou deixaria o servidor adivinhando o resto.
      service.reorderVideos('logica', ['c', 'a', 'b']).subscribe();

      const request = http.expectOne((req) =>
        req.url.endsWith('/admin/badges/logica/videos/order'),
      );
      expect(request.request.method).toBe('PATCH');
      expect(request.request.body).toEqual({ videoIds: ['c', 'a', 'b'] });
      request.flush(null);
    });

    /**
     * O painel pede **uma aba por vez**, e a aba é `tab` desde a spec 021. A
     * aba Aulas inclui as respostas que o admin posicionou na trilha, e elas
     * têm `kind: 'resposta'` — pedir por `kind` devolveria a trilha sem elas.
     */
    it('lista uma aba pelo parâmetro tab, e não por kind', () => {
      service.listVideos('logica', 'aula').subscribe();

      const request = http.expectOne((req) => req.url.endsWith('/admin/badges/logica/videos'));

      expect(request.request.params.get('tab')).toBe('aula');
      expect(request.request.params.has('kind')).toBeFalse();
      request.flush({ badgeId: 'logica', videos: [] });
    });

    /**
     * Mandada como `kind`, a lista da trilha com uma resposta dentro seria
     * validada contra a outra sequência: **400 em toda seta clicada**, a partir
     * da primeira resposta posicionada.
     */
    it('reordena a aba pelo parâmetro tab, e não por kind', () => {
      service.reorderVideos('logica', ['c', 'a', 'b'], 'aula').subscribe();

      const request = http.expectOne((req) =>
        req.url.endsWith('/admin/badges/logica/videos/order'),
      );

      expect(request.request.params.get('tab')).toBe('aula');
      expect(request.request.params.has('kind')).toBeFalse();
      request.flush(null);
    });

    it('propaga o 403 de quem não é admin', () => {
      // A claim só vale no próximo token, então um 403 aqui pode significar
      // "acabou de ser promovido e ainda não saiu e entrou". Quem monta essa
      // mensagem é a tela; o service só precisa não engolir o status.
      let status: number | undefined;
      service.listUsers().subscribe({
        error: (error: { status: number }) => (status = error.status),
      });

      http
        .expectOne((req) => req.url.endsWith('/admin/users'))
        .flush('', { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
    });
  });

  describe('Arena de Treinamento (spec 023)', () => {
    it('lista os desafios da insígnia', () => {
      service.listTrainings('logica').subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/badges/logica/trainings'));

      expect(req.request.method).toBe('GET');
      req.flush({ badgeId: 'logica', trainings: [] });
    });

    /**
     * **A posição não vai no corpo, e é isso que o teste guarda.**
     *
     * Ela é calculada no servidor como a última + 1. Mandada daqui, colidiria
     * com a de outro item e a lista passaria a ter dois desafios na mesma
     * posição.
     */
    it('cria sem mandar posição', () => {
      service
        .createTraining('logica', {
          title: 'Refatore o laço',
          description: 'Descrição',
          steps: ['Passo um'],
        })
        .subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/badges/logica/trainings'));

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        title: 'Refatore o laço',
        description: 'Descrição',
        steps: ['Passo um'],
      });
      req.flush({ id: 'trn-1' });
    });

    it('edita pelo id do desafio, sem a insígnia na URL', () => {
      service.updateTraining('trn-1', { title: 'Novo' }).subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/trainings/trn-1'));

      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ title: 'Novo' });
      req.flush({ id: 'trn-1' });
    });

    it('exclui pelo id do desafio', () => {
      service.deleteTraining('trn-1').subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/trainings/trn-1'));

      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('reordena mandando a lista inteira de ids', () => {
      service.reorderTrainings('logica', ['b', 'a']).subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/badges/logica/trainings/reorder'));

      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ orderedIds: ['b', 'a'] });
      req.flush(null);
    });

    it('lista os comentários recentes de toda a Arena', () => {
      service.listTrainingCommentsRecent().subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/admin/trainings/comments/recent'));

      expect(req.request.method).toBe('GET');
      req.flush({ comments: [] });
    });

    it('responde ao comentário e devolve o comentário atualizado', () => {
      let recebido: { adminReply: { content: string } | null } | undefined;

      service
        .replyTrainingComment('cmt-1', 'Rode npm ci antes.')
        .subscribe((comentario) => (recebido = comentario));

      const req = http.expectOne((r) => r.url.endsWith('/admin/trainings/comments/cmt-1/reply'));

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ content: 'Rode npm ci antes.' });
      req.flush({
        id: 'cmt-1',
        adminReply: { content: 'Rode npm ci antes.', authorName: 'Leno' },
      });

      expect(recebido?.adminReply?.content).toBe('Rode npm ci antes.');
    });
  });
});
