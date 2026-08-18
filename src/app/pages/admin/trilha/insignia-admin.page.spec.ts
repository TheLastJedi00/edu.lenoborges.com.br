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
    order
  };
}

describe('AdminInsigniaPage', () => {
  let http: HttpTestingController;

  function setup(videos: BadgeVideo[]) {
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
            snapshot: { paramMap: convertToParamMap({ badgeId: 'logica' }) }
          }
        }
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminInsigniaPage);
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/admin/badges/logica/videos'))
      .flush({ badgeId: 'logica', videos });
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
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
});
