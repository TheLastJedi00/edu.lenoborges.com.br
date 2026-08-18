import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { AdminUsuariosPage } from './usuarios.page';
import { AdminUser } from '../../../models/admin.model';

function user(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 'uid-1',
    email: 'membro@test.com',
    emailVerified: true,
    disabled: false,
    role: null,
    createdAt: '2026-08-18T09:00:00.000Z',
    lastSignInAt: '2026-08-18T10:00:00.000Z',
    name: 'Membro Teste',
    phone: '47999990000',
    grade: 3,
    tier: 'dev-tier',
    profileCompleted: true,
    ...overrides
  };
}

describe('AdminUsuariosPage', () => {
  let http: HttpTestingController;

  function setup() {
    TestBed.configureTestingModule({
      imports: [AdminUsuariosPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminUsuariosPage);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function flushList(users: AdminUser[], nextPageToken: string | null = null) {
    http
      .expectOne((req) => req.url.endsWith('/admin/users'))
      .flush({ users, nextPageToken });
  }

  it('lista os usuários com a etapa em palavra', () => {
    const { fixture, el } = setup();
    flushList([user()]);
    fixture.detectChanges();

    expect(el.textContent).toContain('Membro Teste');
    expect(el.textContent).toContain('Insígnia 3 / 8');
  });

  /**
   * **O teste que sustenta a decisão 10 do backend na tela.**
   *
   * Quem criou conta e parou antes do onboarding não tem perfil. A linha não
   * pode sumir nem parecer um registro quebrado: ela ganha um selo que diz o que
   * está acontecendo.
   */
  it('mostra quem não concluiu o onboarding, com selo próprio', () => {
    const { fixture, el } = setup();
    flushList([
      user({
        id: 'uid-sem-perfil',
        name: null,
        grade: null,
        profileCompleted: false
      })
    ]);
    fixture.detectChanges();

    expect(el.querySelectorAll('.user').length).toBe(1);
    expect(el.textContent).toContain('Onboarding pendente');
  });

  it('carrega mais páginas pelo pageToken, sem paginador numerado', () => {
    // O token do Firebase Auth é opaco e não diz quantas páginas existem, então
    // não há total para numerar.
    const { fixture, el } = setup();
    flushList([user()], 'proxima');
    fixture.detectChanges();

    const botao = Array.from(el.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Carregar mais')
    );
    expect(botao).toBeDefined();

    botao?.click();
    const segunda = http.expectOne((req) => req.url.endsWith('/admin/users'));
    expect(segunda.request.params.get('pageToken')).toBe('proxima');
    segunda.flush({ users: [user({ id: 'uid-2' })], nextPageToken: null });
    fixture.detectChanges();

    expect(el.querySelectorAll('.user').length).toBe(2);
  });

  function abrirEditor(el: HTMLElement, fixture: { detectChanges(): void }) {
    (el.querySelector('.user .btn--ghost') as HTMLButtonElement).click();
    fixture.detectChanges();
  }

  function clicar(el: HTMLElement, texto: string) {
    const botao = Array.from(el.querySelectorAll('.editor button')).find((node) =>
      node.textContent?.includes(texto)
    ) as HTMLButtonElement;
    botao.click();
  }

  /**
   * **O teste que sustenta a separação entre acesso e conquista.**
   *
   * Cada campo tem o seu botão e a sua requisição. Um PATCH com os dois faria
   * uma edição de acesso escrever o progresso junto — e é assim que alguém que
   * acabou de pagar perde a trilha inteira.
   */
  it('salva o grade sem mandar tier junto', () => {
    const { fixture, el } = setup();
    flushList([user()]);
    fixture.detectChanges();
    abrirEditor(el, fixture);

    clicar(el, 'Salvar a etapa');

    const request = http.expectOne((req) =>
      req.url.endsWith('/admin/users/uid-1')
    );
    expect(request.request.body).toEqual({ grade: 3 });
    request.flush(null);
  });

  it('salva o tier sem mandar grade junto', () => {
    const { fixture, el } = setup();
    flushList([user()]);
    fixture.detectChanges();
    abrirEditor(el, fixture);

    clicar(el, 'Salvar o acesso');

    const request = http.expectOne((req) =>
      req.url.endsWith('/admin/users/uid-1')
    );
    expect(request.request.body).toEqual({ tier: 'dev-tier' });
    request.flush(null);
  });

  it('separa acesso e conquista visivelmente', () => {
    // Encostados sem explicação, os dois viram a mesma coisa na cabeça de quem
    // clica — e a spec 008 inteira depende de não virarem.
    const { fixture, el } = setup();
    flushList([user()]);
    fixture.detectChanges();
    abrirEditor(el, fixture);

    const legendas = Array.from(el.querySelectorAll('.editor__legend')).map(
      (node) => node.textContent?.trim()
    );
    expect(legendas).toEqual(['Conquista', 'Acesso']);
  });

  /**
   * A claim de admin só vale no próximo ID token, e o atual dura até uma hora.
   * Sem esta explicação, quem acabou de ser promovido lê "acesso negado" e abre
   * um chamado — quando a resposta é sair e entrar de novo.
   */
  it('explica o 403 pela claim que ainda não valeu', () => {
    const { fixture, el } = setup();
    http
      .expectOne((req) => req.url.endsWith('/admin/users'))
      .flush('', { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(el.textContent).toContain('saia e entre de novo');
  });
});
