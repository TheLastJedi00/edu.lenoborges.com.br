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
