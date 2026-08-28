import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { InsigniaPage } from './insignia.page';
import { AuthStore } from '../../../core/auth/auth.store';
import { MemberProfile } from '../../../models/auth.model';

/** Perfil mínimo para o AuthStore ter onde guardar o XP (spec 019). */
const PERFIL_XP: MemberProfile = {
  id: 'uid-1',
  email: 'membro@exemplo.com',
  name: 'Membro',
  phone: null,
  bio: null,
  grade: 1,
  linkedin: null,
  instagram: null,
  emailOptOut: false,
  profileCompleted: true,
  role: null,
  tier: 'dev-tier',
  pendingLegal: [],
  legalAcceptances: {},
  xp: 0,
  socialLinksPublic: false
};

describe('InsigniaPage', () => {
  let http: HttpTestingController;

  function setup(badgeId: string) {
    TestBed.configureTestingModule({
      imports: [InsigniaPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ badgeId }) } }
        }
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(InsigniaPage);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function flush(badgeId: string, videos: unknown[]) {
    http
      .expectOne((req) => req.url.endsWith(`/badges/${badgeId}/videos`))
      .flush({ badgeId, videos });
  }

  /**
   * **O teste central desta fase.**
   *
   * Lista vazia é conteúdo, não erro. Se a tela mostrasse "algo deu errado"
   * aqui, o aluno leria uma pendência nossa como falha dele — e o estado é o
   * normal do produto: no lançamento, onze das treze etapas estarão assim.
   */
  it('mostra o aviso de material em preparo quando não há vídeo', () => {
    const { fixture, el } = setup('angular');
    flush('angular', []);
    fixture.detectChanges();

    expect(el.textContent).toContain('Ainda estamos preparando esse material.');
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('oferece caminho de volta para escolher outra insígnia', () => {
    const { fixture, el } = setup('angular');
    flush('angular', []);
    fixture.detectChanges();

    expect(el.querySelector('.empty__cta')).not.toBeNull();
  });

  /**
   * Entrar direto na Insígnia 5 com `grade: 0` é caminho legítimo: a trilha não
   * é presa. Não existe guard de progresso nesta rota, e este teste é o que
   * denuncia alguém acrescentar um.
   */
  it('abre uma insígnia adiantada sem exigir progresso', () => {
    const { fixture, el } = setup('html-css');
    flush('html-css', [
      {
        id: 'html-css__aaaaaaaaaaa',
        badgeId: 'html-css',
        title: 'Seletores na prática',
        description: null,
        youtubeId: 'aaaaaaaaaaa',
        order: 0
      }
    ]);
    fixture.detectChanges();

    expect(el.textContent).toContain('Seletores na prática');
  });

  it('preserva a ordem que o servidor mandou', () => {
    // A ordem é dado, é editável pelo admin, e reordenar aqui faria o admin
    // arrastar sem ver efeito na tela do aluno.
    const { fixture, el } = setup('logica');
    flush('logica', [
      {
        id: 'b',
        badgeId: 'logica',
        title: 'Segundo na tela',
        description: null,
        youtubeId: 'bbbbbbbbbbb',
        order: 0
      },
      {
        id: 'a',
        badgeId: 'logica',
        title: 'Primeiro na tela',
        description: null,
        youtubeId: 'aaaaaaaaaaa',
        order: 1
      }
    ]);
    fixture.detectChanges();

    const titulos = Array.from(el.querySelectorAll('.video__title')).map(
      (node) => node.textContent?.trim()
    );
    expect(titulos).toEqual(['Segundo na tela', 'Primeiro na tela']);
  });

  it('usa o título da plataforma no player, e não o do YouTube', () => {
    const { fixture, el } = setup('logica');
    flush('logica', [
      {
        id: 'a',
        badgeId: 'logica',
        title: 'Variáveis, sem decorar',
        description: null,
        youtubeId: 'aaaaaaaaaaa',
        order: 0
      }
    ]);
    fixture.detectChanges();

    expect(el.querySelector('iframe')?.getAttribute('title')).toBe(
      'Variáveis, sem decorar'
    );
  });

  it('mostra estado de erro quando a requisição falha', () => {
    // A distinção que importa: vazio é terça-feira, erro de rede é erro.
    const { fixture, el } = setup('logica');
    http
      .expectOne((req) => req.url.endsWith('/badges/logica/videos'))
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.querySelector('[role="alert"]')).not.toBeNull();
    expect(el.textContent).not.toContain('Ainda estamos preparando');
  });
});

describe('InsigniaPage · abas de conteúdo (spec 010)', () => {
  let http: HttpTestingController;

  function setup(badgeId: string) {
    TestBed.configureTestingModule({
      imports: [InsigniaPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ badgeId }) } }
        }
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(InsigniaPage);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  function flushWith(videos: unknown[]) {
    const request = http.expectOne((req) => req.url.includes('/videos'));
    request.flush({ badgeId: 'logica', videos });
    return request;
  }

  function video(overrides: Record<string, unknown> = {}) {
    return {
      id: 'logica__aaaaaaaaaaa',
      badgeId: 'logica',
      title: 'Uma aula qualquer',
      description: null,
      youtubeId: 'aaaaaaaaaaa',
      kind: 'aula',
      questionId: null,
      question: null,
      orientation: 'paisagem',
      devTierFree: false,
      watched: false,
      order: 0,
      ...overrides
    };
  }

  it('abre em Aulas e pede a aba ao servidor', () => {
    const { el } = setup('logica');
    const request = flushWith([video()]);

    expect(request.request.params.get('kind')).toBe('aula');
    expect(el.querySelector('.tab--on')?.textContent?.trim()).toBe('Aulas');
  });

  /**
   * Cada aba tem a própria ordem, do servidor: as posições são 0..n-1 **dentro
   * da aba**. Filtrar no cliente uma lista das duas juntas daria a ordem errada.
   */
  it('recarrega do servidor ao trocar de aba', () => {
    const { fixture, el } = setup('logica');
    flushWith([video()]);
    fixture.detectChanges();

    const abaFaq = Array.from(el.querySelectorAll('.tab')).find((node) =>
      node.textContent?.includes('Perguntas Frequentes')
    ) as HTMLButtonElement;
    abaFaq.click();
    fixture.detectChanges();

    const request = http.expectOne((req) => req.url.includes('/videos'));
    expect(request.request.params.get('kind')).toBe('resposta');
    request.flush({ badgeId: 'logica', videos: [] });
  });

  /**
   * O selo é a prova, visível para quem não paga, de que a plataforma abre
   * porta — o contrapeso do único "não" que o produto dá ao Dev Tier.
   */
  it('mostra o selo "Livre para todos" no vídeo marcado', () => {
    const { fixture, el } = setup('logica');
    flushWith([video({ devTierFree: true })]);
    fixture.detectChanges();

    expect(el.querySelector('.free')?.textContent?.trim()).toBe(
      'Livre para todos'
    );
  });

  it('não mostra o selo em vídeo comum', () => {
    const { fixture, el } = setup('logica');
    flushWith([video()]);
    fixture.detectChanges();

    expect(el.querySelector('.free')).toBeNull();
  });

  it('a aba de Perguntas Frequentes vazia convida para o Mural', () => {
    const { fixture, el } = setup('logica');
    flushWith([video()]);
    fixture.detectChanges();

    (
      Array.from(el.querySelectorAll('.tab')).find((node) =>
        node.textContent?.includes('Perguntas Frequentes')
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.includes('/videos'))
      .flush({ badgeId: 'logica', videos: [] });
    fixture.detectChanges();

    expect(el.textContent).toContain('Nenhuma pergunta desta insígnia');
    // Vazio é convite, não erro.
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  describe('o balão e o retrato (spec 017)', () => {
    const resposta = (overrides: Record<string, unknown> = {}) =>
      video({
        kind: 'resposta',
        questionId: '2026-08-09__uid-1',
        orientation: 'retrato',
        question: {
          id: '2026-08-09__uid-1',
          title: 'Quando usar herança em vez de composição?',
          authorName: 'Ana Prado',
          askedAt: `${new Date().getFullYear()}-08-09T18:00:00.000Z`
        },
        ...overrides
      });

    /**
     * **Teste-trava da decisão 4.** O teste olha `orientation` e NUNCA `kind`:
     * é ele que impede alguém "simplificar" derivando a proporção do tipo do
     * vídeo — a simplificação passa despercebida até o dia em que existir uma
     * resposta gravada em paisagem.
     */
    it('a moldura sai de orientation, e nao de kind', () => {
      const { fixture, el } = setup('logica');
      flushWith([
        // Uma aula marcada como retrato: combinação que o produto não gera
        // hoje, e que é exatamente o que separa "leu o campo" de "olhou o kind".
        video({ orientation: 'retrato' })
      ]);
      fixture.detectChanges();

      expect(el.querySelector('.video__frame--retrato')).not.toBeNull();
      expect(el.querySelector('.video__frame--paisagem')).toBeNull();
    });

    it('a aula sai em paisagem', () => {
      const { fixture, el } = setup('logica');
      flushWith([video()]);
      fixture.detectChanges();

      expect(el.querySelector('.video__frame--paisagem')).not.toBeNull();
      expect(el.querySelector('.video__frame--retrato')).toBeNull();
    });

    it('o balao mostra a pergunta, o autor e a data por extenso', () => {
      const { fixture, el } = setup('logica');
      flushWith([resposta()]);
      fixture.detectChanges();

      const balao = el.querySelector('.balao');
      expect(balao?.textContent).toContain(
        'Quando usar herança em vez de composição?'
      );
      expect(balao?.textContent).toContain('Ana Prado');
      expect(balao?.textContent).toContain('9 de agosto');
    });

    /**
     * Vídeo marcado como resposta antes da spec 017 chega sem a foto. A tela não
     * desenha nada — sem balão, sem espaço reservado e sem aviso: um balão vazio
     * explicando dado faltando é pior que a ausência dele.
     */
    it('resposta sem a foto da pergunta renderiza sem balao e sem erro', () => {
      const { fixture, el } = setup('logica');
      flushWith([
        video({
          kind: 'resposta',
          questionId: '2026-08-09__uid-1',
          question: null,
          orientation: 'retrato'
        })
      ]);
      fixture.detectChanges();

      expect(el.querySelector('.balao')).toBeNull();
      expect(el.querySelector('[role="alert"]')).toBeNull();
      expect(el.querySelector('.video__frame--retrato')).not.toBeNull();
    });

    /**
     * O título da plataforma não é substituído pela pergunta. Ele é o que o
     * admin escreveu para a trilha; a pergunta é o que o aluno escreveu para o
     * Mural. Fundir os dois deixa a aba ilegível.
     */
    it('o titulo da plataforma continua acima do balao', () => {
      const { fixture, el } = setup('logica');
      flushWith([resposta({ title: 'Herança e composição, na prática' })]);
      fixture.detectChanges();

      expect(el.querySelector('.video__title')?.textContent?.trim()).toBe(
        'Herança e composição, na prática'
      );
    });

    it('a frase generica de resposta nao existe mais', () => {
      const { fixture, el } = setup('logica');
      flushWith([resposta()]);
      fixture.detectChanges();

      expect(el.textContent).not.toContain('Resposta a uma pergunta do Mural');
    });
  });

  /**
   * O check "Já assisti" e o XP (spec 019).
   *
   * O bloco tem duas travas que valem por ele inteiro: **o check muda antes da
   * resposta** e **o XP só muda depois dela**.
   */
  describe('marcar como assistido', () => {
    function aula(overrides: Record<string, unknown> = {}) {
      return {
        id: 'logica__aaa11111111',
        badgeId: 'logica',
        title: 'Variáveis na prática',
        description: null,
        youtubeId: 'aaa11111111',
        kind: 'aula',
        questionId: null,
        question: null,
        orientation: 'paisagem',
        devTierFree: false,
        order: 0,
        watched: false,
        ...overrides
      };
    }

    function check(el: HTMLElement): HTMLInputElement {
      return el.querySelector('.visto__input') as HTMLInputElement;
    }

    function responderMarcacao(watched: boolean, xp: number) {
      http
        .expectOne((req) =>
          req.url.endsWith('/me/watched-videos/logica__aaa11111111')
        )
        .flush({ videoId: 'logica__aaa11111111', watched, xp });
    }

    it('o check nasce com o estado que o servidor mandou', () => {
      const { fixture, el } = setup('logica');
      flushWith([aula({ watched: true })]);
      fixture.detectChanges();

      expect(check(el).checked).toBeTrue();
      expect(el.textContent).toContain('Assistido');
    });

    it('vídeo não assistido diz "Já assisti"', () => {
      const { fixture, el } = setup('logica');
      flushWith([aula()]);
      fixture.detectChanges();

      expect(check(el).checked).toBeFalse();
      expect(el.textContent).toContain('Já assisti');
    });

    /**
     * A frase existe porque, sem ela, o comportamento parece bug: alguém
     * desmarca esperando o número cair, ele não cai, e a conclusão razoável é
     * que a tela está quebrada.
     */
    it('a regra do XP definitivo está escrita antes do clique', () => {
      const { fixture, el } = setup('logica');
      flushWith([aula()]);
      fixture.detectChanges();

      expect(el.textContent).toContain(
        'Os 10 XP são seus para sempre — desmarcar só tira o check.'
      );
    });

    /**
     * **O check é otimista; o XP não** (decisão 2). Um check que espera 400ms de
     * rede parece travado no celular, e quem duvida clica de novo. O XP não é
     * reação a nada: é um número que o servidor calculou.
     */
    it('teste-trava: o check muda ANTES da resposta, e o XP só DEPOIS', async () => {
      const { fixture, el } = setup('logica');
      flushWith([aula()]);
      fixture.detectChanges();

      const store = TestBed.inject(AuthStore);
      store.setProfile(PERFIL_XP);

      check(el).click();
      fixture.detectChanges();

      // Antes de a resposta chegar: check ligado, XP intocado.
      expect(check(el).checked).toBeTrue();
      expect(store.xp()).toBe(0);

      responderMarcacao(true, 10);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(store.xp()).toBe(10);
    });

    /**
     * **O teste que documenta a decisão 1**, e o que fica vermelho no dia em que
     * alguém somar 10 localmente "para a tela responder mais rápido": remarcar
     * um vídeo devolve o mesmo XP, e o selo tem de ficar igual.
     */
    it('teste-trava: remarcar devolve o mesmo XP, e o selo não sobe', async () => {
      const { fixture, el } = setup('logica');
      flushWith([aula({ watched: false })]);
      fixture.detectChanges();

      const store = TestBed.inject(AuthStore);
      store.setProfile({ ...PERFIL_XP, xp: 340 });

      check(el).click();
      fixture.detectChanges();
      // O servidor devolve o MESMO número: este vídeo já tinha sido pago.
      responderMarcacao(true, 340);
      await fixture.whenStable();
      fixture.detectChanges();

      expect(store.xp()).toBe(340);
    });

    it('desmarcar manda watched false e não derruba o XP', async () => {
      const { fixture, el } = setup('logica');
      flushWith([aula({ watched: true })]);
      fixture.detectChanges();

      const store = TestBed.inject(AuthStore);
      store.setProfile({ ...PERFIL_XP, xp: 340 });

      check(el).click();
      fixture.detectChanges();

      const req = http.expectOne((r) =>
        r.url.endsWith('/me/watched-videos/logica__aaa11111111')
      );
      expect(req.request.body).toEqual({ watched: false });
      req.flush({
        videoId: 'logica__aaa11111111',
        watched: false,
        xp: 340
      });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(check(el).checked).toBeFalse();
      expect(store.xp()).toBe(340);
    });

    /**
     * Falhar em marcar um vídeo **não é evento que mereça interromper a
     * leitura**: o check volta ao que era e uma linha discreta aparece.
     */
    it('teste-trava: erro reverte o check, não mexe no XP e não abre modal', async () => {
      const { fixture, el } = setup('logica');
      flushWith([aula()]);
      fixture.detectChanges();

      const store = TestBed.inject(AuthStore);
      store.setProfile({ ...PERFIL_XP, xp: 340 });

      check(el).click();
      fixture.detectChanges();
      expect(check(el).checked).toBeTrue();

      http
        .expectOne((r) => r.url.endsWith('/me/watched-videos/logica__aaa11111111'))
        .flush(null, { status: 500, statusText: 'Server Error' });
      await fixture.whenStable();
      fixture.detectChanges();

      expect(check(el).checked).toBeFalse();
      expect(store.xp()).toBe(340);
      expect(el.querySelector('dialog')).toBeNull();
      expect(el.querySelector('.visto__erro')?.textContent).toContain(
        'Não consegui salvar agora.'
      );
    });

    /**
     * O check fica **fora** do `video__frame` (decisão 4): dentro, herdaria a
     * caixa de proporção da spec 017 e mudaria de tamanho conforme o vídeo fosse
     * retrato ou paisagem.
     */
    it('teste-trava: o check não está dentro da moldura do player', () => {
      const { fixture, el } = setup('logica');
      flushWith([aula()]);
      fixture.detectChanges();

      expect(el.querySelector('.video__frame .visto__input')).toBeNull();
      expect(el.querySelector('.visto__input')).not.toBeNull();
    });

    /**
     * Nada disso mora no navegador (decisão 11): o `watched` vem do servidor em
     * toda carga. Um `localStorage` falharia nas duas direções.
     */
    it('teste-trava: trocar de aba relê o estado do servidor', () => {
      const { fixture, el } = setup('logica');
      flushWith([aula({ watched: true })]);
      fixture.detectChanges();

      (el.querySelectorAll('.tab')[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      // A segunda aba responde com o mesmo vídeo desmarcado, e é isso que a tela
      // desenha: o estado anterior não sobrevive à recarga.
      http
        .expectOne((req) => req.url.includes('/badges/logica/videos'))
        .flush({ badgeId: 'logica', videos: [aula({ watched: false })] });
      fixture.detectChanges();

      expect(check(el).checked).toBeFalse();
    });
  });
});
