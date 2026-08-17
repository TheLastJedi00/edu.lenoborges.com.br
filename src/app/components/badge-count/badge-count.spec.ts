import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BadgeCount } from './badge-count';

describe('BadgeCount', () => {
  let fixture: ComponentFixture<BadgeCount>;

  function render(grade: number): HTMLElement {
    fixture.componentRef.setInput('grade', grade);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeCount],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeCount);
  });

  it('conta insígnias durante as GYM Battles', () => {
    const el = render(3);

    expect(el.textContent).toContain('Insígnia 3');
    expect(el.textContent).toContain('8');
  });

  it('mostra a rodada durante a Elite Four, sem contagem', () => {
    // Depois da oitava insígnia o número para de significar contagem, e exibir
    // "Insígnia 10 / 8" seria o resultado de ignorar isso.
    const el = render(10);

    expect(el.textContent).toContain('Quartas');
    expect(el.textContent).not.toContain('/');
  });

  it('mostra o título de campeão em vez da Final', () => {
    const el = render(12);

    expect(el.textContent).toContain('Campeão');
  });

  it('mostra a Battle Frontier no pós-game', () => {
    const el = render(13);

    expect(el.textContent).toContain('Battle Frontier');
  });

  it('não quebra com grade 0', () => {
    const el = render(0);

    expect(el.textContent).toContain('Insígnia 0');
  });

  it('anuncia por extenso para leitor de tela', () => {
    // "Insígnia 3 / 8" lido em voz alta vira "três barra oito", que não é o que
    // a barra quer dizer.
    const el = render(3);
    const badge = el.querySelector('.badge-count');

    expect(badge?.getAttribute('aria-label')).toBe(
      '3 de 8 insígnias conquistadas'
    );
  });

  it('anuncia a fase quando não há contagem', () => {
    const el = render(13);
    const badge = el.querySelector('.badge-count');

    expect(badge?.getAttribute('aria-label')).toBe('Battle Frontier');
  });

  it('não anuncia Grau em nenhum estado', () => {
    // O vocabulário antigo sobreviveria mais tempo no aria-label que na tela,
    // porque ninguém o vê. Ver spec 008, Fase 07 Task 03.
    for (const grade of [0, 3, 8, 10, 12, 13]) {
      const el = render(grade);
      const badge = el.querySelector('.badge-count');

      expect(badge?.getAttribute('aria-label')).not.toContain('Grau');
    }
  });
});
