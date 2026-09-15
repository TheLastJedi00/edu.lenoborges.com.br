import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TrainingService } from './training.service';
import {
  TrainingCommentList,
  TrainingCompletionResult,
  TrainingList,
} from '../models/training.model';

describe('TrainingService', () => {
  let service: TrainingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TrainingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listByBadge', () => {
    /**
     * **Lista vazia é sucesso, e não erro.**
     *
     * Insígnia sem desafio é o estado normal do produto. Se isto resolvesse
     * pelo caminho de erro, a seção inteira sumiria da trilha com uma mensagem
     * de falha onde deveria dizer que o material ainda está sendo preparado.
     */
    it('resolve lista vazia como sucesso', () => {
      let received: TrainingList | undefined;
      let failed = false;

      service.listByBadge('angular').subscribe({
        next: (list) => (received = list),
        error: () => (failed = true),
      });

      http
        .expectOne((req) => req.url.endsWith('/badges/angular/trainings'))
        .flush({ badgeId: 'angular', trainings: [] });

      expect(failed).toBeFalse();
      expect(received?.trainings).toEqual([]);
    });

    it('preserva a ordem que o servidor mandou', () => {
      let received: TrainingList | undefined;
      service.listByBadge('logica').subscribe((list) => (received = list));

      http
        .expectOne((req) => req.url.endsWith('/badges/logica/trainings'))
        .flush({
          badgeId: 'logica',
          trainings: [
            { id: 'b', position: 0, title: 'Segundo' },
            { id: 'a', position: 1, title: 'Primeiro' },
          ],
        });

      expect(received?.trainings.map((item) => item.id)).toEqual(['b', 'a']);
    });
  });

  describe('getTraining', () => {
    it('bate em GET /trainings/:id', () => {
      service.getTraining('trn-1').subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/trainings/trn-1'));

      expect(req.request.method).toBe('GET');
      req.flush({ id: 'trn-1' });
    });
  });

  describe('uploadResultImage (spec 027)', () => {
    it('manda multipart para a rota de foto e devolve a URL', () => {
      const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
      let recebida: string | undefined;

      service
        .uploadResultImage('trn-1', blob)
        .subscribe((url) => (recebida = url));

      const req = http.expectOne((r) =>
        r.url.endsWith('/trainings/trn-1/result-image'),
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBeTrue();
      expect((req.request.body as FormData).get('file')).toBeTruthy();

      req.flush({ resultImageUrl: 'https://s/b/trainings/u/trn-1?v=1' });

      expect(recebida).toBe('https://s/b/trainings/u/trn-1?v=1');
    });

    /**
     * **A trava desta task.** O navegador precisa escrever o `boundary` do
     * multipart, e so faz isso quando o header nao esta definido. Fixar
     * `multipart/form-data` a mao produz um corpo que o servidor nao separa em
     * partes, e o erro que volta nao fala de header nenhum.
     */
    it('teste-trava: nao define Content-Type a mao', () => {
      const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' });
      service.uploadResultImage('trn-1', blob).subscribe();

      const req = http.expectOne((r) =>
        r.url.endsWith('/trainings/trn-1/result-image'),
      );
      expect(req.request.headers.has('Content-Type')).toBeFalse();

      req.flush({ resultImageUrl: 'https://s/b/trainings/u/trn-1?v=1' });
    });

    it('o 403 do tier chega a quem chamou, porque e a tela que traduz', () => {
      let erro: unknown;
      const blob = new Blob([new Uint8Array([1])], { type: 'image/jpeg' });

      service
        .uploadResultImage('trn-1', blob)
        .subscribe({ error: (e: unknown) => (erro = e) });

      http
        .expectOne((r) => r.url.endsWith('/trainings/trn-1/result-image'))
        .flush(
          { message: 'Enviar a foto do resultado é do Great Dev Tier para cima.' },
          { status: 403, statusText: 'Forbidden' },
        );

      expect(erro).toBeTruthy();
    });
  });

  describe('complete', () => {
    it('bate em POST /trainings/:id/complete com as dicas usadas', () => {
      service.complete('trn-1', { hintsUsed: 2 }).subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/trainings/trn-1/complete'));

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ hintsUsed: 2 });
      req.flush({ trainingId: 'trn-1', completed: true, xpAwarded: 28, xp: 28 });
    });

    it('manda a submissao inteira quando ela existe', () => {
      service
        .complete('trn-1', {
          hintsUsed: 1,
          mainCode: 'public static void main() {}',
          resultImageUrl: 'https://s/b/trainings/u/trn-1?v=1',
        })
        .subscribe();

      const req = http.expectOne((r) =>
        r.url.endsWith('/trainings/trn-1/complete'),
      );

      expect(req.request.body).toEqual({
        hintsUsed: 1,
        mainCode: 'public static void main() {}',
        resultImageUrl: 'https://s/b/trainings/u/trn-1?v=1',
      });
      req.flush({ trainingId: 'trn-1', completed: true, xpAwarded: 29, xp: 29 });
    });

    /**
     * Sem dica revelada o corpo vai com zero, e não vazio: o servidor trata os
     * dois do mesmo jeito, e mandar o número deixa a requisição dizendo o que
     * aconteceu em vez de deixar o leitor deduzir do silêncio.
     */
    it('manda zero quando nenhuma dica foi revelada', () => {
      service.complete('trn-1', { hintsUsed: 0 }).subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/trainings/trn-1/complete'));

      expect(req.request.body).toEqual({ hintsUsed: 0 });
      req.flush({ trainingId: 'trn-1', completed: true, xpAwarded: 30, xp: 30 });
    });

    /**
     * **O `xp` vem do servidor, e este método não o calcula.**
     *
     * Concluir de novo paga zero, então uma soma local acertaria no primeiro
     * clique de cada desafio e erraria em todos os seguintes.
     */
    it('devolve o xp do servidor sem recalcular nada', () => {
      let received: TrainingCompletionResult | undefined;

      service
        .complete('trn-1', { hintsUsed: 0 })
        .subscribe((result) => (received = result));

      http
        .expectOne((r) => r.url.endsWith('/trainings/trn-1/complete'))
        .flush({
          trainingId: 'trn-1',
          completed: true,
          xpAwarded: 0,
          xp: 130,
        });

      expect(received?.xpAwarded).toBe(0);
      expect(received?.xp).toBe(130);
    });
  });

  describe('listComments', () => {
    it('sem opções, não manda parâmetro nenhum', () => {
      service.listComments('trn-1').subscribe();

      const req = http.expectOne(
        (r) => r.url.endsWith('/trainings/trn-1/comments') && !r.params.keys().length,
      );

      expect(req.request.method).toBe('GET');
      req.flush({ comments: [], nextCursor: null });
    });

    /**
     * Parâmetro vazio não vai na URL.
     *
     * Um `after=` vazio acaba virando cursor por string vazia no dia em que a
     * validação do backend mudar, e o sintoma seria uma página que repete a
     * primeira sem nada na tela explicando por quê.
     */
    it('manda limit e after quando eles existem', () => {
      service.listComments('trn-1', { limit: 25, after: 'cmt-9' }).subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/trainings/trn-1/comments'));

      expect(req.request.params.get('limit')).toBe('25');
      expect(req.request.params.get('after')).toBe('cmt-9');
      req.flush({ comments: [], nextCursor: null });
    });

    it('devolve o cursor da próxima página', () => {
      let received: TrainingCommentList | undefined;

      service.listComments('trn-1').subscribe((list) => (received = list));

      http
        .expectOne((r) => r.url.endsWith('/trainings/trn-1/comments'))
        .flush({ comments: [], nextCursor: 'cmt-10' });

      expect(received?.nextCursor).toBe('cmt-10');
    });
  });

  describe('addComment', () => {
    it('bate em POST /trainings/:id/comments com o texto no corpo', () => {
      service.addComment('trn-1', 'Travei no passo 3').subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/trainings/trn-1/comments'));

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ content: 'Travei no passo 3' });
      req.flush({ id: 'cmt-1' });
    });
  });
});
