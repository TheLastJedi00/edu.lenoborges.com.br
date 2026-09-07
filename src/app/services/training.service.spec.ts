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

  describe('complete', () => {
    it('bate em POST /trainings/:id/complete, sem corpo', () => {
      service.complete('trn-1').subscribe();

      const req = http.expectOne((r) => r.url.endsWith('/trainings/trn-1/complete'));

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
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

      service.complete('trn-1').subscribe((result) => (received = result));

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
