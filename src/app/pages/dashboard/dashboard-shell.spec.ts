import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { DashboardShell } from './dashboard-shell';

describe('DashboardShell', () => {
  let component: DashboardShell;
  let fixture: ComponentFixture<DashboardShell>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout', 'getMe']);
    // O shell pede o perfil na abertura: e por ele que `pendingLegal` vira
    // bloqueio (spec 018).
    authServiceSpy.getMe.and.returnValue(of());

    await TestBed.configureTestingModule({
      imports: [DashboardShell],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthStore,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(DashboardShell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('alterna o estado expandido do aside e persiste no localStorage', () => {
    spyOn(localStorage, 'setItem');

    const initial = component.asideExpanded();
    component.toggleAside();

    expect(component.asideExpanded()).toBe(!initial);
    expect(localStorage.setItem).toHaveBeenCalledWith('eduleno.aside.expanded', String(!initial));
  });

  it('controla abertura e fechamento da gaveta no mobile', () => {
    expect(component.mobileAsideOpen()).toBeFalse();

    component.openMobileAside();
    expect(component.mobileAsideOpen()).toBeTrue();

    component.closeMobileAside();
    expect(component.mobileAsideOpen()).toBeFalse();
  });

  it('logout chama authService e redireciona para /comunidade', async () => {
    authService.logout.and.returnValue(of(undefined));

    await component.confirmLogout();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/comunidade']);
  });
});
