import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { XpCount } from './xp-count';

describe('XpCount', () => {
  function montar(xp: number) {
    TestBed.configureTestingModule({
      imports: [XpCount],
      providers: [provideZonelessChangeDetection()]
    });

    const fixture = TestBed.createComponent(XpCount);
    fixture.componentRef.setInput('xp', xp);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('desenha o número que recebeu', () => {
    const el = montar(340);

    expect(el.textContent).toContain('340');
    expect(el.textContent).toContain('XP');
  });

  /**
   * "340 XP" lido em voz alta vira "trezentos e quarenta xis pê", que não é uma
   * frase. É o mesmo cuidado do `aria-label` do `BadgeCount`.
   */
  it('o leitor de tela recebe a frase por extenso', () => {
    const el = montar(340);

    expect(el.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe(
      '340 pontos de experiência'
    );
  });

  it('um ponto é singular', () => {
    const el = montar(1);

    expect(el.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe(
      '1 ponto de experiência'
    );
  });

  /**
   * **Componente burro** (spec 019, decisão 1). Ele desenha o que recebe e não
   * sabe quanto vale um vídeo: o 10 é do backend, e não existe neste
   * repositório. Este teste fica vermelho no dia em que alguém puser aqui uma
   * multiplicação "só para a tela responder mais rápido".
   */
  it('teste-trava: não multiplica nada — zero é zero', () => {
    const el = montar(0);

    expect(el.textContent).toContain('0');
    expect(el.textContent).not.toContain('10');
  });
});
