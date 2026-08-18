import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { TrilhaPage } from './trilha.page';
import { AuthStore } from '../../core/auth/auth.store';
import { Session } from '../../models/auth.model';

function session(grade: number): Session {
  return {
    accessToken: 'token',
    expiresIn: 3600,
    user: { id: 'uid-1', email: 'membro@test.com' },
    profileCompleted: true,
    grade,
    role: null
  };
}

describe('TrilhaPage', () => {
  function setup(grade: number) {
    TestBed.configureTestingModule({
      imports: [TrilhaPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    });

    TestBed.inject(AuthStore).setSession(session(grade));

    const fixture = TestBed.createComponent(TrilhaPage);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('mostra as treze etapas da trilha', () => {
    const { el } = setup(0);

    expect(el.querySelectorAll('app-badge-card').length).toBe(13);
  });

  /**
   * **O teste que sustenta a decisão 6.**
   *
   * A trilha não é presa: nenhum cartão pode estar desabilitado, e todos são
   * links. Travar as etapas seguintes esconderia o mapa de quem está começando —
   * e, no lançamento, quase toda a trilha é "etapa seguinte".
   */
  it('não desabilita nenhuma etapa, mesmo com grade zero', () => {
    const { el } = setup(0);

    expect(el.querySelectorAll('button[disabled]').length).toBe(0);
    expect(el.querySelectorAll('a.badge').length).toBe(13);
  });

  it('marca como conquistada só o que já foi concluído', () => {
    const { el } = setup(3);

    expect(el.querySelectorAll('.badge--conquered').length).toBe(3);
  });

  it('separa a Elite Four e a Battle Frontier das oito insígnias', () => {
    // O vão existe porque as quatro Elite Battles não são "mais quatro
    // insígnias" — a natureza delas é outra, e a tela precisa dizer isso sem
    // texto.
    const { el } = setup(0);

    const gyms = el.querySelectorAll('.gyms app-badge-card');
    const endgame = el.querySelectorAll('.endgame app-badge-card');

    expect(gyms.length).toBe(8);
    expect(endgame.length).toBe(5);
  });

  it('descreve o progresso em palavra, não em número solto', () => {
    const { el } = setup(3);

    expect(el.textContent).toContain('Insígnia 3 / 8');
  });
});
