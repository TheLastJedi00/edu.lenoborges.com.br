import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardAside } from './dashboard-aside';

describe('DashboardAside', () => {
  let component: DashboardAside;
  let fixture: ComponentFixture<DashboardAside>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAside],
      providers: [provideZonelessChangeDetection(), provideRouter([])]
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

  it('itens inertes estão desabilitados com aria-disabled e selo Em breve', () => {
    const disabledButtons = fixture.nativeElement.querySelectorAll('.aside__item--disabled');
    expect(disabledButtons.length).toBe(3);

    disabledButtons.forEach((btn: HTMLButtonElement) => {
      expect(btn.disabled).toBeTrue();
      expect(btn.getAttribute('aria-disabled')).toBe('true');
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
