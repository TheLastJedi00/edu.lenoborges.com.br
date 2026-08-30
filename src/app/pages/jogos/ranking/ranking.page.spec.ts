import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { RankingPage } from './ranking.page';
import { AuthStore } from '../../../core/auth/auth.store';
import { RankingEntry, RankingPage as Page } from '../../../models/games.model';

function linha(
  position: number,
  uid: string,
  extra: Partial<RankingEntry> = {}
): RankingEntry {
  return {
    position,
    uid,
    nickname: uid.toUpperCase(),
    xp: 1000 - position * 10,
    badgeCount: 0,
    positionChange: null,
    ...extra
  };
}

function pagina(extra: Partial<Page> = {}): Page {
  return {
    entries: [linha(1, 'a'), linha(2, 'b'), linha(3, 'c'), linha(4, 'd')],
    myPosition: 4,
    myEntry: linha(4, 'd'),
    nextCursor: null,
    ...extra
  };
}

describe('RankingPage', () => {
  let fixture: ComponentFixture<RankingPage>;
  let http: HttpTestingController;

  function flush(body: Page) {
    http.expectOne((r) => r.url.endsWith('/ranking')).flush(body);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RankingPage],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthStore);
    fixture = TestBed.createComponent(RankingPage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('os três primeiros vão para o pódio, e o resto para a tabela', () => {
    const root = flush(pagina());

    expect(root.querySelectorAll('.podium__item')).toHaveSize(3);
    expect(root.querySelectorAll('.table tbody tr')).toHaveSize(1);
  });

  it('a lista fica na ordem que o servidor mandou', () => {
    // Reordenar aqui criaria uma segunda verdade sobre quem está na frente, e
    // ela divergiria na primeira página seguinte.
    const root = flush(pagina());
    const nicks = Array.from(
      root.querySelectorAll('.podium__nick')
    ).map((el) => el.textContent?.trim());

    expect(nicks).toEqual(['A', 'B', 'C']);
  });

  it('a linha fixa do topo mostra a posição mesmo fora da página', () => {
    const root = flush(
      pagina({
        entries: [linha(1, 'a'), linha(2, 'b')],
        myPosition: 47,
        myEntry: linha(47, 'eu', { xp: 340, badgeCount: 3 })
      })
    );

    const mine = root.querySelector('.mine')!;

    expect(mine.textContent).toContain('#47');
    expect(mine.textContent).toContain('340 XP');
    expect(mine.textContent).toContain('3 insígnias');
  });

  it('quem não tem gamertag não vê a linha do topo', () => {
    const root = flush(pagina({ myPosition: null, myEntry: null }));

    expect(root.querySelector('.mine')).toBeNull();
    expect(root.querySelectorAll('.podium__item').length).toBeGreaterThan(0);
  });

  it('teste-trava: "Carregar mais" some quando não há próxima página', () => {
    // Um botão no fim da lista que traz vazio é pior do que não ter botão.
    const root = flush(pagina({ nextCursor: null }));

    expect(root.querySelector('.more')).toBeNull();
  });

  it('"Carregar mais" pede a próxima e acumula, sem repetir', () => {
    flush(pagina({ nextCursor: 'cursor-1' }));

    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('.more')!.click();

    const req = http.expectOne((r) => r.url.endsWith('/ranking'));
    expect(req.request.params.get('after')).toBe('cursor-1');

    req.flush({
      entries: [linha(5, 'e'), linha(6, 'f')],
      myPosition: 4,
      myEntry: linha(4, 'd'),
      nextCursor: null
    });
    fixture.detectChanges();

    // Quatro da primeira página mais dois da segunda, menos os três do pódio.
    expect(root.querySelectorAll('.table tbody tr')).toHaveSize(3);
    expect(root.querySelector('.more')).toBeNull();
  });

  it('o membro logado é destacado onde quer que esteja', () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.setProfile({
      id: 'd',
      email: 'd@x.com',
      name: 'D',
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
      socialLinksPublic: false,
      nickname: 'D'
    });

    const root = flush(pagina());

    expect(root.querySelector('.table__row--mine')).not.toBeNull();
  });

  it('teste-trava: o selo de evolução só aparece quando há variação', () => {
    // `null` é "ainda não sei" e zero é "não mudou": os dois desenham nada, e um
    // selo dizendo "0 posições" seria ruído numa lista onde a maioria não se
    // moveu.
    const root = flush(
      pagina({
        entries: [
          linha(1, 'a', { positionChange: null }),
          linha(2, 'b', { positionChange: 0 }),
          linha(3, 'c', { positionChange: 3 })
        ],
        myPosition: null,
        myEntry: null
      })
    );

    expect(root.querySelectorAll('.delta')).toHaveSize(1);
    expect(root.querySelector('.delta')!.getAttribute('aria-label')).toBe(
      'Subiu 3 posições hoje'
    );
  });

  it('lista vazia diz o que fazer, e não parece erro', () => {
    const root = flush(
      pagina({ entries: [], myPosition: null, myEntry: null })
    );

    expect(root.textContent).toContain('Ninguém no placar ainda');
    expect(root.querySelector('.state--error')).toBeNull();
  });

  it('teste-trava: a tabela rola dentro do próprio contêiner', () => {
    // O corpo da página nunca rola na horizontal, nem em 360px.
    const root = flush(pagina());

    expect(root.querySelector('.table-wrap')).not.toBeNull();
  });
});
