import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { AdminInsigniaPage } from './insignia-admin.page';
import { BadgeVideo } from '../../../models/track.model';

function video(id: string, title: string, order: number): BadgeVideo {
  return {
    id,
    badgeId: 'logica',
    title,
    description: null,
    youtubeId: id,
    kind: 'aula',
    questionId: null,
    question: null,
    orientation: 'paisagem',
    devTierFree: false,
    watched: false,
    order
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
              queryParamMap: convertToParamMap(queryParams)
            }
          }
        }
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminInsigniaPage);
    fixture.detectChanges();

    const lista = http.expectOne((req) =>
      req.url.endsWith('/admin/badges/logica/videos')
    );
    lista.flush({ badgeId: 'logica', videos });
    fixture.detectChanges();

    return { fixture, lista, el: fixture.nativeElement as HTMLElement };
  }

  function titles(el: HTMLElement): (string | undefined)[] {
    return Array.from(el.querySelectorAll('.video__title')).map((node) =>
      node.textContent?.trim()
    );
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

    expect(
      (primeira.querySelectorAll('button')[0] as HTMLButtonElement).disabled
    ).toBeTrue();
    expect(
      (ultima.querySelectorAll('button')[1] as HTMLButtonElement).disabled
    ).toBeTrue();
  });

  it('move na hora e manda a lista inteira na nova ordem', () => {
    const { fixture, el } = setup([
      video('a', 'Primeiro', 0),
      video('b', 'Segundo', 1)
    ]);

    // Desce o primeiro.
    (
      el.querySelectorAll('.video')[0].querySelectorAll('button')[1] as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    // A lista já se moveu, antes de a rede responder: reordenação otimista.
    expect(titles(el)).toEqual(['Segundo', 'Primeiro']);

    const request = http.expectOne((req) =>
      req.url.endsWith('/admin/badges/logica/videos/order')
    );
    expect(request.request.body).toEqual({ videoIds: ['b', 'a'] });
    request.flush(null);
  });

  /**
   * O backend grava em lote atômico, então não existe meio-reordenado: o
   * rollback devolve sempre uma lista íntegra.
   */
  it('reverte a ordem e avisa quando a gravação falha', () => {
    const { fixture, el } = setup([
      video('a', 'Primeiro', 0),
      video('b', 'Segundo', 1)
    ]);

    (
      el.querySelectorAll('.video')[0].querySelectorAll('button')[1] as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/admin/badges/logica/videos/order'))
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(titles(el)).toEqual(['Primeiro', 'Segundo']);
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'voltei para a anterior'
    );
  });

  it('avisa que o vídeo já está na insígnia quando a API responde 409', () => {
    const { fixture, el } = setup([]);

    (
      Array.from(el.querySelectorAll('button')).find((node) =>
        node.textContent?.includes('Publicar um vídeo')
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
          createdAt: `${new Date().getFullYear()}-08-09T18:00:00.000Z`
        }
      }
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

      http
        .expectOne((req) => req.url.endsWith('/mural/vencedoras'))
        .flush(PAUTA);
      fixture.detectChanges();

      // O formulário já está aberto, e mostra a pergunta antes de qualquer
      // clique: quem veio da pauta não precisa procurar o botão.
      const balao = el.querySelector('app-video-form .balao');
      expect(balao?.textContent).toContain(
        'Quando usar herança em vez de composição?'
      );
      expect(balao?.textContent).toContain('Ana Prado');
      expect(balao?.textContent).toContain('9 de agosto');

      publicar(fixture, el, 'https://www.youtube.com/shorts/rrrrrrrrrrr');

      const post = http.expectOne(
        (req) =>
          req.method === 'POST' &&
          req.url.endsWith('/admin/badges/logica/videos')
      );
      expect(post.request.body).toEqual({
        title: 'Herança e composição, na prática',
        youtubeUrl: 'https://www.youtube.com/shorts/rrrrrrrrrrr',
        kind: 'resposta',
        questionId: '2026-08-09__uid-1'
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
          node.textContent?.includes('Publicar um vídeo')
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      publicar(fixture, el, 'https://youtu.be/dQw4w9WgXcQ');

      const post = http.expectOne(
        (req) =>
          req.method === 'POST' &&
          req.url.endsWith('/admin/badges/logica/videos')
      );
      expect(post.request.body).toEqual({
        title: 'Herança e composição, na prática',
        youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ'
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

      expect(lista.request.params.get('kind')).toBe('aula');
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
          node.textContent?.includes('Respostas')
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      const recarga = http.expectOne((req) =>
        req.url.endsWith('/admin/badges/logica/videos')
      );
      expect(recarga.request.params.get('kind')).toBe('resposta');
      recarga.flush({
        badgeId: 'logica',
        videos: [
          { ...video('r1', 'Resposta 1', 0), kind: 'resposta' },
          { ...video('r2', 'Resposta 2', 1), kind: 'resposta' }
        ]
      });
      fixture.detectChanges();

      // Desce a primeira resposta.
      (
        el
          .querySelectorAll('.video')[0]
          .querySelectorAll('button')[1] as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      const ordem = http.expectOne((req) =>
        req.url.endsWith('/admin/badges/logica/videos/order')
      );
      expect(ordem.request.params.get('kind')).toBe('resposta');
      expect(ordem.request.body).toEqual({ videoIds: ['r2', 'r1'] });
      ordem.flush(null);
    });

    it('a mensagem do 400 lista os formatos que servem, Shorts incluido', () => {
      const { fixture, el } = setup([]);

      (
        Array.from(el.querySelectorAll('button')).find((node) =>
          node.textContent?.includes('Publicar um vídeo')
        ) as HTMLButtonElement
      ).click();
      fixture.detectChanges();

      publicar(fixture, el, 'https://vimeo.com/1');

      http
        .expectOne(
          (req) =>
            req.method === 'POST' &&
            req.url.endsWith('/admin/badges/logica/videos')
        )
        .flush('', { status: 400, statusText: 'Bad Request' });
      fixture.detectChanges();

      expect(el.textContent).toContain('youtube.com/shorts');
    });
  });
});
