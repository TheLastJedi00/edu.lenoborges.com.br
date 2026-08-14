import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { DefinirSenhaPage } from './definir-senha.page';

describe('DefinirSenhaPage', () => {
  let component: DefinirSenhaPage;
  let fixture: ComponentFixture<DefinirSenhaPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let authStore: AuthStore;
  let router: Router;

  const createComponentWithRoute = async (queryParams: Record<string, string> = {}, fragment: string | null = null) => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['setPassword']);

    await TestBed.configureTestingModule({
      imports: [DefinirSenhaPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthStore,
        { provide: AuthService, useValue: authServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap(queryParams),
              fragment
            }
          }
        }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture = TestBed.createComponent(DefinirSenhaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('exibe estado de link inválido quando não há token na query nem no fragmento', async () => {
    await createComponentWithRoute({});
    expect(component.state()).toBe('invalid_link');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Link incompleto ou ausente');
  });

  it('extrai token da query string e permite envio do formulário com sucesso', async () => {
    await createComponentWithRoute({ token_hash: 'valid-token-123' });
    expect(component.state()).toBe('form');

    authService.setPassword.and.returnValue(of(undefined));

    component.form.setValue({
      password: 'new-password-123',
      passwordConfirmation: 'new-password-123'
    });

    await component.submit();
    fixture.detectChanges();

    expect(authService.setPassword).toHaveBeenCalledWith({
      tokenHash: 'valid-token-123',
      password: 'new-password-123',
      passwordConfirmation: 'new-password-123'
    });
    expect(component.state()).toBe('success');
  });

  it('extrai token do fragmento hash (#) quando o Supabase envia no padrão', async () => {
    await createComponentWithRoute({}, 'token_hash=hash-token-456&type=recovery');
    expect(component.state()).toBe('form');

    authService.setPassword.and.returnValue(of(undefined));

    component.form.setValue({
      password: 'new-password-123',
      passwordConfirmation: 'new-password-123'
    });

    await component.submit();
    fixture.detectChanges();

    expect(authService.setPassword).toHaveBeenCalledWith({
      tokenHash: 'hash-token-456',
      password: 'new-password-123',
      passwordConfirmation: 'new-password-123'
    });
    expect(component.state()).toBe('success');
  });

  it('trata erro 400 do backend mudando para o estado expired_error', async () => {
    await createComponentWithRoute({ token_hash: 'expired-token' });

    authService.setPassword.and.returnValue(throwError(() => ({ status: 400 })));

    component.form.setValue({
      password: 'new-password-123',
      passwordConfirmation: 'new-password-123'
    });

    await component.submit();
    fixture.detectChanges();

    expect(component.state()).toBe('expired_error');
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Esse link não vale mais');
  });

  it('goToLogin abre o modal na aba login e redireciona', async () => {
    await createComponentWithRoute({ token_hash: 'token' });
    spyOn(authStore, 'openAuthDialog');

    component.goToLogin();

    expect(authStore.openAuthDialog).toHaveBeenCalledWith('login');
    expect(router.navigate).toHaveBeenCalledWith(['/comunidade']);
  });

  it('requestNewLink abre o modal na aba signup e redireciona', async () => {
    await createComponentWithRoute({ token_hash: 'token' });
    spyOn(authStore, 'openAuthDialog');

    component.requestNewLink();

    expect(authStore.openAuthDialog).toHaveBeenCalledWith('signup');
    expect(router.navigate).toHaveBeenCalledWith(['/comunidade']);
  });
});
