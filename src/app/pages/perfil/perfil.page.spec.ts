import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { MemberProfile } from '../../models/auth.model';
import { PerfilPage } from './perfil.page';

export const PERFIL: MemberProfile = {
  id: 'p-1',
  email: 'leno@exemplo.com',
  name: 'Leno Borges',
  phone: '47999991234',
  bio: 'Desenvolvedor e mentor de programação.',
  grade: 3,
  linkedin: null,
  instagram: null,
  profileCompleted: true,
  role: null,
  tier: 'ultra-dev-tier'
};

describe('PerfilPage', () => {
  let component: PerfilPage;
  let fixture: ComponentFixture<PerfilPage>;
  let authService: jasmine.SpyObj<AuthService>;
  let authStore: AuthStore;
  let router: Router;

  async function montar(profile: MemberProfile = PERFIL): Promise<void> {
    authService.getMe.and.returnValue(of(profile));
    fixture = TestBed.createComponent(PerfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', [
      'getMe',
      'updateProfile',
      'changeEmail',
      'changePassword',
      'deleteAccount'
    ]);

    await TestBed.configureTestingModule({
      imports: [PerfilPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthStore,
        { provide: AuthService, useValue: spy }
      ]
    }).compileComponents();

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    authStore = TestBed.inject(AuthStore);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    authStore.setSession({
      accessToken: 'token',
      expiresIn: 3600,
      user: { id: 'p-1', email: 'leno@exemplo.com' },
      profileCompleted: true,
      grade: 3,
      role: null,
      tier: 'ultra-dev-tier'
    });
  });

  it('pede GET /me e mostra as quatro seções', async () => {
    await montar();

    expect(authService.getMe).toHaveBeenCalled();

    const titulos = Array.from(
      fixture.nativeElement.querySelectorAll('.block__title') as NodeListOf<HTMLElement>
    ).map((el) => el.textContent?.trim());

    expect(titulos).toEqual(['Seus dados', 'Suas redes', 'Acesso', 'Excluir conta']);
  });

  it('não desenha os campos antes de o perfil chegar', () => {
    // Formulário que pisca com valor errado é o que faz alguém salvar por cima
    // do que ainda não tinha chegado.
    authService.getMe.and.returnValue(throwError(() => new Error('lento')));
    fixture = TestBed.createComponent(PerfilPage);
    component = fixture.componentInstance;

    expect(component).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.block')).toBeNull();
  });

  describe('Seus dados', () => {
    it('pré-preenche com o que veio do GET /me', async () => {
      await montar();

      const nome = fixture.nativeElement.querySelector(
        'input[formControlName="name"]'
      ) as HTMLInputElement;
      expect(nome.value).toBe('Leno Borges');
    });

    it('o botão fica travado enquanto nada mudou', async () => {
      await montar();

      const botao = fixture.nativeElement.querySelector('.submit') as HTMLButtonElement;
      expect(botao.disabled).toBeTrue();
    });

    it('salvar manda o PATCH e atualiza o perfil da tela', async () => {
      await montar();

      component['dadosForm'].controls.name.setValue('Leno Novo');
      fixture.detectChanges();

      const botao = fixture.nativeElement.querySelector('.submit') as HTMLButtonElement;
      expect(botao.disabled).toBeFalse();

      authService.updateProfile.and.returnValue(of({ ...PERFIL, name: 'Leno Novo' }));
      await component.salvarDados();
      fixture.detectChanges();

      expect(authService.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'Leno Novo' })
      );
      // Depois de salvar o botão volta a travar: o que está na tela é o que
      // está no servidor.
      const depois = fixture.nativeElement.querySelector('.submit') as HTMLButtonElement;
      expect(depois.disabled).toBeTrue();
    });

    it('erro de rede aparece ABAIXO do formulário, sem navegar', async () => {
      await montar();

      component['dadosForm'].controls.name.setValue('Leno Novo');
      authService.updateProfile.and.returnValue(throwError(() => new Error('offline')));

      await component.salvarDados();
      fixture.detectChanges();

      const alerta = fixture.nativeElement.querySelector('.form__error') as HTMLElement;
      expect(alerta.getAttribute('role')).toBe('alert');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('a linha sobre o nome antigo no Mural está na tela', async () => {
      await montar();

      const nota = fixture.nativeElement.querySelector('#nota-nome') as HTMLElement;
      expect(nota.textContent).toContain('Mural');
    });

    it('sair sem mudar nada não pergunta nada', async () => {
      await montar();

      await expectAsync(Promise.resolve(component.canDeactivate())).toBeResolvedTo(true);
    });

    it('teste-trava: apagar um espaço no fim da bio NÃO conta como alteração', async () => {
      // A comparação é contra o valor normalizado. Contra o texto cru, um espaço
      // a menos dispararia o diálogo de saída.
      await montar();

      component['dadosForm'].controls.bio.setValue(`${PERFIL.bio} `);
      fixture.detectChanges();

      await expectAsync(Promise.resolve(component.canDeactivate())).toBeResolvedTo(true);
    });

    it('sair com alteração não salva abre o diálogo, e cancelar segura a saída', async () => {
      await montar();

      component['dadosForm'].controls.bio.setValue('Uma bio completamente diferente da anterior.');
      fixture.detectChanges();

      const pendente = component.canDeactivate() as Promise<boolean>;
      component['cancelarSaida']();

      await expectAsync(pendente).toBeResolvedTo(false);
    });
  });

  it('falha de rede sem perfil em memória mostra o erro com um caminho de volta', async () => {
    authService.getMe.and.returnValue(throwError(() => new Error('offline')));
    fixture = TestBed.createComponent(PerfilPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const alerta = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alerta.textContent).toContain('Não consegui carregar seu perfil');
    expect(fixture.nativeElement.querySelector('.feedback__retry')).not.toBeNull();
  });
});
