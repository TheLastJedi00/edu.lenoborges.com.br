import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { InsigniaPage } from './insignia.page';

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
      devTierFree: false,
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
});
