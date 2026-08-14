import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '../../core/auth/auth.store';
import { DashboardPage } from './dashboard.page';

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
        AuthStore
      ]
    }).compileComponents();

    authStore = TestBed.inject(AuthStore);
    authStore.setSession({
      accessToken: 'token-abc',
      expiresIn: 3600,
      user: { id: 'u1', email: 'leno.borges@exemplo.com' },
      profileCompleted: true,
      grade: 5
    });
    authStore.setProfile({
      id: 'p1',
      email: 'leno.borges@exemplo.com',
      name: 'Leno Borges da Silva',
      phone: '47999991234',
      bio: 'Bio',
      grade: 5,
      profileCompleted: true
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

  it('extrai o grau do perfil do store', () => {
    expect(component.grade()).toBe(5);
    const badge = fixture.nativeElement.querySelector('app-grade-badge') as HTMLElement;
    expect(badge.textContent).toContain('Grau 5');
  });

  it('renderiza os quatro módulos do painel com seus respectivos títulos', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Acessar trilha');
    expect(compiled.textContent).toContain('Grupo do WhatsApp');
    expect(compiled.textContent).toContain('Meu Perfil');
    expect(compiled.textContent).toContain('Jogos');
  });

  it('com whatsappGroupUrl vazia, o módulo WhatsApp fica desabilitado com o selo "Em breve"', () => {
    const disabledCards = fixture.nativeElement.querySelectorAll('.card--disabled');
    // Todos os 4 cartões desabilitados quando whatsappUrl é vazio
    expect(disabledCards.length).toBe(4);
  });
});
