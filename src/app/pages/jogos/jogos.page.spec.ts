import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { JogosPage } from './jogos.page';

describe('JogosPage', () => {
  let fixture: ComponentFixture<JogosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JogosPage],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(JogosPage);
    fixture.detectChanges();
  });

  function cards(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.card'));
  }

  it('mostra as três portas', () => {
    expect(cards()).toHaveSize(3);
  });

  it('GYM Challenge e Ranking são links; Duels não é', () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a.card')
    );

    expect(links.map((a) => a.getAttribute('href')).sort()).toEqual([
      '/dashboard/jogos/desafios',
      '/dashboard/jogos/ranking'
    ]);
  });

  it('teste-trava: Duels é inerte e anuncia isso', () => {
    // A porta fechada está ali para ser LIDA (decisão 1), então ela precisa
    // dizer que está fechada — e não apenas parecer apagada. Um card cinza sem
    // `aria-disabled` e sem o texto "Em breve" é um link quebrado para quem usa
    // leitor de tela.
    const duels = fixture.nativeElement.querySelector('.card--soon');

    expect(duels).toBeTruthy();
    expect(duels.getAttribute('aria-disabled')).toBe('true');
    expect(duels.tagName).not.toBe('A');
    expect(duels.textContent).toContain('Em breve');
  });

  it('teste-trava: nenhum emoji nos cards', () => {
    // Regra 1 do repositório. Os três ícones são SVG componentizado, e o motivo
    // prático aparece no card desabilitado: `currentColor` acompanha a
    // opacidade, e um emoji não acompanharia.
    const texto = fixture.nativeElement.textContent as string;

    expect(/\p{Extended_Pictographic}/u.test(texto)).toBeFalse();
    expect(
      fixture.nativeElement.querySelectorAll('.card__icon svg')
    ).toHaveSize(3);
  });

  it('não faz requisição nenhuma: é uma página estática', () => {
    // Se um dia ela precisar de dados, este teste vira o lembrete de que o hub
    // deixou de ser burro — e de que a decisão precisa ser tomada de novo.
    expect(fixture.componentInstance).toBeTruthy();
  });
});
