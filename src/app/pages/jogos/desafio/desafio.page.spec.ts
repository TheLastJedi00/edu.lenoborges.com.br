import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { DesafioPage } from './desafio.page';
import { AuthStore } from '../../../core/auth/auth.store';
import { ChallengeState, StartedRound } from '../../../models/games.model';

function estado(extra: Partial<ChallengeState> = {}): ChallengeState {
  return {
    badgeId: 'logica',
    badgeTitle: 'Insígnia da Lógica',
    status: 'disponivel',
    currentRound: 1,
    rounds: [
      { round: 1, difficulty: 'easy', passed: false, score: null },
      { round: 2, difficulty: 'medium', passed: false, score: null },
      { round: 3, difficulty: 'hard', passed: false, score: null }
    ],
    requiredXp: 0,
    currentXp: 100,
    badgeUnlocked: false,
    hasActiveRound: false,
    replay: false,
    ...extra
  };
}

function rodada(quantidade = 2, replay = false): StartedRound {
  return {
    round: 1,
    difficulty: 'easy',
    replay,
    questions: Array.from({ length: quantidade }, (_, index) => ({
      index,
      question: `Enunciado ${index}`,
      alternatives: ['a', 'b', 'c', 'd']
    }))
  };
}

describe('DesafioPage', () => {
  let fixture: ComponentFixture<DesafioPage>;
  let http: HttpTestingController;

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flushEstado(state = estado()) {
    http
      .expectOne((r) => r.url.endsWith('/games/challenges/logica'))
      .flush(state);
    fixture.detectChanges();
  }

  /** Passa pelo aviso: marca o checkbox e clica em continuar. */
  function passarPeloAviso() {
    const check = root().querySelector<HTMLInputElement>(
      '.warning__check input'
    )!;
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    root().querySelector<HTMLButtonElement>('.warning__cta')!.click();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesafioPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          // A página lê o `badgeId` do snapshot. Sem ele a URL sai
          // `/games/challenges/` e nenhuma expectativa casa — foi o que
          // aconteceu na primeira execução deste arquivo.
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ badgeId: 'logica' }) }
          }
        }
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DesafioPage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  describe('o aviso obrigatório', () => {
    it('aparece antes de qualquer coisa', () => {
      flushEstado();

      expect(root().querySelector('.warning')).not.toBeNull();
      expect(root().textContent).toContain('Não se sabote');
    });

    it('teste-trava: o botão fica travado até o checkbox ser marcado', () => {
      // Sem isso o aviso vira um cartaz que se pula sem ler — e ele é o ritual,
      // não a burocracia.
      flushEstado();

      const cta = root().querySelector<HTMLButtonElement>('.warning__cta')!;
      expect(cta.disabled).toBeTrue();

      passarPeloAviso();

      expect(root().querySelector('.warning')).toBeNull();
    });

    it('teste-trava: o checkbox volta desmarcado na rodada seguinte', () => {
      // Ele não é gravado em lugar nenhum — nem no servidor, nem no
      // localStorage — e a repetição é deliberada.
      flushEstado();
      passarPeloAviso();

      fixture.componentInstance['proximaRodada']();
      fixture.detectChanges();

      const check = root().querySelector<HTMLInputElement>(
        '.warning__check input'
      )!;
      expect(check.checked).toBeFalse();
      expect(
        root().querySelector<HTMLButtonElement>('.warning__cta')!.disabled
      ).toBeTrue();
    });

    it('insígnia em breve nem chega a mostrar o aviso', () => {
      // Não há rodada a jogar, e o ritual antes de nada seria ritual à toa.
      flushEstado(estado({ status: 'em-breve' }));

      expect(root().querySelector('.warning')).toBeNull();
      expect(root().textContent).toContain('ainda está sendo preparado');
    });
  });

  describe('a rodada', () => {
    function iniciar(round = rodada()) {
      flushEstado();
      passarPeloAviso();

      root().querySelector<HTMLButtonElement>('.ready__cta')!.click();
      http
        .expectOne((r) => r.url.endsWith('/games/challenges/logica/start'))
        .flush(round);
      fixture.detectChanges();
    }

    it('mostra uma questão por vez, com o progresso', () => {
      iniciar();

      expect(root().querySelectorAll('.option')).toHaveSize(4);
      expect(root().textContent).toContain('Questão 1 de 2');
    });

    it('teste-trava: envia o clientElapsedMs junto da resposta', () => {
      // Ele é a única coisa que este front manda sobre tempo, e o XP nunca é
      // enviado: a fórmula é do servidor.
      iniciar();

      root().querySelectorAll<HTMLButtonElement>('.option')[2].click();

      const req = http.expectOne((r) =>
        r.url.endsWith('/games/challenges/logica/answer')
      );
      const body = req.request.body as Record<string, unknown>;

      expect(Object.keys(body).sort()).toEqual([
        'chosenIndex',
        'clientElapsedMs',
        'questionIndex'
      ]);
      expect(body['chosenIndex']).toBe(2);
      expect(typeof body['clientElapsedMs']).toBe('number');

      req.flush({
        correct: true,
        correctAlternativeIndex: 2,
        xpAwarded: 50,
        replay: false,
        totalXp: 150
      });
      fixture.detectChanges();
    });

    it('pinta a certa em verde e anuncia o resultado', () => {
      iniciar();
      root().querySelectorAll<HTMLButtonElement>('.option')[0].click();

      http
        .expectOne((r) => r.url.endsWith('/games/challenges/logica/answer'))
        .flush({
          correct: false,
          correctAlternativeIndex: 3,
          xpAwarded: 0,
          replay: false,
          totalXp: 100
        });
      fixture.detectChanges();

      const options = root().querySelectorAll('.option');

      expect(options[3].classList).toContain('option--correct');
      expect(options[0].classList).toContain('option--wrong');
      expect(root().querySelector('.quiz__feedback')!.textContent).toContain(
        'Não foi dessa vez'
      );
    });

    it('teste-trava: o XP do AuthStore vem do servidor, e não de uma soma', () => {
      // Somar `xp + xpAwarded` erraria no treino, que paga zero, e em toda
      // resposta errada.
      const authStore = TestBed.inject(AuthStore);
      authStore.setProfile({
        id: 'uid-1',
        email: 'a@b.c',
        name: 'M',
        phone: null,
        bio: null,
        grade: 1,
        linkedin: null,
        instagram: null,
        emailOptOut: false,
        profileCompleted: true,
        role: null,
        tier: 'dev-tier',
        pendingLegal: [],
        legalAcceptances: {},
        xp: 100,
        socialLinksPublic: false,
        nickname: 'M'
      });

      iniciar();
      root().querySelectorAll<HTMLButtonElement>('.option')[0].click();

      http
        .expectOne((r) => r.url.endsWith('/games/challenges/logica/answer'))
        .flush({
          correct: true,
          correctAlternativeIndex: 0,
          xpAwarded: 47,
          replay: false,
          // O servidor diz 900, e não 147: é este número que vale.
          totalXp: 900
        });
      fixture.detectChanges();

      expect(authStore.xp()).toBe(900);
    });

    it('avança para a próxima questão depois do feedback', () => {
      // **`jasmine.clock()` e não `fakeAsync`**: o projeto é zoneless, e o
      // `fakeAsync` depende do `zone-testing.js` que não está carregado. O
      // relógio do Jasmine controla o `setTimeout` do feedback do mesmo jeito.
      jasmine.clock().install();
      iniciar();
      root().querySelectorAll<HTMLButtonElement>('.option')[0].click();

      http
        .expectOne((r) => r.url.endsWith('/games/challenges/logica/answer'))
        .flush({
          correct: true,
          correctAlternativeIndex: 0,
          xpAwarded: 50,
          replay: false,
          totalXp: 150
        });
      fixture.detectChanges();

      expect(root().textContent).toContain('Questão 1 de 2');

      jasmine.clock().tick(1500);
      fixture.detectChanges();

      expect(root().textContent).toContain('Questão 2 de 2');
      jasmine.clock().uninstall();
    });

    it('mostra o selo de treino quando a rodada é replay', () => {
      iniciar(rodada(2, true));

      expect(root().textContent).toContain('Modo Treino');
    });
  });

  describe('os erros da API', () => {
    function tentarIniciar(status: number, message: string) {
      flushEstado();
      passarPeloAviso();
      root().querySelector<HTMLButtonElement>('.ready__cta')!.click();

      http
        .expectOne((r) => r.url.endsWith('/games/challenges/logica/start'))
        .flush({ message }, { status, statusText: 'erro' });
      fixture.detectChanges();
    }

    it('teste-trava: o 403 mostra a mensagem do corpo, e não uma genérica', () => {
      // O 403 tem dois motivos — "o desafio ainda não existe" e "você precisa de
      // mais XP" — e a diferença é tudo o que importa para quem está lendo.
      tentarIniciar(403, 'Você precisa de mais XP para participar desse desafio.');

      expect(root().textContent).toContain('mais XP');
    });

    it('o 409 de rodada em andamento aparece na tela', () => {
      tentarIniciar(409, 'Você já tem uma rodada em andamento.');

      expect(root().textContent).toContain('rodada em andamento');
    });
  });
});
