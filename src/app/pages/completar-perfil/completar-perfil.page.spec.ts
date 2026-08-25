import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { MemberProfile } from '../../models/auth.model';
import { CompletarPerfilPage } from './completar-perfil.page';

describe('CompletarPerfilPage', () => {
  let component: CompletarPerfilPage;
  let fixture: ComponentFixture<CompletarPerfilPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let authStore: AuthStore;
  let router: Router;

  const initialProfile: MemberProfile = {
    id: 'p-1',
    email: 'leno@exemplo.com',
    name: 'Leno Sugerido',
    phone: '47999991234',
    bio: '',
    grade: 1,
    linkedin: null,
    instagram: null,
    emailOptOut: false,
    profileCompleted: false,
    role: null,
    tier: 'dev-tier'
  };

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['updateProfile', 'logout']);

    await TestBed.configureTestingModule({
      imports: [CompletarPerfilPage],
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
    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    authStore.setSession({
      accessToken: 'token',
      expiresIn: 3600,
      user: { id: 'u1', email: 'leno@exemplo.com' },
      profileCompleted: false,
      grade: 1,
      role: null,
      tier: 'dev-tier'
    });
    // O perfil completo chega por GET /me, não pela sessão. A page pede sozinha
    // quando o store está vazio; aqui já entregamos o resultado.
    authStore.setProfile(initialProfile);

    fixture = TestBed.createComponent(CompletarPerfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('pré-preenche os campos de nome e telefone que vieram do backend', () => {
    expect(component.form.controls.name.value).toBe('Leno Sugerido');
    expect(component.form.controls.phone.value).toBe('47999991234');
  });

  it('envia dados válidos e redireciona para o dashboard em caso de sucesso', async () => {
    authService.updateProfile.and.returnValue(
      of({
        ...initialProfile,
        name: 'Leno Borges',
        bio: 'Bio com mais de dez caracteres.',
        linkedin: null,
        instagram: null,
        emailOptOut: false,
        profileCompleted: true
      })
    );

    component.form.setValue({
      name: 'Leno Borges',
      phone: '47999991234',
      bio: 'Bio com mais de dez caracteres.'
    });

    await component.submit();

    expect(authService.updateProfile).toHaveBeenCalledWith({
      name: 'Leno Borges',
      phone: '47999991234',
      bio: 'Bio com mais de dez caracteres.'
    });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('mantém os campos preenchidos e exibe mensagem de erro quando o backend falha', async () => {
    // Erro de API chega como HttpErrorResponse, com a mensagem no corpo. Simular
    // um objeto solto com `message` escondia que o codigo lia a propriedade
    // errada, a do proprio HttpErrorResponse, que traz o texto tecnico do Angular.
    authService.updateProfile.and.returnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            url: 'http://localhost:3000/me/profile',
            error: { message: 'Telefone já cadastrado em outra conta.' }
          })
      )
    );

    component.form.setValue({
      name: 'Leno Borges',
      phone: '47999991234',
      bio: 'Bio com mais de dez caracteres.'
    });

    await component.submit();
    fixture.detectChanges();

    expect(component.errorMessage()).toBe('Telefone já cadastrado em outra conta.');
    expect(component.form.controls.name.value).toBe('Leno Borges');
    expect(component.form.controls.bio.value).toBe('Bio com mais de dez caracteres.');
  });

  it('confirmLogout realiza logout e redireciona para a comunidade', async () => {
    authService.logout.and.returnValue(of(undefined));

    await component.confirmLogout();

    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/comunidade']);
  });
});
