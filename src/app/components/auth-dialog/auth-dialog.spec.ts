import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Credentials, SignupRequest } from '../../models/auth.model';
import { AuthDialog } from './auth-dialog';

describe('AuthDialog', () => {
  let component: AuthDialog;
  let fixture: ComponentFixture<AuthDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthDialog],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(AuthDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('inicia na aba de login por padrão', () => {
    expect(component.tab()).toBe('login');
  });

  it('preserva o e-mail digitado ao alternar entre abas', () => {
    component['loginForm'].controls.email.setValue('aluno@seita.dev');
    component.switchTab('signup');

    expect(component.tab()).toBe('signup');
    expect(component['signupForm'].controls.email.value).toBe('aluno@seita.dev');
    expect(component['signupForm'].controls.emailConfirmation.value).toBe('aluno@seita.dev');

    component['signupForm'].controls.email.setValue('outro@seita.dev');
    component.switchTab('login');

    expect(component.tab()).toBe('login');
    expect(component['loginForm'].controls.email.value).toBe('outro@seita.dev');
  });

  it('emite login com as credenciais válidas ao enviar formulário de login', () => {
    let emittedCredentials: Credentials | undefined;
    component.login.subscribe((cred) => {
      emittedCredentials = cred;
    });

    component['loginForm'].setValue({
      email: 'membro@seita.dev',
      password: 'password123'
    });

    component['submitLogin']();

    expect(emittedCredentials!).toEqual({
      email: 'membro@seita.dev',
      password: 'password123'
    });
  });

  it('emite signup com e-mail e confirmação ao enviar formulário de cadastro', () => {
    let emittedSignup: SignupRequest | undefined;
    component.signup.subscribe((req) => {
      emittedSignup = req;
    });

    component.switchTab('signup');
    component['signupForm'].setValue({
      email: 'novomembro@seita.dev',
      emailConfirmation: 'novomembro@seita.dev'
    });

    component['submitSignup']();

    expect(emittedSignup!).toEqual({
      email: 'novomembro@seita.dev',
      emailConfirmation: 'novomembro@seita.dev'
    });
  });

  it('esqueci minha senha emite signup com o e-mail preenchido', () => {
    let emittedForgot: SignupRequest | undefined;
    component.signup.subscribe((req) => {
      emittedForgot = req;
    });

    component['loginForm'].controls.email.setValue('recuperar@seita.dev');
    component['onForgotPassword']();

    expect(emittedForgot!).toEqual({
      email: 'recuperar@seita.dev',
      emailConfirmation: 'recuperar@seita.dev'
    });
  });

  it('limpa o que foi digitado ao fechar, inclusive a senha', () => {
    // Sem isso a senha continua preenchida ao reabrir e segue viva no FormGroup
    // pelo resto da sessão, num dispositivo que pode não ser só do usuário.
    component['loginForm'].setValue({ email: 'alguem@seita.dev', password: 'senha-secreta' });

    component.onNativeClose();

    expect(component['loginForm'].controls.password.value).toBe('');
    expect(component['loginForm'].controls.email.value).toBe('');
  });

  it('exibe o e-mail de destino quando o estado é sent', () => {
    fixture.componentRef.setInput('state', 'sent');
    fixture.componentRef.setInput('sentEmail', 'destino@seita.dev');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('destino@seita.dev');
    expect(compiled.textContent).toContain('Verifique sua caixa de entrada');
  });
});
