import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';
import { LegalStore } from '../../core/legal/legal.store';
import { MemberProfile } from '../../models/auth.model';
import { CompletarPerfilPage } from './completar-perfil.page';

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

function perfil(pendentes: typeof TERMOS[]): MemberProfile {
  return {
    id: 'p-1',
    email: 'leno@exemplo.com',
    name: 'Leno',
    phone: '47999991234',
    bio: 'Uma bio suficientemente longa.',
    grade: 1,
    linkedin: null,
    instagram: null,
    emailOptOut: false,
    profileCompleted: false,
    role: null,
    tier: 'dev-tier',
    pendingLegal: pendentes,
    xp: 0,
    socialLinksPublic: false,
    legalAcceptances: {}
  };
}

/**
 * O aceite legal no onboarding (spec 018, fase 04).
 *
 * Fica em arquivo próprio porque este é o único cenário da tela que precisa do
 * `HttpTestingController` de verdade — o resto da page roda com o `AuthService`
 * dublado.
 */
describe('CompletarPerfilPage · aceite legal', () => {
  let fixture: ComponentFixture<CompletarPerfilPage>;
  let component: CompletarPerfilPage;
  let httpMock: HttpTestingController;
  let authStore: AuthStore;

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

    authStore = TestBed.inject(AuthStore);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    (TestBed.inject(AuthService).logout as jasmine.Spy).and.returnValue(of(undefined));
  });

  afterEach(() => httpMock.verify());

  async function montar(pendentes: typeof TERMOS[]): Promise<void> {
    authStore.setProfile(perfil(pendentes));
    fixture = TestBed.createComponent(CompletarPerfilPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents`)
      .flush([TERMOS, PRIVACIDADE]);

    await fixture.whenStable();
    fixture.detectChanges();
  }

  function submitBtn(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector('.submit')!;
  }

  it('a lista de documentos vem da API, e não de uma constante da tela', async () => {
    await montar([TERMOS, PRIVACIDADE]);

    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Termos de Uso');
    expect(texto).toContain('Política de Privacidade');
  });

  /**
   * **A única combinação que interessa, e a que um refactor de validação apaga
   * sem perceber:** formulário inteiro válido, um documento pendente.
   */
  it('teste-trava: submit segue desabilitado com o formulário válido e um documento pendente', async () => {
    await montar([PRIVACIDADE]);

    component.form.setValue({
      name: 'Leno Borges',
      phone: '47999990000',
      bio: 'Uma bio suficientemente longa para passar na validação.'
    });
    fixture.detectChanges();

    expect(component.form.valid).toBeTrue();
    expect(submitBtn().disabled).toBeTrue();
  });

  it('com os dois aceitos, o submit libera', async () => {
    await montar([]);

    component.form.setValue({
      name: 'Leno Borges',
      phone: '47999990000',
      bio: 'Uma bio suficientemente longa para passar na validação.'
    });
    fixture.detectChanges();

    expect(submitBtn().disabled).toBeFalse();
  });

  /**
   * **O aceite é gravado no clique do modal, não no submit** (decisão 5): quem
   * aceitou e abandonou o formulário aceitou. Sem esta trava, a primeira
   * "simplificação" junta os dois aceites no corpo do PATCH e o aceite se perde
   * num F5.
   */
  it('teste-trava: aceitar grava na hora, antes de qualquer submit', async () => {
    await montar([TERMOS, PRIVACIDADE]);

    const botao = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.legal__btn')
    ).find((b) => b.textContent?.includes('Termos de Uso'))!;
    botao.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`)
      .flush(DOCUMENTO);
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLInputElement>('input[type="checkbox"]')!
      .click();
    fixture.detectChanges();

    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button')
    )
      .find((b) => b.textContent?.trim() === 'Aceitar')!
      .click();

    // A gravação acontece aqui, e não no submit do formulário.
    httpMock
      .expectOne(`${environment.apiUrl}/me/legal-acceptances`)
      .flush(null, { status: 204, statusText: 'No Content' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('aceito');
    // E o bloqueio do painel some junto: quem aceitou aqui não pode ver o modal
    // de alerta do dashboard um segundo depois, na navegação.
    expect(TestBed.inject(LegalStore).pending().map((d) => d.id)).not.toContain(
      'termos-de-uso'
    );
  });

  /**
   * **A trava do bug que só o navegador pegou.**
   *
   * O diálogo já viveu dentro de um `@if` e era aberto numa `queueMicrotask`.
   * Em zoneless a microtask roda ANTES de o Angular criar o componente, então a
   * referência era `undefined`, o `?.` engolia a chamada em silêncio, e o modal
   * aparecia sem nunca ter buscado o texto. Os testes antigos não pegavam
   * porque chamavam `open()` com o componente já montado, ou porque um
   * `whenStable` antes da asserção dava tempo de a ordem se acertar por acaso.
   *
   * Este não espera nada: um clique, um ciclo de detecção, e a requisição do
   * documento **precisa** já ter saído.
   */
  it('teste-trava: um clique basta para o documento ser buscado', async () => {
    await montar([TERMOS, PRIVACIDADE]);

    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.legal__btn')
    )
      .find((b) => b.textContent?.includes('Termos de Uso'))!
      .click();
    fixture.detectChanges();

    // Sem `whenStable` no meio: se a abertura depender de uma microtask e de um
    // ciclo de renderização a mais, não há requisição aqui e o expectOne falha.
    httpMock
      .expectOne(`${environment.apiUrl}/legal/documents/termos-de-uso`)
      .flush(DOCUMENTO);

    await fixture.whenStable();
    fixture.detectChanges();

    // O texto na tela e a prova de que a busca saiu e chegou: com o bug, o
    // modal ficava parado no "Carregando o documento...".
    const dialogo = (fixture.nativeElement as HTMLElement).querySelector('app-legal-accept-dialog dialog')!;
    expect(dialogo.textContent).toContain('Ao criar uma conta');
    expect(dialogo.textContent).not.toContain('Carregando o documento');
  });

  /**
   * Um `<dialog>` fechado é `display: none` por padrão do navegador. Um
   * `display` solto no seletor base sobrescreve esse padrão e desenha o diálogo
   * no meio da página como se fosse um cartão — foi o segundo defeito da mesma
   * tela, e ele não aparece em nenhum teste que só olhe o DOM.
   */
  it('teste-trava: o diálogo fechado não aparece na página', async () => {
    await montar([TERMOS, PRIVACIDADE]);

    const dialogo = (fixture.nativeElement as HTMLElement).querySelector('app-legal-accept-dialog dialog')!;
    expect(dialogo.hasAttribute('open')).toBeFalse();
    expect(getComputedStyle(dialogo).display).toBe('none');
  });
});
