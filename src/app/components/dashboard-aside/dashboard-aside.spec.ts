import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardAside } from './dashboard-aside';

describe('DashboardAside', () => {
  let component: DashboardAside;
  let fixture: ComponentFixture<DashboardAside>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAside],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        // O sino da spec 012 vive dentro desta casca, e ele fala com a API.
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAside);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('alterna aria-expanded conforme o input expanded', () => {
    fixture.componentRef.setInput('expanded', true);
    fixture.detectChanges();

    const toggleBtn = fixture.nativeElement.querySelector('.aside__toggle') as HTMLButtonElement;
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');

    fixture.componentRef.setInput('expanded', false);
    fixture.detectChanges();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('não sobrou nenhum item inerte no menu', () => {
    // A Trilha destravou na spec 009, Meu Perfil na 013, e **Jogos na 022** —
    // que era o último. O selo "Em breve" saiu do menu e foi para dentro da tela
    // de Jogos, onde ele agora pertence a um card só: o de Duels.
    const disabledButtons = fixture.nativeElement.querySelectorAll(
      '.aside__item--disabled'
    );

    expect(disabledButtons.length).toBe(0);
  });

  it('Jogos é um link, e fica entre a Trilha e o Mural', () => {
    // A posição conta a história do ciclo de aprendizado: Trilha é conteúdo,
    // Jogos é prática, Mural é discussão (decisão 8).
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.aside__nav a.aside__item')
    );
    const rotas = links.map((a) => a.getAttribute('href'));

    const trilha = rotas.indexOf('/dashboard/trilha');
    const jogos = rotas.indexOf('/dashboard/jogos');
    const mural = rotas.indexOf('/dashboard/mural');

    expect(jogos).toBeGreaterThan(trilha);
    expect(jogos).toBeLessThan(mural);
  });

  /**
   * O teste da Fase 02 da spec 012 garante que **o sino** aparece com o menu
   * recolhido; nunca garantiu que **o painel** cabia, e é por essa fresta que o
   * bug do alinhamento passou.
   */
  it('o sino do aside abre o painel para a direita, e o da barra do celular não', () => {
    const bells = fixture.nativeElement.querySelectorAll(
      'app-notification-center'
    ) as NodeListOf<HTMLElement>;

    const doAside = fixture.nativeElement.querySelector(
      'app-notification-center.aside__bell'
    ) as HTMLElement;
    expect(doAside.getAttribute('align')).toBe('start');

    const outras = Array.from(bells).filter((bell) => bell !== doAside);
    outras.forEach((bell) => {
      expect(bell.getAttribute('align')).toBeNull();
    });
  });

  it('emit logout ao clicar no botão de sair', () => {
    let logoutEmitted = false;
    component.logout.subscribe(() => {
      logoutEmitted = true;
    });

    component.onLogoutClick();
    expect(logoutEmitted).toBeTrue();
  });

  it('não deixa a gaveta fechada capturar foco no celular', () => {
    // A gaveta fechada continua no DOM, só deslocada por transform. Sem inert,
    // quem navega por teclado tabula para dentro de cinco controles invisíveis
    // fora da tela, incluindo o Sair.
    const aside = (fixture.nativeElement as HTMLElement).querySelector('aside');
    const emCelular = globalThis.matchMedia('(max-width: 63.999rem)').matches;

    fixture.componentRef.setInput('mobileOpen', false);
    fixture.detectChanges();
    expect(aside?.hasAttribute('inert')).toBe(emCelular);

    fixture.componentRef.setInput('mobileOpen', true);
    fixture.detectChanges();
    expect(aside?.hasAttribute('inert')).toBeFalse();
  });

  it('marca aria-current apenas quando a rota do item está ativa', () => {
    const home = (fixture.nativeElement as HTMLElement).querySelector(
      'a[href="/dashboard"].aside__item'
    );

    // Fora da rota do painel, nada pode se anunciar como página atual.
    expect(home?.getAttribute('aria-current')).toBeNull();
  });

  it('fecha mobile ao navegar e emite rota', () => {
    fixture.componentRef.setInput('mobileOpen', true);
    fixture.detectChanges();

    let navRoute = '';
    let closed = false;

    component.navigate.subscribe((r) => (navRoute = r));
    component.closeMobile.subscribe(() => (closed = true));

    component.onNavClick('/dashboard');

    expect(navRoute).toBe('/dashboard');
    expect(closed).toBeTrue();
  });
});
