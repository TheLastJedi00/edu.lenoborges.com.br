import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { MemberProfile } from '../../models/auth.model';
import { PerfilPage } from './perfil.page';

const TERMOS = { id: 'termos-de-uso', title: 'Termos de Uso', version: '2026-08-27' };
const PRIVACIDADE = {
  id: 'politica-de-privacidade',
  title: 'Política de Privacidade',
  version: '2026-08-27'
};

const DOCUMENTO = {
  ...TERMOS,
  updatedAt: '2026-08-27',
  sections: [{ heading: '1. Aceitação', paragraphs: ['Ao criar uma conta...'] }]
};

function perfil(
  legalAcceptances: MemberProfile['legalAcceptances']
): MemberProfile {
  return {
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
    legalAcceptances
  };
}

/** A seção Contratos (spec 018, fase 06). */
describe('PerfilPage · Contratos', () => {
  let fixture: ComponentFixture<PerfilPage>;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('AuthService', [
      'getMe',
      'updateProfile',
      'changeEmail',
      'changePassword',
      'deleteAccount',
      'setEmailPreference'
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
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  afterEach(() => httpMock.verify());

  async function montar(aceites: MemberProfile['legalAcceptances']): Promise<void> {
    authService.getMe.and.returnValue(of(perfil(aceites)));
    fixture = TestBed.createComponent(PerfilPage);
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents`)
      .flush([TERMOS, PRIVACIDADE]);

    await fixture.whenStable();
    fixture.detectChanges();
  }

  function linhas(): string[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.contratos > li')
    ).map((el) => (el.textContent ?? '').replace(/\s+/g, ' ').trim());
  }

  it('mostra a versão e a data do aceite, em pt-BR', async () => {
    await montar({
      'termos-de-uso': { version: '2026-08-27', acceptedAt: '2026-03-12T14:02:00.000Z' },
      'politica-de-privacidade': {
        version: '2026-08-27',
        acceptedAt: '2026-03-12T14:03:00.000Z'
      }
    });

    expect(linhas()[0]).toContain('Termos de Uso');
    expect(linhas()[0]).toContain('Versão de 27/08/2026');
    expect(linhas()[0]).toContain('Aceita em 12/03/2026');
  });

  /**
   * O estado de quem tem pendência aberta e navegou até aqui — improvável com o
   * bloqueio de pé, e é exatamente por isso que ninguém veria a célula em branco
   * antes de um usuário ver.
   */
  it('documento sem aceite registrado mostra "não aceita", e não célula vazia', async () => {
    await montar({});

    expect(linhas()[0]).toContain('Não aceita');
  });

  /**
   * **Aceite de versão antiga não conta como aceite desta versão.** Mostrar a
   * data velha diria que está tudo em ordem enquanto o bloqueio sobe na próxima
   * navegação.
   */
  it('teste-trava: aceite de versão antiga aparece como não aceita', async () => {
    await montar({
      'termos-de-uso': { version: '2026-01-01', acceptedAt: '2026-01-02T10:00:00.000Z' }
    });

    expect(linhas()[0]).toContain('Não aceita');
    expect(linhas()[0]).not.toContain('02/01/2026');
  });

  /**
   * Abrir sem `readonly` daria um check de aceite numa tela de consulta.
   */
  it('teste-trava: o botão abre o documento em modo leitura', async () => {
    await montar({
      'termos-de-uso': { version: '2026-08-27', acceptedAt: '2026-03-12T14:02:00.000Z' },
      'politica-de-privacidade': {
        version: '2026-08-27',
        acceptedAt: '2026-03-12T14:03:00.000Z'
      }
    });

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.contratos > li .btn')!
      .click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`)
      .flush(DOCUMENTO);
    await fixture.whenStable();
    fixture.detectChanges();

    const dialogo = (fixture.nativeElement as HTMLElement).querySelector('app-legal-accept-dialog dialog')!;
    expect(dialogo.textContent).toContain('Ao criar uma conta');
    expect(dialogo.querySelector('input[type="checkbox"]')).toBeNull();
  });
});
