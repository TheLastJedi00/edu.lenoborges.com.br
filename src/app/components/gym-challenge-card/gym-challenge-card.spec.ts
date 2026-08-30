import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GymChallengeCard } from './gym-challenge-card';
import { ChallengeState, ChallengeStatus } from '../../models/games.model';

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
    currentXp: 0,
    badgeUnlocked: false,
    hasActiveRound: false,
    replay: false,
    ...extra
  };
}

describe('GymChallengeCard', () => {
  let fixture: ComponentFixture<GymChallengeCard>;

  function render(state: ChallengeState, emphasis = false) {
    fixture.componentRef.setInput('state', state);
    fixture.componentRef.setInput('emphasis', emphasis);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GymChallengeCard],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(GymChallengeCard);
  });

  describe('os quatro estados', () => {
    const casos: [ChallengeStatus, string][] = [
      ['em-breve', 'gym--soon'],
      ['xp-insuficiente', 'gym--locked'],
      ['disponivel', 'gym--ready'],
      ['conquistada', 'gym--won']
    ];

    for (const [status, classe] of casos) {
      it(`${status} desenha ${classe}`, () => {
        const root = render(estado({ status }));

        expect(root.querySelector('.gym')!.classList).toContain(classe);
      });
    }
  });

  it('em breve não tem botão nenhum', () => {
    // Não há para onde ir, e um botão desabilitado prometeria um clique que
    // nem existe.
    const root = render(estado({ status: 'em-breve' }));

    expect(root.querySelector('button')).toBeNull();
    expect(root.textContent).toContain('em breve');
  });

  it('XP insuficiente mostra quanto falta e a barra proporcional', () => {
    const root = render(
      estado({ status: 'xp-insuficiente', currentXp: 340, requiredXp: 500 })
    );

    expect(root.textContent).toContain('160 XP');

    const bar = root.querySelector<HTMLElement>('.gym__bar-fill')!;
    expect(bar.style.width).toBe('68%');
  });

  it('teste-trava: a barra não estoura quando o XP passou do mínimo', () => {
    // Cache velho, aba aberta há uma hora: o servidor ainda diz
    // `xp-insuficiente` e o `currentXp` já passou. Sem o teto, a barra sairia
    // do card — e "faltam -40 XP" seria pior do que zero.
    const root = render(
      estado({ status: 'xp-insuficiente', currentXp: 900, requiredXp: 500 })
    );

    expect(root.querySelector<HTMLElement>('.gym__bar-fill')!.style.width).toBe(
      '100%'
    );
    expect(root.textContent).toContain('0 XP');
  });

  it('teste-trava: requiredXp zero não vira NaN na barra', () => {
    // Uma divisão por zero produziria `NaN%`, que o navegador ignora — e a
    // barra apareceria cheia sem ninguém entender por quê.
    const root = render(
      estado({ status: 'xp-insuficiente', currentXp: 0, requiredXp: 0 })
    );

    const width = root.querySelector<HTMLElement>('.gym__bar-fill')!.style.width;

    expect(width).not.toContain('NaN');
    expect(width).toBe('100%');
  });

  it('disponível diz "Iniciar", e "Continuar" com rodada aberta', () => {
    let root = render(estado({ status: 'disponivel' }));
    expect(root.querySelector('.gym__cta')!.textContent).toContain('Iniciar');

    root = render(estado({ status: 'disponivel', hasActiveRound: true }));
    expect(root.querySelector('.gym__cta')!.textContent).toContain('Continuar');
  });

  it('mostra o selo de treino quando a rodada é replay', () => {
    const root = render(estado({ status: 'disponivel', replay: true }));

    expect(root.textContent).toContain('Modo Treino');
  });

  it('conquistada anuncia a conquista e não oferece "Iniciar"', () => {
    const root = render(estado({ status: 'conquistada', badgeUnlocked: true }));

    expect(root.textContent).toContain('Insígnia Conquistada');
    expect(root.querySelector('.gym__cta')).toBeNull();
  });

  it('a ênfase é uma classe, e não um segundo componente', () => {
    const root = render(estado({ status: 'disponivel' }), true);

    expect(root.querySelector('.gym')!.classList).toContain('gym--emphasis');
  });

  it('as bolinhas anunciam quantas rodadas foram aprovadas', () => {
    // O estado de cada rodada é informação, e um leitor de tela que ouvisse
    // "três círculos" não saberia quantas passaram.
    const root = render(
      estado({
        rounds: [
          { round: 1, difficulty: 'easy', passed: true, score: 9 },
          { round: 2, difficulty: 'medium', passed: false, score: null },
          { round: 3, difficulty: 'hard', passed: false, score: null }
        ],
        currentRound: 2
      })
    );

    expect(
      root.querySelector('.dots')!.getAttribute('aria-label')
    ).toBe('1 de 3 rodadas aprovadas');
  });

  it('teste-trava: nenhum número de XP inventado pelo card', () => {
    // O card não conhece a fórmula, não sabe quanto vale uma questão e não
    // calcula status. Ele desenha o que recebeu.
    const root = render(estado({ status: 'disponivel' }));

    expect(root.textContent).not.toContain('50');
  });
});
