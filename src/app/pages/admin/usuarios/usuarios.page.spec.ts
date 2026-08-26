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
    grade: 3,
    tier: 'dev-tier',
    profileCompleted: true,
    emailOptOut: false,
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

  function flushList(users: AdminUser[], total = users.length) {
    http
      .expectOne((req) => req.url.endsWith('/admin/users'))
      .flush({ users, total, offset: 0, limit: 50 });
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

  /**
   * **Teste-trava: carregar a segunda página não duplica linhas.**
   *
   * É o erro clássico ao trocar cursor por deslocamento — o `offset` sai de um
   * contador próprio em vez do tamanho do que já está na tela, os dois
   * divergem, e a segunda página repete metade da primeira. Ele só aparece com
   * mais de uma página, que é justamente o caso que ninguém testa à mão.
   */
  it('teste-trava: a segunda página vem por offset, e não duplica linhas', () => {
    const { fixture, el } = setup();
    flushList([user({ id: 'uid-1' })], 2);
    fixture.detectChanges();

    const botao = Array.from(el.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Carregar mais')
    );
    // E o botao sabe quantos faltam, coisa que o pageToken opaco nunca soube.
    expect(botao?.textContent).toContain('1 restantes');

    botao?.click();
    const segunda = http.expectOne((req) => req.url.endsWith('/admin/users'));
    expect(segunda.request.params.get('offset')).toBe('1');
    segunda.flush({
      users: [user({ id: 'uid-2' })],
      total: 2,
      offset: 1,
      limit: 50
    });
    fixture.detectChanges();

    expect(el.querySelectorAll('.user').length).toBe(2);
  });

  it('sem nada a carregar, o botão não aparece', () => {
    const { fixture, el } = setup();
    flushList([user()], 1);
    fixture.detectChanges();

    const botao = Array.from(el.querySelectorAll('button')).find((node) =>
      node.textContent?.includes('Carregar mais')
    );
    expect(botao).toBeUndefined();
  });

  /**
   * A spec 010 fez o PATCH aceitar `tier` e a API nunca devolveu o campo: o
   * seletor abria vazio, e o admin escolhia às cegas. Este teste existe para o
   * conserto ser **verificado**, e não presumido.
   */
  it('teste-trava: o seletor de tier abre no valor do membro', async () => {
    const { fixture, el } = setup();
    flushList([user({ tier: 'ultra-dev-tier' })]);
    fixture.detectChanges();
    abrirEditor(el, fixture);

    // `ngModel` escreve o valor inicial num microtask, entao a leitura do DOM
    // precisa esperar a estabilizacao — sem isto o teste le '' e acusa um
    // defeito que nao existe.
    await fixture.whenStable();
    fixture.detectChanges();

    const seletor = el.querySelector('#tier') as HTMLSelectElement;
    expect(seletor.value).toBe('ultra-dev-tier');
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
   * Sem este selo, "não chegou o e-mail para o fulano" é investigação sem
   * pista: nada mais na Administração diz que a pessoa saiu da lista.
   */
  it('quem nao recebe e-mails ganha um selo na linha', () => {
    const { fixture, el } = setup();
    flushList([user({ emailOptOut: true })]);
    fixture.detectChanges();

    expect(el.textContent).toContain('Não recebe e-mails');
  });

  it('quem recebe nao ganha selo nenhum', () => {
    const { fixture, el } = setup();
    flushList([user({ emailOptOut: false })]);
    fixture.detectChanges();

    expect(el.textContent).not.toContain('Não recebe e-mails');
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
