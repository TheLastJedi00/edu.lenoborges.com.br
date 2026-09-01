import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { AdminInsigniaPage } from './insignia-admin.page';
import { BadgeVideo } from '../../../models/track.model';

function video(
  id: string,
  title: string,
  order: number,
  extra: Partial<BadgeVideo> = {},
): BadgeVideo {
  return {
    id,
    badgeId: 'logica',
    title,
    description: null,
    youtubeId: id,
    kind: 'aula',
    // `tab` cai em `kind` quando o teste não diz outra coisa, que é o padrão
    // do produto: aula vive na trilha, resposta vive na aba. Os dois só
    // divergem quando a spec 021 os faz divergir.
    tab: 'aula',
    questionId: null,
    question: null,
    orientation: 'paisagem',
    devTierFree: false,
    watched: false,
    order,
    ...extra,
  };
}

describe('AdminInsigniaPage', () => {
  let http: HttpTestingController;

  function setup(videos: BadgeVideo[], queryParams: Record<string, string> = {}) {
    TestBed.configureTestingModule({
      imports: [AdminInsigniaPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ badgeId: 'logica' }),
              queryParamMap: convertToParamMap(queryParams),
            },
          },
        },
      ],
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminInsigniaPage);
    fixture.detectChanges();

    const lista = http.expectOne((req) => req.url.endsWith('/admin/badges/logica/videos'));
    lista.flush({ badgeId: 'logica', videos });
    fixture.detectChanges();

    return { fixture, lista, el: fixture.nativeElement as HTMLElement };
  }

  function titles(el: HTMLElement): (string | undefined)[] {
    return Array.from(el.querySelectorAll('.video__title')).map((node) => node.textContent?.trim());
  }

  /**
   * As setas são o mecanismo primário, e ficam sempre visíveis.
   *
   * Arrastar disputa com o scroll no toque, e essa disputa não tem empate. Numa
   * tela cujo uso principal é o celular, o mecanismo confiável tem de ser o
   * primeiro — e ações atrás de `:hover` simplesmente não existem no dedo.
   */
  it('mostra as setas de mover sempre, sem depender de hover', () => {
    const { el } = setup([video('a', 'Primeiro', 0), video('b', 'Segundo', 1)]);

    const acoes = el.querySelectorAll('.video__actions');
    expect(acoes.length).toBe(2);
    expect(acoes[0].querySelectorAll('button').length).toBe(3);
  });

  it('desabilita subir no primeiro e descer no último', () => {
    const { el } = setup([video('a', 'Primeiro', 0), video('b', 'Segundo', 1)]);

    const primeira = el.querySelectorAll('.video')[0];
    const ultima = el.querySelectorAll('.video')[1];

    expect((primeira.querySelectorAll('button')[0] as HTMLButtonElement).disabled).toBeTrue();
    expect((ultima.querySelectorAll('button')[1] as HTMLButtonElement).disabled).toBeTrue();
  });

  it('move na hora e manda a lista inteira na nova ordem', () => {
    const { fixture, el } = setup([video('a', 'Primeiro', 0), video('b', 'Segundo', 1)]);

    // Desce o primeiro.
    (el.querySelectorAll('.video')[0].querySelectorAll('button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    // A lista já se moveu, antes de a rede responder: reordenação otimista.
    expect(titles(el)).toEqual(['Segundo', 'Primeiro']);

    const request = http.expectOne((req) => req.url.endsWith('/admin/badges/logica/videos/order'));
    expect(request.request.body).toEqual({ videoIds: ['b', 'a'] });
    request.flush(null);
  });

  /**
   * O backend grava em lote atômico, então não existe meio-reordenado: o
   * rollback devolve sempre uma lista íntegra.
   */
  it('reverte a ordem e avisa quando a gravação falha', () => {
    const { fixture, el } = setup([video('a', 'Primeiro', 0), video('b', 'Segundo', 1)]);

    (el.querySelectorAll('.video')[0].querySelectorAll('button')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/admin/badges/logica/videos/order'))
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(titles(el)).toEqual(['Primeiro', 'Segundo']);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('voltei para a anterior');
  });

  it('avisa que o vídeo já está na insígnia quando a API responde 409', () => {
    const { fixture, el } = setup([]);

    (
      Array.from(el.querySelectorAll('button')).find((node) =>
        node.textContent?.includes('Publicar um vídeo'),
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    const form = el.querySelector('app-video-form') as HTMLElement;
    const [titulo, url] = Array.from(form.querySelectorAll('input'));
    titulo.value = 'Um título válido';
    titulo.dispatchEvent(new Event('input'));
    url.value = 'https://youtu.be/dQw4w9WgXcQ';
    url.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (form.querySelector('button[type="submit"]') as HTMLButtonElement).click();

    http
      .expectOne((req) => req.url.endsWith('/admin/badges/logica/videos'))
      .flush('', { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(el.textContent).toContain('já está nesta insígnia');
  });

  it('diz ao admin como a insígnia vazia aparece para o aluno', () => {
    const { el } = setup([]);

    expect(el.textContent).toContain('material em preparo');
  });

  describe('publicar resposta (spec 017)', () => {
    const PAUTA = [
      {
        weekId: '2026-08-09',
        origem: 'voto',
        question: {
          id: '2026-08-09__uid-1',
          weekId: '2026-08-09',
          phase: 'encerrada',
          badgeId: 'logica',
          authorName: 'Ana Prado',
          title: 'Quando usar herança em vez de composição?',
          body: null,
          voteCount: 12,
          hasVoted: false,
          isMine: false,
          answerVideoId: null,
          promotedTo: null,
          createdAt: `${new Date().getFullYear()}-08-09T18:00:00.000Z`,
        },
      },
    ];

    /** Preenche e envia o formulário aberto. */
    function publicar(fixture: unknown, el: HTMLElement, url: string) {
      const form = el.querySelector('app-video-form') as HTMLElement;
      const [titulo, link] = Array.from(form.querySelectorAll('input'));
      titulo.value = 'Herança e composição, na prática';
      titulo.dispatchEvent(new Event('input'));
      link.value = url;
      link.dispatchEvent(new Event('input'));
      (fixture as { detectChanges(): void }).detectChanges();

      (form.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    }

    it('com ?resposta=, abre o formulario em modo resposta e manda kind e questionId', () => {
      const { fixture, el } = setup([], { resposta: '2026-08-09__uid-1' });

      http.expectOne((req) => req.url.endsWith('/mural/vencedoras')).flush(PAUTA);
      fixture.detectChanges();

      // O formulário já está aberto, e mostra a pergunta antes de qualquer
      // clique: quem veio da pauta não precisa procurar o botão.
      const balao = el.querySelector('app-video-form .balao');
      expect(balao?.textContent).toContain('Quando usar herança em vez de composição?');
      expect(balao?.textContent).toContain('Ana Prado');
      expect(balao?.textContent).toContain('9 de agosto');

      publicar(fixture, el, 'https://www.youtube.com/shorts/rrrrrrrrrrr');

      const post = http.expectOne(
        (req) => req.method === 'POST' && req.url.endsWith('/admin/badges/logica/videos'),
      );
      expect(post.request.body).toEqual({
        title: 'Herança e composição, na prática',
        youtubeUrl: 'https://www.youtube.com/shorts/rrrrrrrrrrr',
        kind: 'resposta',
        questionId: '2026-08-09__uid-1',
      });
      post.flush(video('logica__rrrrrrrrrrr', 'Herança', 0));
    });

    /**
     * **Teste-trava:** a publicação de aula não mudou. Aula é 100% do que existe
     * publicado hoje, e esta spec mexeu na tela inteira — um `kind: 'aula'` que
     * passasse a sair por baixo seria inofensivo hoje e uma surpresa no dia em
     * que a API tratasse os dois casos de forma diferente.
     */
    it('teste-trava: sem o parametro, o corpo do POST e o de antes', () => {
      const { fixture, el } = setup([]);

      (
        Array.from(el.querySelectorAll('button')).find((node) =>
          node.textContent?.includes('Publicar um vídeo'),
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      publicar(fixture, el, 'https://youtu.be/dQw4w9WgXcQ');

      const post = http.expectOne(
        (req) => req.method === 'POST' && req.url.endsWith('/admin/badges/logica/videos'),
      );
      expect(post.request.body).toEqual({
        title: 'Herança e composição, na prática',
        youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
      });
      post.flush(video('logica__dQw4w9WgXcQ', 'Herança', 0));
    });

    it('pergunta que nao esta na pauta abre em modo aula, sem erro na tela', () => {
      const { fixture, el } = setup([], { resposta: 'nao-existe' });

      http.expectOne((req) => req.url.endsWith('/mural/vencedoras')).flush([]);
      fixture.detectChanges();

      expect(el.querySelector('app-video-form .balao')).toBeNull();
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    it('abre na aba de Aulas e pede a aba ao servidor', () => {
      const { lista, el } = setup([video('a', 'Primeiro', 0)]);

      expect(lista.request.params.get('tab')).toBe('aula');
      expect(el.querySelector('.tab--on')?.textContent?.trim()).toBe('Aulas');
    });

    /**
     * A reordenação valida a lista contra **uma** aba. Sem o `kind` aqui, a tela
     * mandaria a ordem das respostas como se fossem aulas — 400 em toda seta.
     */
    it('trocar de aba recarrega, e a reordenacao manda a aba corrente', () => {
      const { fixture, el } = setup([video('a', 'Primeiro', 0)]);

      (
        Array.from(el.querySelectorAll('.tab')).find((node) =>
          node.textContent?.includes('Respostas'),
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      const recarga = http.expectOne((req) => req.url.endsWith('/admin/badges/logica/videos'));
      expect(recarga.request.params.get('tab')).toBe('resposta');
      recarga.flush({
        badgeId: 'logica',
        videos: [
          { ...video('r1', 'Resposta 1', 0), kind: 'resposta' },
          { ...video('r2', 'Resposta 2', 1), kind: 'resposta' },
        ],
      });
      fixture.detectChanges();

      // Desce a primeira resposta.
      (el.querySelectorAll('.video')[0].querySelectorAll('button')[1] as HTMLButtonElement).click();
      fixture.detectChanges();

      const ordem = http.expectOne((req) => req.url.endsWith('/admin/badges/logica/videos/order'));
      expect(ordem.request.params.get('tab')).toBe('resposta');
      expect(ordem.request.body).toEqual({ videoIds: ['r2', 'r1'] });
      ordem.flush(null);
    });

    it('a mensagem do 400 lista os formatos que servem, Shorts incluido', () => {
      const { fixture, el } = setup([]);

      (
        Array.from(el.querySelectorAll('button')).find((node) =>
          node.textContent?.includes('Publicar um vídeo'),
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      publicar(fixture, el, 'https://vimeo.com/1');

      http
        .expectOne(
          (req) => req.method === 'POST' && req.url.endsWith('/admin/badges/logica/videos'),
        )
        .flush('', { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(el.textContent).toContain('youtube.com/shorts');
    });

    /**
     * A resposta posicionada na trilha (spec 021).
     *
     * O caso que estes testes travam é o da decisão 10: publicar da aba
     * Respostas um vídeo que voltou com `tab: 'aula'`. O empurrão na lista em
     * memória o poria na **aba errada**, e o defeito é invisível até alguém
     * recarregar a página.
     */
    describe('· posicionar a resposta na trilha (spec 021)', () => {
      /** Abre a tela pela pauta, com o formulário já em modo resposta. */
      function comPergunta() {
        const contexto = setup([], { resposta: '2026-08-09__uid-1' });

        http.expectOne((req) => req.url.endsWith('/mural/vencedoras')).flush(PAUTA);
        contexto.fixture.detectChanges();

        return contexto;
      }

      /** Liga o toggle "Posicionar na trilha" do formulário. */
      function ligarToggle(fixture: { detectChanges(): void }, el: HTMLElement) {
        const caixa = el.querySelector('app-video-form .trilha__input') as HTMLInputElement;
        caixa.checked = true;
        caixa.dispatchEvent(new Event('change'));
        fixture.detectChanges();
      }

      /** O que o servidor devolve para uma resposta que foi para a trilha. */
      function respostaNaTrilha() {
        return {
          ...video('logica__rrrrrrrrrrr', 'Herança e composição, na prática', 3),
          kind: 'resposta' as const,
          tab: 'aula' as const,
          questionId: '2026-08-09__uid-1',
        };
      }

      it('o toggle liga e o corpo do POST leva tab aula', () => {
        const { fixture, el } = comPergunta();

        ligarToggle(fixture, el);
        publicar(fixture, el, 'https://www.youtube.com/shorts/rrrrrrrrrrr');

        const post = http.expectOne(
          (req) => req.method === 'POST' && req.url.endsWith('/admin/badges/logica/videos'),
        );

        expect(post.request.body).toEqual(
          jasmine.objectContaining({
            kind: 'resposta',
            questionId: '2026-08-09__uid-1',
            tab: 'aula',
          }),
        );
        post.flush(respostaNaTrilha());
      });

      /**
       * **O bug que a decisão 10 evita.** O admin veio da pauta e está na aba
       * Respostas; o vídeo entrou na trilha. Empurrar na lista em memória o
       * mostraria na aba errada, e a etapa de posicionar precisa da lista vinda
       * do servidor — com as posições certas — antes de as setas fazerem
       * sentido.
       */
      it('publicando na aba Respostas, troca de aba e refaz o listVideos', () => {
        const { fixture, el } = comPergunta();

        ligarToggle(fixture, el);
        publicar(fixture, el, 'https://www.youtube.com/shorts/rrrrrrrrrrr');

        http
          .expectOne(
            (req) => req.method === 'POST' && req.url.endsWith('/admin/badges/logica/videos'),
          )
          .flush(respostaNaTrilha());
        fixture.detectChanges();

        // Recarrega, e pede a aba do vídeo — não a que estava na tela.
        const recarga = http.expectOne(
          (req) => req.method === 'GET' && req.url.endsWith('/admin/badges/logica/videos'),
        );
        expect(recarga.request.params.get('tab')).toBe('aula');
        recarga.flush({
          badgeId: 'logica',
          videos: [video('a1', 'Aula 1', 0), video('a2', 'Aula 2', 1), respostaNaTrilha()],
        });
        fixture.detectChanges();

        expect(el.querySelector('.tab--on')?.textContent?.trim()).toBe('Aulas');
        // A linha que diz onde o vídeo ficou: um item no fim de uma lista de
        // doze é um item que a pessoa não vê sem rolar.
        expect(el.querySelector('.alert--ok')?.textContent).toContain('entrou no fim da trilha');
      });

      /**
       * O outro lado, e ele é o comportamento de hoje: com o toggle desligado a
       * resposta fica na aba, e nada muda.
       */
      it('sem o toggle, a resposta continua na aba e não troca de lista', () => {
        const { fixture, el } = comPergunta();

        publicar(fixture, el, 'https://www.youtube.com/shorts/rrrrrrrrrrr');

        const post = http.expectOne(
          (req) => req.method === 'POST' && req.url.endsWith('/admin/badges/logica/videos'),
        );
        expect((post.request.body as { tab?: string }).tab).toBeUndefined();

        post.flush({
          ...respostaNaTrilha(),
          tab: 'resposta' as const,
        });
        fixture.detectChanges();

        // Nenhuma recarga: o vídeo entrou na lista que já estava na tela.
        http.expectNone(
          (req) => req.method === 'GET' && req.url.endsWith('/admin/badges/logica/videos'),
        );
        expect(el.querySelector('.tab--on')?.textContent?.trim()).toBe('Respostas');
        expect(el.querySelector('.alert--ok')).toBeNull();
      });

      /**
       * A etiqueta da decisão 11: sem ela o admin move um item sem saber que
       * não é aula, e vai procurar a aula que jurava ter publicado.
       */
      it('a etiqueta aparece no item de resposta da trilha, e não na aula', () => {
        const { fixture, el } = setup([video('a1', 'Aula 1', 0), respostaNaTrilha()]);
        fixture.detectChanges();

        const itens = el.querySelectorAll('.video');

        expect(itens[0].querySelector('.video__etiqueta')).toBeNull();
        expect(itens[1].querySelector('.video__etiqueta')?.textContent?.trim()).toBe('Resposta');
      });
    });
  });

  /**
   * A Arena de Treinamento no painel (spec 023, decisão 4).
   *
   * Os testes-trava aqui são dois: **o `ConfirmDialog` avisa o que vai junto**
   * — a exclusão é em cascata no servidor, e quem confirma sem saber apaga a
   * conversa de outras pessoas achando que está tirando um card da lista — e **a
   * reordenação é otimista com rollback**, que é o que impede a tela de mentir
   * quando a rede falha.
   */
  describe('Arena de Treinamento (spec 023)', () => {
    function treino(id: string, title: string, position: number) {
      return {
        id,
        badgeId: 'logica',
        title,
        description: 'Descrição',
        steps: ['Um'],
        videoUrl: null,
        xpAmount: 30,
        position,
        completed: false,
      };
    }

    /** Responde a listagem de desafios que o `ngOnInit` dispara. */
    function flushTreinos(lista: unknown[]) {
      http
        .expectOne((req) => req.url.endsWith('/admin/badges/logica/trainings'))
        .flush({ badgeId: 'logica', trainings: lista });
    }

    function nomesDosTreinos(el: HTMLElement): (string | undefined)[] {
      return Array.from(el.querySelectorAll('.arena-admin__nome')).map((item) =>
        item.textContent?.trim(),
      );
    }

    it('a seção aparece abaixo da gestão de vídeos', () => {
      const { fixture, el } = setup([video('a', 'Aula', 0)]);
      flushTreinos([treino('t1', 'Refatore o laço', 0)]);
      fixture.detectChanges();

      const html = el.innerHTML;

      expect(el.querySelector('.arena-admin')).not.toBeNull();
      expect(html.indexOf('arena-admin')).toBeGreaterThan(html.indexOf('Aula'));
    });

    it('diz que não há desafio em vez de mostrar uma lista vazia', () => {
      const { fixture, el } = setup([]);
      flushTreinos([]);
      fixture.detectChanges();

      expect(el.textContent).toContain('Nenhum desafio nesta insígnia ainda');
    });

    it('criar acrescenta o desafio ao fim da lista', () => {
      const { fixture, el } = setup([]);
      flushTreinos([treino('t1', 'Primeiro', 0)]);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.arena-admin .btn')!.click();
      fixture.detectChanges();

      const form = el.querySelector<HTMLFormElement>('app-training-form form')!;
      const preencher = (seletor: string, valor: string) => {
        const campo = form.querySelector<HTMLInputElement>(seletor)!;
        campo.value = valor;
        campo.dispatchEvent(new Event('input'));
      };
      preencher('#tf-title', 'Segundo');
      preencher('#tf-desc', 'Descrição');
      preencher('.tf__passo-campo', 'Clone o repositório');
      fixture.detectChanges();
      form.dispatchEvent(new Event('submit'));

      const req = http.expectOne((r) => r.url.endsWith('/admin/badges/logica/trainings'));
      expect(req.request.method).toBe('POST');
      req.flush(treino('t2', 'Segundo', 1));
      fixture.detectChanges();

      expect(nomesDosTreinos(el)).toEqual(['Primeiro', 'Segundo']);
    });

    /**
     * **O texto da confirmação diz o que vai junto.**
     *
     * A exclusão é em cascata no servidor: os comentários e as conclusões do
     * desafio somem com ele. Quem confirma sem saber disso apaga a conversa de
     * outras pessoas achando que está tirando um card da lista.
     */
    it('a remoção passa pelo ConfirmDialog, avisando da cascata', () => {
      const { fixture, el } = setup([]);
      flushTreinos([treino('t1', 'Primeiro', 0)]);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.icon-btn--danger')!.click();
      fixture.detectChanges();

      expect(el.textContent).toContain('Remover este desafio?');
      expect(el.textContent).toContain('os comentários e as conclusões dele vão junto');
      http.expectNone((req) => req.url.includes('/admin/trainings/'));
    });

    it('a seta troca a ordem na tela e manda a lista inteira', () => {
      const { fixture, el } = setup([]);
      flushTreinos([treino('t1', 'Primeiro', 0), treino('t2', 'Segundo', 1)]);
      fixture.detectChanges();

      el.querySelectorAll<HTMLButtonElement>('.arena-admin__seta')[1].click();
      fixture.detectChanges();

      expect(nomesDosTreinos(el)).toEqual(['Segundo', 'Primeiro']);

      const req = http.expectOne((r) => r.url.endsWith('/admin/badges/logica/trainings/reorder'));
      expect(req.request.body).toEqual({ orderedIds: ['t2', 't1'] });
      req.flush(null);
    });

    /**
     * **Rollback quando a ordem não salva.**
     *
     * A tela é otimista, e por isso ela precisa saber voltar. Sem isto, a lista
     * ficaria mostrando uma ordem que o banco não tem — e o admin sairia da
     * página achando que salvou.
     */
    it('volta a ordem anterior quando o reorder falha', () => {
      const { fixture, el } = setup([]);
      flushTreinos([treino('t1', 'Primeiro', 0), treino('t2', 'Segundo', 1)]);
      fixture.detectChanges();

      el.querySelectorAll<HTMLButtonElement>('.arena-admin__seta')[1].click();
      fixture.detectChanges();

      http
        .expectOne((r) => r.url.endsWith('/admin/badges/logica/trainings/reorder'))
        .flush('', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(nomesDosTreinos(el)).toEqual(['Primeiro', 'Segundo']);
      expect(el.textContent).toContain('voltei para a anterior');
    });

    it('editar salva pelo id e atualiza a linha', () => {
      const { fixture, el } = setup([]);
      flushTreinos([treino('t1', 'Título velho', 0)]);
      fixture.detectChanges();

      el.querySelector<HTMLButtonElement>('.arena-admin__editar')!.click();
      fixture.detectChanges();

      const form = el.querySelector<HTMLFormElement>('app-training-form form')!;
      const campo = form.querySelector<HTMLInputElement>('#tf-title')!;
      campo.value = 'Título novo';
      campo.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      form.dispatchEvent(new Event('submit'));

      const req = http.expectOne((r) => r.url.endsWith('/admin/trainings/t1'));
      expect(req.request.method).toBe('PATCH');
      req.flush(treino('t1', 'Título novo', 0));
      fixture.detectChanges();

      expect(nomesDosTreinos(el)).toEqual(['Título novo']);
    });
  });
});
