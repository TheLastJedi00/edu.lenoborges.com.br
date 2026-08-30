import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { RANKING_PAGE_SIZE, RankingService } from './ranking.service';
import { RankingPage } from '../models/games.model';

describe('RankingService', () => {
  let service: RankingService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RankingService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('pede a primeira página com o limite e sem cursor', () => {
    service.page().subscribe();

    const req = http.expectOne((r) => r.url.endsWith('/ranking'));

    expect(req.request.params.get('limit')).toBe(String(RANKING_PAGE_SIZE));
    expect(req.request.params.has('after')).toBe(false);

    req.flush({ entries: [], myPosition: null, myEntry: null, nextCursor: null });
  });

  it('manda o cursor da página seguinte', () => {
    service.page('MzQwOnVpZC0y').subscribe();

    const req = http.expectOne((r) => r.url.endsWith('/ranking'));

    expect(req.request.params.get('after')).toBe('MzQwOnVpZC0y');

    req.flush({ entries: [], myPosition: null, myEntry: null, nextCursor: null });
  });

  it('teste-trava: cursor nulo não vira o texto "null" na query', () => {
    // O fim da lista chega como `nextCursor: null`, e a tela pode repassá-lo
    // sem pensar. Um `?after=null` faria o servidor tentar decodificar a
    // string "null" e responder 400 — a lista quebraria exatamente no fim.
    service.page(null).subscribe();

    const req = http.expectOne((r) => r.url.endsWith('/ranking'));

    expect(req.request.params.has('after')).toBe(false);

    req.flush({ entries: [], myPosition: null, myEntry: null, nextCursor: null });
  });

  it('devolve a página como o servidor mandou, sem reordenar', () => {
    // A ordem é do servidor. Reordenar aqui criaria uma segunda verdade sobre
    // quem está na frente, e ela divergiria na primeira página seguinte.
    let received: RankingPage | undefined;

    service.page().subscribe((page) => (received = page));

    http.expectOne((r) => r.url.endsWith('/ranking')).flush({
      entries: [
        { position: 1, uid: 'b', nickname: 'B', xp: 900, badgeCount: 2, positionChange: null },
        { position: 2, uid: 'a', nickname: 'A', xp: 100, badgeCount: 0, positionChange: 3 }
      ],
      myPosition: 2,
      myEntry: {
        position: 2,
        uid: 'a',
        nickname: 'A',
        xp: 100,
        badgeCount: 0,
        positionChange: 3
      },
      nextCursor: 'abc'
    });

    expect(received?.entries.map((e) => e.uid)).toEqual(['b', 'a']);
    expect(received?.myPosition).toBe(2);
    expect(received?.nextCursor).toBe('abc');
  });

  it('quem não tem gamertag vê a lista sem a própria linha', () => {
    let received: RankingPage | undefined;

    service.page().subscribe((page) => (received = page));

    http.expectOne((r) => r.url.endsWith('/ranking')).flush({
      entries: [
        { position: 1, uid: 'b', nickname: 'B', xp: 900, badgeCount: 2, positionChange: null }
      ],
      myPosition: null,
      myEntry: null,
      nextCursor: null
    });

    expect(received?.entries).toHaveSize(1);
    expect(received?.myEntry).toBeNull();
  });
});
