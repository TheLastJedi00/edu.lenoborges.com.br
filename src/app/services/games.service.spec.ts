import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { GamesService } from './games.service';
import { AnswerResult, ChallengeState, StartedRound } from '../models/games.model';

describe('GamesService', () => {
  let service: GamesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(GamesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listChallenges', () => {
    it('pede a lista dos desafios do membro', () => {
      let received: readonly ChallengeState[] | undefined;

      service.listChallenges().subscribe((list) => (received = list));

      http
        .expectOne((req) => req.url.endsWith('/games/challenges'))
        .flush({ challenges: [] });

      expect(received).toEqual([]);
    });

    it('desembrulha o `challenges` do corpo', () => {
      // A API responde `{ challenges: [...] }`; quem consome quer a lista. O
      // desembrulho mora aqui e não em cada página.
      let received: readonly ChallengeState[] | undefined;

      service.listChallenges().subscribe((list) => (received = list));

      http.expectOne((req) => req.url.endsWith('/games/challenges')).flush({
        challenges: [{ badgeId: 'logica' }]
      });

      expect(received).toHaveSize(1);
    });
  });

  describe('getChallenge', () => {
    it('pede o desafio da insígnia e devolve o corpo cru', () => {
      let received: ChallengeState | undefined;

      service.getChallenge('logica').subscribe((state) => (received = state));

      const req = http.expectOne((r) =>
        r.url.endsWith('/games/challenges/logica')
      );

      expect(req.request.method).toBe('GET');
      req.flush({ badgeId: 'logica', status: 'disponivel' });

      expect(received?.status).toBe('disponivel');
    });
  });

  describe('startRound', () => {
    it('inicia a rodada com POST e corpo vazio', () => {
      let received: StartedRound | undefined;

      service.startRound('logica').subscribe((round) => (received = round));

      const req = http.expectOne((r) =>
        r.url.endsWith('/games/challenges/logica/start')
      );

      expect(req.request.method).toBe('POST');
      req.flush({ round: 1, difficulty: 'easy', replay: false, questions: [] });

      expect(received?.round).toBe(1);
    });
  });

  describe('answer', () => {
    it('manda os três campos que o servidor espera', () => {
      let received: AnswerResult | undefined;

      service
        .answer('logica', {
          questionIndex: 3,
          chosenIndex: 2,
          clientElapsedMs: 4200
        })
        .subscribe((result) => (received = result));

      const req = http.expectOne((r) =>
        r.url.endsWith('/games/challenges/logica/answer')
      );

      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        questionIndex: 3,
        chosenIndex: 2,
        clientElapsedMs: 4200
      });

      req.flush({
        correct: true,
        correctAlternativeIndex: 2,
        xpAwarded: 47,
        replay: false,
        totalXp: 387
      });

      expect(received?.xpAwarded).toBe(47);
      expect(received?.totalXp).toBe(387);
    });

    it('teste-trava: o corpo não carrega nada além dos três campos', () => {
      // **O `clientElapsedMs` é a única coisa que este front envia sobre tempo,
      // e o XP não é enviado nunca.** Um corpo com `xpAwarded` calculado aqui
      // seria a tela decidindo quanto vale a própria resposta.
      service
        .answer('logica', {
          questionIndex: 0,
          chosenIndex: 0,
          clientElapsedMs: 1000
        })
        .subscribe();

      const req = http.expectOne((r) =>
        r.url.endsWith('/games/challenges/logica/answer')
      );

      expect(Object.keys(req.request.body as object).sort()).toEqual([
        'chosenIndex',
        'clientElapsedMs',
        'questionIndex'
      ]);

      req.flush({
        correct: false,
        correctAlternativeIndex: 1,
        xpAwarded: 0,
        replay: false,
        totalXp: 340
      });
    });
  });
});
