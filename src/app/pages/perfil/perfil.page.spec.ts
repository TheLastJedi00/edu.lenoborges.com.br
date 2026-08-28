import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
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
  emailOptOut: false,
  profileCompleted: true,
  role: null,
  tier: 'ultra-dev-tier',
  pendingLegal: [],
  xp: 0,
  socialLinksPublic: false,
  legalAcceptances: {}
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
      'deleteAccount',
      'setEmailPreference',
      'setSocialLinksPublic'
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

  it('pede GET /me e mostra as seis seções', async () => {
    await montar();

    expect(authService.getMe).toHaveBeenCalled();

    const titulos = Array.from(
      fixture.nativeElement.querySelectorAll('.block__title') as NodeListOf<HTMLElement>
    ).map((el) => el.textContent?.trim());

    expect(titulos).toEqual([
      'Seus dados',
      'Suas redes',
      'Acesso',
      'E-mails',
      'Contratos',
      'Excluir conta'
    ]);
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

      const botao = fixture.nativeElement.querySelector('form .btn--solid') as HTMLButtonElement;
      expect(botao.disabled).toBeTrue();
    });

    it('salvar manda o PATCH e atualiza o perfil da tela', async () => {
      await montar();

      component['dadosForm'].controls.name.setValue('Leno Novo');
      fixture.detectChanges();

      const botao = fixture.nativeElement.querySelector('form .btn--solid') as HTMLButtonElement;
      expect(botao.disabled).toBeFalse();

      authService.updateProfile.and.returnValue(of({ ...PERFIL, name: 'Leno Novo' }));
      await component.salvarDados();
      fixture.detectChanges();

      expect(authService.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'Leno Novo' })
      );
      // Depois de salvar o botão volta a travar: o que está na tela é o que
      // está no servidor.
      const depois = fixture.nativeElement.querySelector('form .btn--solid') as HTMLButtonElement;
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

  describe('Suas redes', () => {
    function campo(nome: 'linkedin' | 'instagram'): HTMLInputElement {
      return fixture.nativeElement.querySelector(
        `input[formControlName="${nome}"]`
      ) as HTMLInputElement;
    }

    it('handle vira URL completa no próprio campo, ao sair dele', async () => {
      // A pessoa vê no que o texto dela virou antes de salvar, em vez de
      // descobrir depois.
      await montar();

      component['redesForm'].controls.linkedin.setValue('@leno');
      component['normalizarLinkedin']();
      fixture.detectChanges();

      expect(campo('linkedin').value).toBe('https://www.linkedin.com/in/leno');
    });

    it('a URL inteira e o nome de usuário solto também são aceitos', async () => {
      await montar();

      component['redesForm'].controls.instagram.setValue('instagram.com/leno');
      component['normalizarInstagram']();
      expect(component['redesForm'].controls.instagram.value).toBe(
        'https://www.instagram.com/leno'
      );

      component['redesForm'].controls.instagram.setValue('leno');
      component['normalizarInstagram']();
      expect(component['redesForm'].controls.instagram.value).toBe(
        'https://www.instagram.com/leno'
      );
    });

    it('domínio errado vira erro no campo, e não é "consertado"', async () => {
      await montar();

      component['redesForm'].controls.linkedin.setValue('evil.com/leno');
      component['normalizarLinkedin']();
      fixture.detectChanges();

      const erro = fixture.nativeElement.querySelector('#erro-linkedin') as HTMLElement;
      expect(erro).not.toBeNull();
      expect(campo('linkedin').value).toBe('evil.com/leno');

      await component.salvarRedes();
      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('teste-trava: salvar as redes NÃO manda o que está no formulário de dados', async () => {
      // Os dois formulários chamam o mesmo PATCH. Salvar as redes não pode
      // publicar uma bio pela metade que a pessoa ainda estava escrevendo.
      await montar();

      component['dadosForm'].controls.bio.setValue('Bio no meio da fra');
      component['redesForm'].controls.linkedin.setValue('@leno');
      authService.updateProfile.and.returnValue(of(PERFIL));

      await component.salvarRedes();

      expect(authService.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: PERFIL.name,
          phone: PERFIL.phone,
          bio: PERFIL.bio,
          linkedin: 'https://www.linkedin.com/in/leno'
        })
      );
    });

    it('campo apagado manda string vazia, e volta vazio depois de salvar', async () => {
      await montar({ ...PERFIL, linkedin: 'https://www.linkedin.com/in/leno' });

      expect(campo('linkedin').value).toBe('https://www.linkedin.com/in/leno');

      component['redesForm'].controls.linkedin.setValue('');
      authService.updateProfile.and.returnValue(of({ ...PERFIL, linkedin: null }));

      await component.salvarRedes();
      fixture.detectChanges();

      expect(authService.updateProfile).toHaveBeenCalledWith(
        jasmine.objectContaining({ linkedin: '' })
      );
      expect(campo('linkedin').value).toBe('');
    });
  });

  describe('Acesso', () => {
    it('fechado, o bloco da senha não mostra dado nenhum', async () => {
      await montar();

      const valores = Array.from(
        fixture.nativeElement.querySelectorAll('.acesso__value') as NodeListOf<HTMLElement>
      ).map((el) => el.textContent?.trim());

      expect(valores).toEqual(['leno@exemplo.com', 'Senha · alterada por você']);
    });

    it('a explicação do campo de senha atual aparece nos dois blocos abertos', async () => {
      await montar();

      component['abrirAcesso']('email');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(
        'Confirmamos que é você antes de mudar o acesso.'
      );

      component['abrirAcesso']('senha');
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(
        'Confirmamos que é você antes de mudar o acesso.'
      );
    });

    it('fechar cancela e limpa os campos, inclusive os de senha', async () => {
      await montar();

      component['abrirAcesso']('senha');
      component['senhaForm'].controls.currentPassword.setValue('minha-senha');
      component['fecharAcesso']();

      expect(component['senhaForm'].controls.currentPassword.value).toBe('');
      expect(component['acessoAberto']()).toBeNull();
    });

    it('teste-trava: o 202 da troca de e-mail NÃO muda o e-mail exibido nem o store', async () => {
      // É o reflexo mais provável de quem for implementar, e a mentira só
      // apareceria no próximo login, falhando.
      await montar();

      component['abrirAcesso']('email');
      component['emailForm'].setValue({ newEmail: 'novo@exemplo.com', password: 'senha' });
      authService.changeEmail.and.returnValue(of(undefined));

      await component.pedirTrocaDeEmail();
      fixture.detectChanges();

      expect(component['profile']()?.email).toBe('leno@exemplo.com');
      expect(authStore.user()?.email).toBe('leno@exemplo.com');
    });

    it('o 202 mantém o bloco aberto com a confirmação enviada', async () => {
      // Fica aberto para a pessoa reenviar se o e-mail não chegar.
      await montar();

      component['abrirAcesso']('email');
      component['emailForm'].setValue({ newEmail: 'novo@exemplo.com', password: 'senha' });
      authService.changeEmail.and.returnValue(of(undefined));

      await component.pedirTrocaDeEmail();
      fixture.detectChanges();

      expect(component['acessoAberto']()).toBe('email');
      const ok = fixture.nativeElement.querySelector('.acesso__ok') as HTMLElement;
      expect(ok.textContent).toContain('Confirmação enviada para novo@exemplo.com');
      expect(ok.textContent).toContain('sessão termina');
    });

    it('401 na troca de e-mail mostra Senha incorreta dentro do bloco, sem navegar', async () => {
      await montar();

      component['abrirAcesso']('email');
      component['emailForm'].setValue({ newEmail: 'novo@exemplo.com', password: 'errada' });
      authService.changeEmail.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401 }))
      );

      await component.pedirTrocaDeEmail();
      fixture.detectChanges();

      const erro = fixture.nativeElement.querySelector('.form__error') as HTMLElement;
      expect(erro.textContent).toContain('Senha incorreta.');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('o aviso de que a sessão termina está na tela, e não há diálogo', async () => {
      await montar();

      component['abrirAcesso']('senha');
      fixture.detectChanges();

      const aviso = fixture.nativeElement.querySelector('.acesso__warn') as HTMLElement;
      expect(aviso.textContent).toContain('sai de todos os aparelhos');
    });

    it('senhas diferentes travam o botão', async () => {
      await montar();

      component['abrirAcesso']('senha');
      component['senhaForm'].setValue({
        currentPassword: 'antiga',
        newPassword: 'nova-senha-forte',
        confirmPassword: 'nova-senha-fort'
      });
      fixture.detectChanges();

      expect(component['senhasConferem']()).toBeFalse();

      await component.trocarSenha();
      expect(authService.changePassword).not.toHaveBeenCalled();
    });

    it('sucesso na troca de senha vai para a landing com ?entrar=1', async () => {
      // Cair numa tela de login sem contexto é indistinguível de ter sido
      // deslogado por erro.
      await montar();

      component['abrirAcesso']('senha');
      component['senhaForm'].setValue({
        currentPassword: 'antiga',
        newPassword: 'nova-senha-forte',
        confirmPassword: 'nova-senha-forte'
      });
      authService.changePassword.and.returnValue(of(undefined));

      await component.trocarSenha();

      expect(authService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'antiga',
        newPassword: 'nova-senha-forte'
      });
      expect(router.navigate).toHaveBeenCalledWith(['/'], {
        queryParams: { entrar: '1', senha: 'trocada' }
      });
    });

    it('teste-trava: 401 na troca de senha não navega e não desloga', async () => {
      await montar();

      component['abrirAcesso']('senha');
      component['senhaForm'].setValue({
        currentPassword: 'errada',
        newPassword: 'nova-senha-forte',
        confirmPassword: 'nova-senha-forte'
      });
      authService.changePassword.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401 }))
      );

      await component.trocarSenha();
      fixture.detectChanges();

      const erro = fixture.nativeElement.querySelector('.form__error') as HTMLElement;
      expect(erro.textContent).toContain('Senha incorreta.');
      expect(router.navigate).not.toHaveBeenCalled();
      expect(authStore.isLoggedIn()).toBeTrue();
    });
  });

  describe('Excluir conta', () => {
    function abrir(): HTMLDialogElement {
      const dialog = fixture.nativeElement.querySelector('dialog.modal') as HTMLDialogElement;
      spyOn(dialog, 'showModal').and.callFake(() => dialog.setAttribute('open', ''));
      spyOn(dialog, 'close').and.callFake(() => dialog.removeAttribute('open'));
      component['abrirExclusao']();
      fixture.detectChanges();
      return dialog;
    }

    function digitarSenha(dialog: HTMLDialogElement, senha: string): void {
      const campo = dialog.querySelector('.modal__input') as HTMLInputElement;
      campo.value = senha;
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    it('a lista do que some e do que fica está na tela, com as duas colunas', async () => {
      await montar();

      const colunas = Array.from(
        fixture.nativeElement.querySelectorAll('.excluir__col') as NodeListOf<HTMLElement>
      ).map((el) => el.textContent?.trim());

      expect(colunas).toEqual(['Some para sempre', 'Fica, sem o seu nome']);
      expect(fixture.nativeElement.textContent).toContain('Membro removido');
    });

    it('o botão final fica travado enquanto a senha está vazia', async () => {
      await montar();
      const dialog = abrir();

      const botao = dialog.querySelector('.modal__btn--danger') as HTMLButtonElement;
      expect(botao.disabled).toBeTrue();

      digitarSenha(dialog, 'minha-senha');
      expect(botao.disabled).toBeFalse();
    });

    it('teste-trava: o foco inicial do diálogo é o Cancelar', async () => {
      // É a única tela do produto onde o botão perigoso não pode estar a um
      // Enter de distância. O padrão do confirm-dialog é focar o confirmar —
      // aqui é exceção declarada, não descuido.
      jasmine.clock().install();
      await montar();
      const dialog = abrir();

      jasmine.clock().tick(60);
      const cancelar = dialog.querySelector('.modal__btn') as HTMLButtonElement;
      expect(cancelar.textContent?.trim()).toBe('Cancelar');
      expect(document.activeElement).toBe(cancelar);
      jasmine.clock().uninstall();
    });

    it('204 limpa a sessão e vai para a landing, sem toast de sucesso', async () => {
      await montar();
      const dialog = abrir();
      digitarSenha(dialog, 'minha-senha');

      authService.deleteAccount.and.callFake(() => {
        authStore.clearSession();
        return of(undefined);
      });

      (dialog.querySelector('.modal__btn--danger') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(authService.deleteAccount).toHaveBeenCalledWith('minha-senha');
      expect(authStore.isLoggedIn()).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('401 mantém o diálogo aberto, com a mensagem dentro, sem navegar', async () => {
      // Fechar o diálogo no erro faria a pessoa recomeçar do zero.
      await montar();
      const dialog = abrir();

      authService.deleteAccount.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 401 }))
      );

      await component.excluirConta('errada');
      fixture.detectChanges();

      expect(dialog.hasAttribute('open')).toBeTrue();
      const erro = dialog.querySelector('.modal__error') as HTMLElement;
      expect(erro.textContent).toContain('Senha incorreta.');
      expect(router.navigate).not.toHaveBeenCalled();
      expect(authStore.isLoggedIn()).toBeTrue();
    });

    it('403 de admin mostra a mensagem do backend, literal', async () => {
      // Nesse caso quem lê é quem consegue resolver.
      await montar();
      const dialog = abrir();

      authService.deleteAccount.and.returnValue(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 403,
              error: { message: 'Contas de administração não podem ser excluídas por aqui.' }
            })
        )
      );

      await component.excluirConta('minha-senha');
      fixture.detectChanges();

      expect((dialog.querySelector('.modal__error') as HTMLElement).textContent).toContain(
        'Contas de administração não podem ser excluídas por aqui.'
      );
    });
  });

  describe('E-mails', () => {
    /**
     * O seletor é **escopado à seção**, e não um `.switch__input` solto.
     *
     * A spec 019 pôs um segundo interruptor na tela — o das redes sociais, no
     * bloco "Suas redes" —, e ele vem antes deste no DOM. Um seletor global
     * pegaria o switch errado e este teste passaria a falar sobre outra coisa,
     * dizendo "recebendo e-mails" a respeito de um campo de privacidade.
     */
    function interruptor(): HTMLInputElement {
      return fixture.nativeElement.querySelector(
        '[aria-labelledby="titulo-emails"] .switch__input'
      ) as HTMLInputElement;
    }

    /**
     * emailOptOut: true significa que a pessoa SAIU da lista, então o
     * interruptor tem de nascer DESLIGADO. Ligar é o que um booleano invertido
     * lido às pressas produz — e o efeito é mostrar "recebendo" para quem acabou
     * de descadastrar.
     */
    it('teste-trava: perfil com emailOptOut TRUE desenha o interruptor DESLIGADO', async () => {
      await montar({ ...PERFIL, emailOptOut: true });

      expect(interruptor().checked).toBeFalse();
    });

    it('perfil recebendo desenha o interruptor ligado', async () => {
      await montar({ ...PERFIL, emailOptOut: false });

      expect(interruptor().checked).toBeTrue();
    });

    it('o gesto salva sozinho, sem botao de salvar na secao', async () => {
      await montar();
      authService.setEmailPreference.and.returnValue(of(undefined));

      await component['alternarEmails']();
      fixture.detectChanges();

      expect(authService.setEmailPreference).toHaveBeenCalledWith(false);

      const secao = fixture.nativeElement.querySelector(
        'section[aria-labelledby="titulo-emails"]'
      ) as HTMLElement;
      expect(secao.querySelector('button')).toBeNull();
    });

    it('o salvamento e otimista: o estado muda antes da resposta', async () => {
      await montar();
      let resolver: (() => void) | undefined;
      authService.setEmailPreference.and.returnValue(
        new Observable<void>((subscriber) => {
          resolver = () => {
            subscriber.next();
            subscriber.complete();
          };
        })
      );

      const pendente = component['alternarEmails']();
      fixture.detectChanges();

      expect(interruptor().checked).toBeFalse();

      resolver?.();
      await pendente;
    });

    it('falha reverte o interruptor e mostra o erro', async () => {
      await montar();
      authService.setEmailPreference.and.returnValue(
        throwError(() => new Error('offline'))
      );

      await component['alternarEmails']();
      fixture.detectChanges();

      expect(interruptor().checked).toBeTrue();
      const erro = fixture.nativeElement.querySelector(
        'section[aria-labelledby="titulo-emails"] .form__error'
      ) as HTMLElement;
      expect(erro.getAttribute('role')).toBe('alert');
    });

    it('quem foi descadastrado por bounce religa aqui, e a tela nao explica por que', async () => {
      // A ausência é deliberada: "seu provedor recusou nossos e-mails" é uma
      // frase que não ajuda ninguém a fazer nada.
      await montar({ ...PERFIL, emailOptOut: true });

      const secao = (
        fixture.nativeElement.querySelector(
          'section[aria-labelledby="titulo-emails"]'
        ) as HTMLElement
      ).textContent?.toLowerCase() ?? '';

      expect(secao).not.toContain('bounce');
      expect(secao).not.toContain('recusou');
      expect(secao).not.toContain('reclamação');
    });

    it('a secao fica entre Acesso e Excluir conta', async () => {
      await montar();

      const titulos = Array.from(
        fixture.nativeElement.querySelectorAll('.block__title') as NodeListOf<HTMLElement>
      ).map((el) => el.textContent?.trim());

      // Contratos entra como quinta seção, e **Excluir conta continua sendo a
      // última, sozinha, no fim** (spec 018, decisão 11).
      expect(titulos).toEqual([
        'Seus dados',
        'Suas redes',
        'Acesso',
        'E-mails',
        'Contratos',
        'Excluir conta'
      ]);
    });
  });

  describe('acabamento', () => {
    /**
     * Sem `autocomplete` o gerenciador de senhas oferece a senha errada no campo
     * errado, e o de "senha atual" é o que mais dói: ele preenche a nova com a
     * antiga e a troca falha sem que a pessoa entenda por quê.
     */
    it('cada campo declara o autocomplete certo', async () => {
      await montar();

      const porNome = (nome: string) =>
        (
          fixture.nativeElement.querySelector(
            `input[formControlName="${nome}"]`
          ) as HTMLInputElement
        ).getAttribute('autocomplete');

      expect(porNome('name')).toBe('name');
      expect(porNome('phone')).toBe('tel');
      expect(porNome('linkedin')).toBe('url');

      component['abrirAcesso']('email');
      fixture.detectChanges();
      expect(porNome('newEmail')).toBe('email');
      expect(porNome('password')).toBe('current-password');

      component['abrirAcesso']('senha');
      fixture.detectChanges();
      expect(porNome('currentPassword')).toBe('current-password');
      expect(porNome('newPassword')).toBe('new-password');
      expect(porNome('confirmPassword')).toBe('new-password');
    });

    it('cada seção é um section com título alcançável', async () => {
      await montar();

      const secoes = Array.from(
        fixture.nativeElement.querySelectorAll('section.block') as NodeListOf<HTMLElement>
      );

      expect(secoes.length).toBe(6);
      secoes.forEach((secao) => {
        const id = secao.getAttribute('aria-labelledby');
        expect(id).not.toBeNull();
        expect(fixture.nativeElement.querySelector(`#${id}`)).not.toBeNull();
      });
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
    expect(fixture.nativeElement.querySelector('.btn--solid')).not.toBeNull();
  });

  describe('Redes visíveis (spec 019)', () => {
    function interruptor(): HTMLInputElement {
      return fixture.nativeElement.querySelector(
        '[aria-labelledby="titulo-redes"] .switch__input'
      ) as HTMLInputElement;
    }

    /**
     * **A trava desta fase.** O padrão do backend é `false`, e a tela precisa
     * abrir nessa posição — sem chute local, porque o único chute possível é
     * "ligado", e ele publica o vínculo de alguém que nunca foi perguntado.
     */
    it('teste-trava: perfil com socialLinksPublic FALSE abre DESLIGADO', async () => {
      await montar({ ...PERFIL, socialLinksPublic: false });

      expect(interruptor().checked).toBeFalse();
    });

    it('perfil com o interruptor ligado abre ligado', async () => {
      await montar({ ...PERFIL, socialLinksPublic: true });

      expect(interruptor().checked).toBeTrue();
    });

    it('o interruptor mora dentro do bloco "Suas redes"', async () => {
      // Decisão 6: encostado nos campos, e não numa aba de Privacidade que
      // ninguém abre — um interruptor desligado ali seria um recurso que não
      // existe.
      await montar();

      const bloco = fixture.nativeElement.querySelector(
        '[aria-labelledby="titulo-redes"]'
      ) as HTMLElement;

      expect(bloco.querySelector('.switch__input')).not.toBeNull();
      expect(bloco.textContent).toContain(
        'Mostrar minhas redes para os outros membros'
      );
    });

    /**
     * O rótulo diz o que o interruptor **não** faz. Chamar isto de "privado"
     * seria vender uma garantia que não existe.
     */
    it('a tela diz que a administração continua vendo os links', async () => {
      await montar();

      const bloco = fixture.nativeElement.querySelector(
        '[aria-labelledby="titulo-redes"]'
      ) as HTMLElement;

      expect(bloco.textContent).toContain('A administração da Liga Dev continua vendo');
      expect(bloco.textContent).not.toContain('privado');
    });

    it('o gesto salva sozinho, sem passar pelo botão de salvar redes', async () => {
      await montar({ ...PERFIL, socialLinksPublic: false });
      authService.setSocialLinksPublic.and.returnValue(of(undefined));

      await component['alternarRedesPublicas']();
      fixture.detectChanges();

      expect(authService.setSocialLinksPublic).toHaveBeenCalledWith(true);
      // E não é o formulário de redes: aquele continua sendo salvo por submit.
      expect(authService.updateProfile).not.toHaveBeenCalled();
    });

    it('falha reverte o interruptor e mostra o erro', async () => {
      await montar({ ...PERFIL, socialLinksPublic: false });
      authService.setSocialLinksPublic.and.returnValue(
        throwError(() => new Error('offline'))
      );

      await component['alternarRedesPublicas']();
      fixture.detectChanges();

      expect(interruptor().checked).toBeFalse();

      const bloco = fixture.nativeElement.querySelector(
        '[aria-labelledby="titulo-redes"]'
      ) as HTMLElement;
      expect(bloco.querySelector('.form__error')?.getAttribute('role')).toBe(
        'alert'
      );
    });
  });
});
