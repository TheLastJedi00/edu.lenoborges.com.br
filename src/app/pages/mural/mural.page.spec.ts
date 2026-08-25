import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter
} from '@angular/router';
import { MuralPage } from './mural.page';
import { MuralQuestion, MuralState } from '../../models/mural.model';

const STATE: MuralState = {
  currentWeekId: '2026-08-16',
  votingWeekId: '2026-08-09',
  // Bem no futuro para o contador não depender de quando a suíte roda.
  currentWeekEndsAt: '2099-01-03T03:00:00.000Z',
  canAsk: true,
  myQuestionId: null
};

function question(overrides: Partial<MuralQuestion> = {}): MuralQuestion {
  return {
    id: '2026-08-09__uid-1',
    weekId: '2026-08-09',
    phase: 'votacao',
    badgeId: 'poo',
    authorName: 'Leno',
    title: 'Como saber quando usar herança em vez de composição?',
    body: null,
    voteCount: 3,
    hasVoted: false,
    isMine: false,
    answerVideoId: null,
    ...overrides
  };
}

describe('MuralPage', () => {
  let http: HttpTestingController;

  function setup(questions: MuralQuestion[], state: MuralState = STATE) {
    TestBed.configureTestingModule({
      imports: [MuralPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MuralPage);
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/mural')).flush(state);
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/mural/perguntas'))
      .flush(questions);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  /**
   * **"Em votação" é a aba inicial**, e é decisão: é onde há algo para fazer com
   * um toque. Abrir em "Esta semana" mostraria, na manhã de domingo, uma lista
   * vazia como primeira impressão do recurso.
   */
  it('abre na aba "Em votação"', () => {
    const { el } = setup([question()]);

    const ativa = el.querySelector('.tab--on');
    expect(ativa?.textContent?.trim()).toBe('Em votação');
  });

  it('mostra as perguntas na ordem que o servidor mandou', () => {
    // A ordem é dado. Reordenar por voto no cliente faria dois membros verem
    // listas diferentes por causa de um voto que ainda não sincronizou.
    const { el } = setup([
      question({ id: 'b', title: 'Segunda na resposta', voteCount: 9 }),
      question({ id: 'a', title: 'Primeira na resposta', voteCount: 1 })
    ]);

    const titulos = Array.from(el.querySelectorAll('.card__title')).map((node) =>
      node.textContent?.trim()
    );
    expect(titulos).toEqual(['Segunda na resposta', 'Primeira na resposta']);
  });

  /**
   * Voto otimista: pinta e conta antes de a rede responder. Votar é a ação mais
   * repetida da tela, e 300ms de espera cinco vezes é o que faz um recurso
   * parecer lento.
   */
  it('pinta e conta o voto antes da resposta da rede', () => {
    const { fixture, el } = setup([question()]);

    (el.querySelector('.vote') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.vote__count')?.textContent?.trim()).toBe('4');
    expect(el.querySelector('.vote--on')).not.toBeNull();

    http
      .expectOne((req) => req.url.endsWith('/voto'))
      .flush(null);
  });

  it('reverte o voto quando a requisição falha', () => {
    const { fixture, el } = setup([question()]);

    (el.querySelector('.vote') as HTMLButtonElement).click();
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/voto'))
      .flush('', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el.querySelector('.vote__count')?.textContent?.trim()).toBe('3');
    expect(el.querySelector('.vote--on')).toBeNull();
  });

  /**
   * Na coleta o voto ainda não abriu — quem publicasse domingo de manhã teria
   * sete dias de vantagem. O número continua visível, mas não é botão.
   */
  it('não oferece voto na aba "Esta semana"', () => {
    const { fixture, el } = setup([question()]);

    const abaColeta = Array.from(el.querySelectorAll('.tab')).find((node) =>
      node.textContent?.includes('Esta semana')
    ) as HTMLButtonElement;
    abaColeta.click();
    fixture.detectChanges();

    http
      .expectOne((req) => req.url.endsWith('/mural/perguntas'))
      .flush([question({ phase: 'coleta', weekId: '2026-08-16' })]);
    fixture.detectChanges();

    expect(el.querySelector('button.vote')).toBeNull();
    expect(el.querySelector('.vote--static')).not.toBeNull();
  });

  it('mostra o contador da virada a partir do dado da API', () => {
    // Nunca do relógio do navegador sozinho: fuso errado no celular faria a
    // pessoa ver uma virada que não existe.
    const { el } = setup([question()]);

    expect(el.querySelector('.countdown')?.textContent).toContain('Fecha em');
  });

  it('explica a aba de votação vazia sem parecer erro', () => {
    const { el } = setup([]);

    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.textContent).toContain('Ainda não há o que votar');
  });

  it('oferece escrever quando canAsk é verdadeiro', () => {
    const { el } = setup([question()]);

    expect(el.textContent).toContain('Escrever minha pergunta');
  });

  /**
   * Quem já perguntou não vê "limite atingido": vê o caminho para editar. O
   * limite é o mesmo; o que muda é o que ele produz — refinar em vez de correr.
   */
  it('oferece editar quando a pessoa já perguntou nesta semana', () => {
    const { el } = setup([question()], {
      ...STATE,
      canAsk: false,
      myQuestionId: '2026-08-16__uid-1'
    });

    expect(el.textContent).toContain('Editar minha pergunta');
    expect(el.textContent).not.toContain('limite');
  });

  /**
   * O link da notificacao de pergunta nova (spec 012).
   *
   * Ele abre "Esta semana" com a mais nova em cima -- a unica ordem em que a
   * pergunta anunciada esta visivel sem rolar. **Sem o parametro nada muda**, e
   * trocar a aba padrao em silencio quebraria o Mural de quem entra pelo menu.
   */
  it('com ?ordem=recentes abre em "Esta semana" e pede a ordem invertida', () => {
    TestBed.configureTestingModule({
      imports: [MuralPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ ordem: 'recentes' })
            }
          }
        }
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(MuralPage);
    fixture.detectChanges();

    http.expectOne((req) => req.url.endsWith('/mural')).flush(STATE);
    fixture.detectChanges();

    const request = http.expectOne((req) =>
      req.url.endsWith('/mural/perguntas')
    );
    expect(request.request.params.get('fase')).toBe('coleta');
    expect(request.request.params.get('ordem')).toBe('recentes');
    request.flush([]);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.tab--on')?.textContent?.trim()).toBe(
      'Esta semana'
    );
  });
});
