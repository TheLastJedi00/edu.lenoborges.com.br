import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { DesafiosPage } from './desafios.page';
import { ChallengeState, ChallengeStatus } from '../../../models/games.model';

function estado(
  badgeId: string,
  status: ChallengeStatus = 'disponivel'
): ChallengeState {
  return {
    badgeId,
    badgeTitle: `Insígnia ${badgeId}`,
    status,
    currentRound: 1,
    rounds: [
      { round: 1, difficulty: 'easy', passed: false, score: null },
      { round: 2, difficulty: 'medium', passed: false, score: null },
      { round: 3, difficulty: 'hard', passed: false, score: null }
    ],
    requiredXp: 0,
    currentXp: 0,
    badgeUnlocked: false,
    hasActiveRound: false,
    replay: false
  };
}

describe('DesafiosPage', () => {
  let fixture: ComponentFixture<DesafiosPage>;
  let http: HttpTestingController;

  function root(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function flush(challenges: ChallengeState[]) {
    http
      .expectOne((r) => r.url.endsWith('/games/challenges'))
      .flush({ challenges });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesafiosPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DesafiosPage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('desenha um card por insígnia', () => {
    flush([estado('logica'), estado('poo', 'em-breve')]);

    expect(root().querySelectorAll('app-gym-challenge-card')).toHaveSize(2);
  });

  it('cada insígnia com o seu próprio estado', () => {
    flush([estado('logica', 'conquistada'), estado('poo', 'em-breve')]);

    expect(root().querySelectorAll('.gym--won')).toHaveSize(1);
    expect(root().querySelectorAll('.gym--soon')).toHaveSize(1);
  });

  it('o erro oferece uma nova tentativa, e ela refaz a chamada', () => {
    http
      .expectOne((r) => r.url.endsWith('/games/challenges'))
      .flush({}, { status: 500, statusText: 'erro' });
    fixture.detectChanges();

    expect(root().querySelector('.state--error')).not.toBeNull();

    root().querySelector<HTMLButtonElement>('.state__retry')!.click();
    flush([estado('logica')]);

    expect(root().querySelector('.state--error')).toBeNull();
    expect(root().querySelectorAll('app-gym-challenge-card')).toHaveSize(1);
  });

  it('clicar num card disponível navega para o desafio', () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    flush([estado('logica')]);
    root().querySelector<HTMLElement>('app-gym-challenge-card')!.click();

    expect(navigate).toHaveBeenCalledWith([
      '/dashboard/jogos/desafio',
      'logica'
    ]);
  });

  it('teste-trava: o card em breve não navega', () => {
    // A rota daquela insígnia mostraria a mesma frase num lugar diferente —
    // uma viagem para lugar nenhum.
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);

    flush([estado('poo', 'em-breve')]);
    root().querySelector<HTMLElement>('app-gym-challenge-card')!.click();

    expect(navigate).not.toHaveBeenCalled();
  });
});
