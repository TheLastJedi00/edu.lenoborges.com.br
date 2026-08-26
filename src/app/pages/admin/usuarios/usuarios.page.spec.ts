import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import {
  AdminUsuariosPage,
  USUARIOS_BUSCA_DEBOUNCE_MS
} from './usuarios.page';
import { AdminUser, AdminUserDetail } from '../../../models/admin.model';

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

/** O atraso real é 400ms; aqui ele é curto porque não há `fakeAsync` zoneless. */
const DEBOUNCE = 5;

describe('AdminUsuariosPage', () => {
  let http: HttpTestingController;

  /**
   * `query` simula a rota já aberta com um recorte colado — que é o caso que a
   * decisão 2 existe para atender: F5, "voltar", e o link mandado num chat.
   */
  function setup(query: Record<string, string | string[]> = {}) {
    TestBed.configureTestingModule({
      imports: [AdminUsuariosPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: USUARIOS_BUSCA_DEBOUNCE_MS, useValue: DEBOUNCE },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(query) }
          }
        }
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(AdminUsuariosPage);
    fixture.detectChanges();

    return { fixture, router, el: fixture.nativeElement as HTMLElement };
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

  /** O que `GET /admin/users/:id` devolve. */
  function detalhe(overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
    return {
      ...user(),
      phone: '47999990000',
      bio: 'Estudando back-end.',
      linkedin: null,
      instagram: null,
      emailOptOutReason: null,
      emailOptOutAt: null,
      waitlistEntryId: 'membro@test.com',
      profileCreatedAt: '2026-08-18T09:02:00.000Z',
      profileUpdatedAt: '2026-08-24T11:00:00.000Z',
      canReceiveEmail: true,
      cannotReceiveReason: null,
      ...overrides
    };
  }

  /**
   * Abre o membro. O detalhe dispara `GET /admin/users/:id`, e quem chama
   * decide o que responder — inclusive não responder, para inspecionar o
   * esqueleto.
   */
  function abrirEditor(
    el: HTMLElement,
    fixture: { detectChanges(): void },
    resposta: AdminUserDetail | null = detalhe()
  ) {
    (el.querySelector('.user .btn--ghost') as HTMLButtonElement).click();
    fixture.detectChanges();

    if (resposta) {
      http
        .expectOne((r) => /\/admin\/users\/[^/]+$/.test(r.url))
        .flush(resposta);
      fixture.detectChanges();
    }
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

  describe('o detalhe do membro', () => {
    /**
     * **Teste-trava: o diálogo não abre vazio.**
     *
     * Enquanto a requisição do detalhe não volta, ele mostra o que a linha já
     * sabia — nome, e-mail, tier, etapa. Abrir vazio e preencher depois faz o
     * clique parecer que falhou.
     */
    it('teste-trava: abre com o que a linha ja sabia, e o resto em esqueleto', () => {
      const { fixture, el } = setup();
      flushList([user({ name: 'Membro Teste' })]);
      fixture.detectChanges();

      // Sem responder ao detalhe: e o instante em que o dialogo ja esta aberto.
      abrirEditor(el, fixture, null);

      const dialogo = el.querySelector('.editor') as HTMLElement;
      expect(dialogo.textContent).toContain('Membro Teste');
      expect(dialogo.textContent).toContain('membro@test.com');
      expect(dialogo.querySelectorAll('.skeleton--linha').length).toBeGreaterThan(0);

      http
        .expectOne((r) => /\/admin\/users\/[^/]+$/.test(r.url))
        .flush(detalhe());
    });

    it('busca o detalhe ao abrir, e mostra o que so ele conhece', () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();
      abrirEditor(el, fixture);

      const dialogo = el.querySelector('.editor') as HTMLElement;
      // O telefone nao trafega na listagem: ele so existe aqui.
      expect(dialogo.textContent).toContain('47999990000');
      expect(dialogo.textContent).toContain('Estudando back-end.');
    });

    /**
     * **Teste-trava: a falha não fecha o diálogo.**
     *
     * Fechar sozinho é indistinguível de o clique não ter pego, e o admin clica
     * de novo — e de novo.
     */
    it('teste-trava: falha no detalhe mostra o erro DENTRO do dialogo, sem fechar', () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();
      abrirEditor(el, fixture, null);

      http
        .expectOne((r) => /\/admin\/users\/[^/]+$/.test(r.url))
        .flush('', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      const dialogo = el.querySelector('.editor');
      expect(dialogo).not.toBeNull();
      expect(dialogo?.textContent).toContain('Tentar de novo');
    });

    it('"Tentar de novo" refaz a requisicao do detalhe', () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();
      abrirEditor(el, fixture, null);
      http
        .expectOne((r) => /\/admin\/users\/[^/]+$/.test(r.url))
        .flush('', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      const botao = Array.from(el.querySelectorAll('.editor button')).find((n) =>
        n.textContent?.includes('Tentar de novo')
      ) as HTMLButtonElement;
      botao.click();
      fixture.detectChanges();

      http
        .expectOne((r) => /\/admin\/users\/[^/]+$/.test(r.url))
        .flush(detalhe());
      fixture.detectChanges();

      expect(el.querySelector('.editor')?.textContent).toContain('47999990000');
    });

    /**
     * **O oposto do que Meu Perfil faz, e de propósito** (decisão 11). Lá quem
     * lê não pode agir sobre um bounce; aqui pode.
     */
    it('diz que nao recebe e-mails E diz por que, com a data', () => {
      const { fixture, el } = setup();
      flushList([user({ emailOptOut: true })]);
      fixture.detectChanges();
      abrirEditor(
        el,
        fixture,
        detalhe({
          emailOptOut: true,
          emailOptOutReason: 'bounce',
          emailOptOutAt: '2026-08-20T12:00:00.000Z',
          canReceiveEmail: false,
          cannotReceiveReason: 'descadastrado'
        })
      );

      const dialogo = el.querySelector('.editor') as HTMLElement;
      expect(dialogo.textContent).toContain('Não recebe e-mails');
      expect(dialogo.textContent).toContain('o provedor recusou o endereço');
      expect(dialogo.textContent).toContain('20/08/2026');
    });

    it('quem recebe ve a frase inteira, e nao um estado mudo', () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();
      abrirEditor(el, fixture);

      expect(el.querySelector('.editor')?.textContent).toContain(
        'Recebe os e-mails da Liga Dev'
      );
    });

    /**
     * A ausência é deliberada: é o lugar onde os três parecem caber, e os três
     * foram recusados com argumento em specs anteriores.
     */
    it('nao oferece desativar, excluir nem promover', () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();
      abrirEditor(el, fixture);

      const textos = Array.from(el.querySelectorAll('.editor button')).map((n) =>
        n.textContent?.toLowerCase() ?? ''
      );
      expect(textos.some((t) => t.includes('excluir'))).toBeFalse();
      expect(textos.some((t) => t.includes('desativar'))).toBeFalse();
      expect(textos.some((t) => t.includes('promover'))).toBeFalse();
    });

    it('o membro sem perfil abre normalmente, com os campos vazios', () => {
      // Um dialogo que falhasse aqui esconderia justamente quem o filtro de
      // onboarding pendente existe para achar.
      const { fixture, el } = setup();
      flushList([user({ name: null, grade: null, profileCompleted: false })]);
      fixture.detectChanges();
      abrirEditor(
        el,
        fixture,
        detalhe({ name: null, phone: null, bio: null, tier: null })
      );

      const dialogo = el.querySelector('.editor') as HTMLElement;
      expect(dialogo.textContent).toContain('Não informado');
      expect(dialogo.textContent).toContain('Onboarding pendente');
    });
  });

  describe('o e-mail direto', () => {
    /** Abre o detalhe e o diálogo de escrever, com assunto e corpo válidos. */
    async function escrever(
      el: HTMLElement,
      fixture: { detectChanges(): void; whenStable(): Promise<unknown> },
      detalheDoMembro = detalhe()
    ) {
      abrirEditor(el, fixture, detalheDoMembro);

      const abrir = Array.from(el.querySelectorAll('.editor button')).find((n) =>
        n.textContent?.includes('Escrever e-mail')
      ) as HTMLButtonElement;
      abrir.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const assunto = el.querySelector('#assunto') as HTMLInputElement;
      const corpo = el.querySelector('#corpo') as HTMLTextAreaElement;
      assunto.value = 'Sobre a sua dúvida';
      assunto.dispatchEvent(new Event('input'));
      corpo.value = 'Oi. Vi sua pergunta no Mural e queria responder.';
      corpo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const enviar = Array.from(el.querySelectorAll('.editor button')).find((n) =>
        n.textContent?.includes('Enviar para')
      ) as HTMLButtonElement;

      return { enviar };
    }

    /**
     * **O botão diz o endereço, e nunca só "Enviar"** (decisão 14). É o eco do
     * "botão diz o número" da spec 014: a informação que decide o clique fica
     * dentro do botão.
     */
    it('teste-trava: o botao diz o endereco, e nao ha confirm-dialog por cima', async () => {
      const { fixture, el } = setup();
      flushList([user({ email: 'membro@test.com' })]);
      fixture.detectChanges();

      const { enviar } = await escrever(el, fixture);
      expect(enviar.textContent).toContain('Enviar para membro@test.com');

      enviar.click();
      fixture.detectChanges();

      // Envia direto: nenhum dialogo de confirmacao no meio do caminho.
      const req = http.expectOne((r) =>
        r.url.endsWith('/admin/users/uid-1/email')
      );
      expect(req.request.body).toEqual({
        subject: 'Sobre a sua dúvida',
        body: 'Oi. Vi sua pergunta no Mural e queria responder.'
      });
      req.flush({ id: 'camp-1', status: 'concluida', sentCount: 1 });
    });

    /**
     * **Teste-trava: um clique duplo não manda dois e-mails.**
     *
     * É a única ação irreversível desta tela, e a proteção é do front: o backend
     * não tem como saber que os dois pedidos são o mesmo recado.
     */
    it('teste-trava: clique duplo nao manda dois e-mails', async () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();

      const { enviar } = await escrever(el, fixture);
      enviar.click();
      enviar.click();
      fixture.detectChanges();

      const pedidos = http.match((r) =>
        r.url.endsWith('/admin/users/uid-1/email')
      );
      expect(pedidos.length).toBe(1);
      pedidos[0].flush({ id: 'camp-1', status: 'concluida', sentCount: 1 });
    });

    it('enquanto envia, o botao diz "Enviando…" e os campos ficam desabilitados', async () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();

      const { enviar } = await escrever(el, fixture);
      enviar.click();
      fixture.detectChanges();

      expect(enviar.textContent).toContain('Enviando…');

      // `ngModel` e quem recebe o `[disabled]` e desabilita o controle num
      // microtask, entao a leitura do DOM espera a estabilizacao.
      await fixture.whenStable();
      fixture.detectChanges();
      expect((el.querySelector('#assunto') as HTMLInputElement).disabled).toBeTrue();

      http
        .expectOne((r) => r.url.endsWith('/admin/users/uid-1/email'))
        .flush({ id: 'camp-1', status: 'concluida', sentCount: 1 });
      fixture.detectChanges();

      // Ao terminar, o dialogo fecha e o detalhe avisa.
      expect(el.querySelector('#assunto')).toBeNull();
      expect(el.textContent).toContain('E-mail enviado');
    });

    /**
     * **Teste-trava: membro descadastrado não consegue abrir o diálogo.**
     *
     * Deixar o botão ligado faria o admin escrever um recado inteiro para
     * descobrir no fim que ele não sai — e a informação que faltava estava na
     * tela o tempo todo.
     */
    it('teste-trava: quem nao pode receber nasce com o botao desabilitado, e o motivo ao lado', () => {
      const { fixture, el } = setup();
      flushList([user({ emailOptOut: true })]);
      fixture.detectChanges();
      abrirEditor(
        el,
        fixture,
        detalhe({
          emailOptOut: true,
          emailOptOutReason: 'membro',
          canReceiveEmail: false,
          cannotReceiveReason: 'descadastrado'
        })
      );

      const botao = Array.from(el.querySelectorAll('.editor button')).find((n) =>
        n.textContent?.includes('Escrever e-mail')
      ) as HTMLButtonElement;

      expect(botao.disabled).toBeTrue();
      expect(el.querySelector('.escrever__motivo')?.textContent).toContain(
        'Esse membro pediu para não receber e-mails.'
      );

      botao.click();
      fixture.detectChanges();
      expect(el.querySelector('#assunto')).toBeNull();
    });

    it('cada motivo tem a sua frase, e elas vem da tabela da spec', () => {
      const casos = [
        ['email-nao-verificado', 'O e-mail dele ainda não foi confirmado.'],
        ['desativado', 'A conta está desativada.']
      ] as const;

      for (const [reason, frase] of casos) {
        const { fixture, el } = setup();
        flushList([user()]);
        fixture.detectChanges();
        abrirEditor(
          el,
          fixture,
          detalhe({ canReceiveEmail: false, cannotReceiveReason: reason })
        );

        expect(el.querySelector('.escrever__motivo')?.textContent).toContain(frase);
        TestBed.resetTestingModule();
      }
    });

    /**
     * **Teste-trava: o texto do 422 sai do `reason`, e nunca da mensagem.**
     *
     * Texto de erro do backend não é contrato, e um `includes('descadastr')`
     * quebra na primeira revisão de copy de lá.
     */
    it('teste-trava: 422 com reason descadastrado mostra a frase da tabela', async () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();

      const { enviar } = await escrever(el, fixture);
      enviar.click();
      fixture.detectChanges();

      http.expectOne((r) => r.url.endsWith('/admin/users/uid-1/email')).flush(
        // A mensagem do corpo vem em outra redacao de proposito: a tela nao pode
        // depender dela.
        { statusCode: 422, reason: 'descadastrado', message: 'outra redacao' },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
      fixture.detectChanges();

      expect(el.querySelector('.editor__error')?.textContent).toContain(
        'Esse membro pediu para não receber e-mails.'
      );
    });

    /**
     * O trinco da spec 014 aparecendo numa tela que não fala de campanha. Sem
     * este texto ele é indistinguível de falha.
     */
    it('teste-trava: 409 vira "Tem um disparo acontecendo agora"', async () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();

      const { enviar } = await escrever(el, fixture);
      enviar.click();
      fixture.detectChanges();

      http
        .expectOne((r) => r.url.endsWith('/admin/users/uid-1/email'))
        .flush('', { status: 409, statusText: 'Conflict' });
      fixture.detectChanges();

      expect(el.querySelector('.editor__error')?.textContent).toContain(
        'Tem um disparo acontecendo agora'
      );
      // E o dialogo continua aberto, com o texto escrito: o recado nao se perde.
      expect(el.querySelector('#corpo')).not.toBeNull();
    });

    it('nao oferece previa, filtro nem botao de acao no e-mail', async () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();
      await escrever(el, fixture);

      // A tela de campanha e outra, e o motivo esta na decisao 12.
      expect(el.querySelector('#ctaLabel')).toBeNull();
      expect(el.querySelector('#ctaUrl')).toBeNull();
      expect(el.textContent).not.toContain('Prévia');
      expect(el.textContent).not.toContain('Enviar teste');
    });
  });

  describe('buscar e filtrar', () => {
    function digitar(el: HTMLElement, texto: string) {
      const campo = el.querySelector('#busca') as HTMLInputElement;
      campo.value = texto;
      campo.dispatchEvent(new Event('input'));
    }

    /** O debounce é encurtado nos testes: a app é zoneless e não há fakeAsync. */
    const esperarDebounce = () => new Promise((r) => setTimeout(r, DEBOUNCE + 10));

    /**
     * **Teste-trava: duas teclas rápidas fazem UMA requisição.**
     *
     * Cada requisição varre a base inteira no backend. Sem o atraso, "borges"
     * são seis varreduras — e o atraso é a única contenção que existe.
     */
    it('teste-trava: duas teclas rapidas fazem uma requisicao so', async () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();

      digitar(el, 'bor');
      digitar(el, 'borges');
      await esperarDebounce();

      const pedidos = http.match((req) => req.url.endsWith('/admin/users'));
      expect(pedidos.length).toBe(1);
      expect(pedidos[0].request.params.get('q')).toBe('borges');
      pedidos[0].flush({ users: [], total: 0, offset: 0, limit: 50 });
    });

    /**
     * **Teste-trava: resposta antiga não vence a nova.**
     *
     * Duas respostas fora de ordem deixariam na tela o resultado de uma busca
     * que o admin já abandonou — e ele não tem como saber que a lista não
     * corresponde ao que está escrito no campo. O `switchMap` cancela a
     * anterior; um `mergeMap` deixaria as duas chegarem.
     */
    it('teste-trava: a resposta antiga nao vence a nova', async () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();

      digitar(el, 'maria');
      await esperarDebounce();
      const primeira = http.expectOne((r) => r.url.endsWith('/admin/users'));

      digitar(el, 'jose');
      await esperarDebounce();
      const segunda = http.expectOne((r) => r.url.endsWith('/admin/users'));

      // A nova responde primeiro, e a antiga chega depois: com switchMap ela ja
      // foi cancelada e nao tem como sobrescrever a tela.
      segunda.flush({
        users: [user({ id: 'uid-jose', name: 'José da Silva' })],
        total: 1,
        offset: 0,
        limit: 50
      });
      expect(primeira.cancelled).toBeTrue();
      fixture.detectChanges();

      expect(el.textContent).toContain('José da Silva');
      expect(el.textContent).not.toContain('Maria');
    });

    it('manda o recorte inteiro para a API', async () => {
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();

      (el.querySelector('.filtros__grupo input') as HTMLInputElement).click();
      await esperarDebounce();

      const req = http.expectOne((r) => r.url.endsWith('/admin/users'));
      expect(req.request.params.get('onboarding')).toBe('pendente');
      req.flush({ users: [], total: 0, offset: 0, limit: 50 });
    });

    /**
     * **Teste-trava: a busca escreve na URL com `replaceUrl`.**
     *
     * Sem isso, cada tecla vira uma entrada no histórico e o botão "voltar"
     * caminha letra por letra até a tela ficar irrecuperável. É o defeito
     * clássico de filtro na URL, e ele só aparece depois de a tela estar pronta.
     */
    it('teste-trava: a busca escreve na URL com replaceUrl, e o filtro nao', async () => {
      const { fixture, el, router } = setup();
      flushList([user()]);
      fixture.detectChanges();
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);

      digitar(el, 'borges');
      expect(navigate.calls.mostRecent().args[1]).toEqual(
        jasmine.objectContaining({ replaceUrl: true })
      );

      (el.querySelector('.filtros__grupo input') as HTMLInputElement).click();
      // Clicar num filtro e um gesto deliberado: "voltar" tem que desfazer o
      // ultimo filtro, e nao caminhar por letras digitadas.
      expect(navigate.calls.mostRecent().args[1]).toEqual(
        jasmine.objectContaining({ replaceUrl: false })
      );

      await esperarDebounce();
      http
        .match((r) => r.url.endsWith('/admin/users'))
        .forEach((r) => r.flush({ users: [], total: 0, offset: 0, limit: 50 }));
    });

    /**
     * O recorte da URL é aplicado **antes** da primeira requisição, e não
     * depois: uma busca com o filtro chegando em seguida seria duas varreduras
     * da base e uma lista que pisca com o recorte errado.
     */
    it('teste-trava: abrir a rota com query ja aplica o recorte na PRIMEIRA requisicao', () => {
      const { fixture } = setup({ q: 'borges', tiers: ['ultra-dev-tier'] });

      const req = http.expectOne((r) => r.url.endsWith('/admin/users'));
      expect(req.request.params.get('q')).toBe('borges');
      expect(req.request.params.getAll('tiers')).toEqual(['ultra-dev-tier']);
      req.flush({ users: [], total: 0, offset: 0, limit: 50 });
      fixture.detectChanges();
    });

    it('sem filtro, a contagem e so o numero de membros e o rotulo diz "Todos os membros"', () => {
      const { fixture, el } = setup();
      flushList([user()], 213);
      fixture.detectChanges();

      expect(el.querySelector('.recorte__contagem')?.textContent).toContain(
        '213 membros'
      );
      expect(el.textContent).toContain('Todos os membros');
    });

    /**
     * **Teste-trava: com filtro ligado, o texto não é só o número.**
     *
     * Um número solto é lido como o tamanho da comunidade — e com um recorte
     * aplicado ele não é.
     */
    it('teste-trava: com filtro, a contagem e "12 de 213 membros"', () => {
      const { fixture, el } = setup({ q: 'silva' });
      http
        .expectOne((r) => r.url.endsWith('/admin/users'))
        .flush({
          users: Array.from({ length: 12 }, (_, i) => user({ id: `uid-${i}` })),
          total: 213,
          offset: 0,
          limit: 50
        });
      fixture.detectChanges();

      const contagem = el.querySelector('.recorte__contagem')?.textContent ?? '';
      expect(contagem).toContain('12 de 213 membros');
      expect(el.textContent).not.toContain('Todos os membros');
    });

    /**
     * Os dois vazios parecem o mesmo estado e são opostos: um significa "ajuste
     * o filtro", o outro significa "não há nada". A tela de antes só tinha o
     * segundo.
     */
    it('recorte sem resultado oferece limpar os filtros', () => {
      const { fixture, el } = setup({ q: 'ninguem' });
      http
        .expectOne((r) => r.url.endsWith('/admin/users'))
        .flush({ users: [], total: 0, offset: 0, limit: 50 });
      fixture.detectChanges();

      expect(el.textContent).toContain('Nenhum membro com esse recorte');
      expect(el.textContent).toContain('Limpar filtros');
    });

    it('base sem ninguem diz que ainda nao ha cadastros, e nao oferece limpar nada', () => {
      const { fixture, el } = setup();
      flushList([], 0);
      fixture.detectChanges();

      expect(el.textContent).toContain('Ninguém se cadastrou ainda');
      expect(el.textContent).not.toContain('Nenhum membro com esse recorte');
    });

    it('o campo de busca fica FORA do bloco de filtros', () => {
      // Ele resolve a maior parte dos casos e nao pode custar um toque a mais no
      // celular (decisao 16).
      const { fixture, el } = setup();
      flushList([user()]);
      fixture.detectChanges();

      expect(el.querySelector('#busca')).toBeTruthy();
      expect(el.querySelector('.filtros #busca')).toBeNull();
    });

    it('o bloco de filtros conta quantos estao ativos', () => {
      const { fixture, el } = setup({ onboarding: 'pendente', gradeMin: '3' });
      http
        .expectOne((r) => r.url.endsWith('/admin/users'))
        .flush({ users: [], total: 0, offset: 0, limit: 50 });
      fixture.detectChanges();

      expect(el.querySelector('.filtros__resumo')?.textContent).toContain('(2)');
    });
  });
});
