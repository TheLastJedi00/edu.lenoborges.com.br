import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TrackService } from './track.service';
import { BadgeVideoList, youtubeEmbedUrl } from '../models/track.model';

describe('TrackService', () => {
  let service: TrackService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(TrackService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /**
   * **O teste central da camada de dados desta spec.**
   *
   * Insígnia sem vídeo é o estado normal do produto, e a API responde 200 com
   * lista vazia. Se isto resolvesse pelo caminho de erro, a tela mostraria
   * "algo deu errado" onde deveria dizer que o material ainda está sendo
   * preparado — e o aluno leria uma falha nossa como falha dele.
   */
  it('resolve lista vazia como sucesso, não como erro', () => {
    let received: BadgeVideoList | undefined;
    let failed = false;

    service.getVideos('angular').subscribe({
      next: (list) => (received = list),
      error: () => (failed = true)
    });

    http
      .expectOne((req) => req.url.endsWith('/badges/angular/videos'))
      .flush({ badgeId: 'angular', videos: [] });

    expect(failed).toBeFalse();
    expect(received?.videos).toEqual([]);
  });

  it('preserva a ordem que o servidor mandou', () => {
    // A ordem é dado, é editável pelo admin, e uma segunda ordenação no cliente
    // faria o admin arrastar sem ver efeito.
    let received: BadgeVideoList | undefined;
    service.getVideos('logica').subscribe((list) => (received = list));

    http.expectOne((req) => req.url.endsWith('/badges/logica/videos')).flush({
      badgeId: 'logica',
      videos: [
        { id: 'b', badgeId: 'logica', title: 'Segundo', description: null, youtubeId: 'bbbbbbbbbbb', order: 0 },
        { id: 'a', badgeId: 'logica', title: 'Primeiro', description: null, youtubeId: 'aaaaaaaaaaa', order: 1 }
      ]
    });

    expect(received?.videos.map((video) => video.title)).toEqual([
      'Segundo',
      'Primeiro'
    ]);
  });

  it('propaga o 404 de insígnia inexistente', () => {
    // Distinção que importa: vazio é terça-feira, 404 é bug ou URL adulterada.
    let status: number | undefined;
    service.getVideos('nao-existe').subscribe({
      error: (error: { status: number }) => (status = error.status)
    });

    http
      .expectOne((req) => req.url.endsWith('/badges/nao-existe/videos'))
      .flush('', { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });
});

describe('youtubeEmbedUrl', () => {
  it('deriva a URL de embed a partir do ID', () => {
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toContain('/embed/dQw4w9WgXcQ');
  });

  it('usa o domínio sem cookie', () => {
    // youtube-nocookie não grava cookie de rastreamento antes do play, o que
    // evita colocar um rastreador de terceiros em toda página da trilha.
    expect(youtubeEmbedUrl('dQw4w9WgXcQ')).toContain('youtube-nocookie.com');
  });
});
