import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { DashboardAside } from '../../components/dashboard-aside/dashboard-aside';
import { AuthStore } from '../../core/auth/auth.store';
import { DashboardPage } from './dashboard.page';

/** Os `href` dos cartões que navegam, na ordem em que aparecem na grade. */
function cardRoutes(root: HTMLElement): string[] {
  return Array.from(root.querySelectorAll('.card--link'))
    .map((card) => card.getAttribute('href'))
    .filter((href): href is string => Boolean(href) && href!.startsWith('/'));
}

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let authStore: AuthStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        AuthStore
      ]
    }).compileComponents();

    authStore = TestBed.inject(AuthStore);
    authStore.setSession({
      accessToken: 'token-abc',
      expiresIn: 3600,
      user: { id: 'u1', email: 'leno.borges@exemplo.com' },
      profileCompleted: true,
      grade: 5,
      role: null,
      tier: 'dev-tier'
    });
    authStore.setProfile({
      id: 'p1',
      email: 'leno.borges@exemplo.com',
      name: 'Leno Borges da Silva',
      phone: '47999991234',
      bio: 'Bio',
      grade: 5,
      linkedin: null,
      instagram: null,
      emailOptOut: false,
      profileCompleted: true,
      role: null,
      tier: 'dev-tier',
      pendingLegal: [],
      xp: 0,
      socialLinksPublic: false,
      legalAcceptances: {}
    });

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exibe o primeiro nome no cabeçalho ("Olá, Leno")', () => {
    expect(component.firstName()).toBe('Leno');
    const title = fixture.nativeElement.querySelector('.dashboard__title') as HTMLElement;
    expect(title.textContent).toContain('Olá, Leno');
  });

  it('extrai a insígnia do perfil do store', () => {
    expect(component.grade()).toBe(5);
    const badge = fixture.nativeElement.querySelector('app-badge-count') as HTMLElement;
    expect(badge.textContent).toContain('Insígnia 5');
  });

  it('renderiza os módulos do painel com seus respectivos títulos', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Acessar trilha');
    expect(compiled.textContent).toContain('Financeiro');
    expect(compiled.textContent).toContain('Mural');
    expect(compiled.textContent).toContain('Grupo do WhatsApp');
    expect(compiled.textContent).toContain('Meu Perfil');
    expect(compiled.textContent).toContain('Jogos');
  });

  it('Trilha, Financeiro, Mural e Meu Perfil são cartões que navegam', () => {
    expect(cardRoutes(fixture.nativeElement)).toEqual([
      '/dashboard/trilha',
      '/dashboard/financeiro',
      '/dashboard/mural',
      '/dashboard/perfil'
    ]);
  });

  it('só Jogos fica inerte', () => {
    // A trilha destravou na spec 009 e o cartão ficou para trás por três specs.
    // O WhatsApp saiu daqui quando o link do grupo entrou no `environment`.
    // Meu Perfil destravou na spec 013, junto com o item do aside — a regra é
    // que menu e painel espelham um ao outro, e destravar um e esquecer o outro
    // é a assimetria que este par de testes existe para impedir.
    const root = fixture.nativeElement as HTMLElement;
    const disabled = Array.from(
      root.querySelectorAll<HTMLElement>('.card--disabled .card__title')
    ).map((title) => title.textContent?.trim());

    expect(disabled).toEqual(['Jogos']);
  });

  it('o cartão do WhatsApp aponta para o grupo e abre em nova aba com segurança', () => {
    const root = fixture.nativeElement as HTMLElement;
    const card = root.querySelector<HTMLAnchorElement>('a.card--link[target="_blank"]');

    expect(card).not.toBeNull();
    expect(card!.getAttribute('href')).toBe(environment.whatsappGroupUrl);
    expect(environment.whatsappGroupUrl).toMatch(/^https:\/\/chat\.whatsapp\.com\//);

    // `noopener` não é enfeite: sem ele a aba do grupo recebe `window.opener`
    // e pode reescrever a URL desta, que é a única aba com a sessão dentro.
    expect(card!.getAttribute('rel')).toContain('noopener');
  });

  it('o cartão de Administração só existe para quem tem a claim', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Administração');

    authStore.setProfile({
      id: 'p1',
      email: 'leno.borges@exemplo.com',
      name: 'Leno Borges da Silva',
      phone: '47999991234',
      bio: 'Bio',
      grade: 5,
      linkedin: null,
      instagram: null,
      emailOptOut: false,
      profileCompleted: true,
      role: 'admin',
      tier: 'dev-tier',
      pendingLegal: [],
      xp: 0,
      socialLinksPublic: false,
      legalAcceptances: {}
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Administração');
    expect(cardRoutes(fixture.nativeElement)).toContain('/dashboard/admin');
  });

  /**
   * O teste que impede a divergência de voltar.
   *
   * Os outros testes deste arquivo travam o estado de hoje; este trava a regra.
   * O dashboard e o aside são a mesma lista de destinos em duas formas, e é isso
   * que faz o painel ser aprendível — quem clica no cartão da Trilha e depois vê
   * `Trilha` no menu lateral aprende que os dois são o mesmo lugar.
   *
   * A checagem é de mão única, de propósito: **tudo que está no aside está no
   * dashboard; nem tudo que está no dashboard está no aside.** O Grupo do
   * WhatsApp é a exceção e o motivo dela ser aceita — é um link para fora, com
   * `target="_blank"`, e no aside viraria um item que nunca fica `is-active`.
   */
  it('todo destino do aside tem um cartão no dashboard', () => {
    for (const role of [null, 'admin'] as const) {
      authStore.setProfile({
        id: 'p1',
        email: 'leno.borges@exemplo.com',
        name: 'Leno Borges da Silva',
        phone: '47999991234',
        bio: 'Bio',
        grade: 5,
        linkedin: null,
        instagram: null,
        emailOptOut: false,
        profileCompleted: true,
        role,
        tier: 'dev-tier',
        pendingLegal: [],
        xp: 0,
        socialLinksPublic: false,
        legalAcceptances: {}
      });
      fixture.detectChanges();

      const aside = TestBed.createComponent(DashboardAside);
      aside.componentRef.setInput('expanded', true);
      aside.detectChanges();

      // `/dashboard` é o único destino do aside sem cartão, e é deliberado: um
      // cartão que navega para a tela onde a pessoa já está é um beco.
      const asideRoot = aside.nativeElement as HTMLElement;
      const asideRoutes = Array.from(
        asideRoot.querySelectorAll<HTMLAnchorElement>('a.aside__item')
      )
        .map((item) => item.getAttribute('href'))
        .filter((href): href is string => Boolean(href) && href !== '/dashboard');

      const dashboardRoutes = cardRoutes(fixture.nativeElement);

      expect(asideRoutes.length).toBeGreaterThan(0);
      asideRoutes.forEach((route) => expect(dashboardRoutes).toContain(route));
    }
  });
});
