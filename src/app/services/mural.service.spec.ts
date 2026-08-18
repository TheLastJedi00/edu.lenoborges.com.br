import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { MuralService } from './mural.service';
import { MuralState } from '../models/mural.model';

const STATE: MuralState = {
  currentWeekId: '2026-08-16',
  votingWeekId: '2026-08-09',
  currentWeekEndsAt: '2026-08-23T03:00:00.000Z',
  canAsk: true,
  myQuestionId: null
};

describe('MuralService', () => {
  let service: MuralService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(MuralService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('busca o estado do ciclo', () => {
    let received: MuralState | undefined;
    service.getState().subscribe((state) => (received = state));

    http.expectOne((req) => req.url.endsWith('/mural')).flush(STATE);

    expect(received?.canAsk).toBeTrue();
    expect(received?.votingWeekId).toBe('2026-08-09');
  });

  /**
   * Ao contrário do catálogo de tiers, o estado do ciclo **muda dentro de uma
   * sessão**: a pessoa escreve a pergunta dela e `canAsk` deixa de ser
   * verdadeiro. Guardar o primeiro valor faria o botão continuar aberto depois
   * de a pergunta já existir.
   */
  it('não guarda o estado entre chamadas', () => {
    service.getState().subscribe();
    http.expectOne((req) => req.url.endsWith('/mural')).flush(STATE);

    service.getState().subscribe();
    http
      .expectOne((req) => req.url.endsWith('/mural'))
      .flush({ ...STATE, canAsk: false });
  });

  it('pede a fase certa na listagem', () => {
    service.listQuestions('votacao').subscribe();
    const request = http.expectOne((req) => req.url.endsWith('/mural/perguntas'));

    expect(request.request.params.get('fase')).toBe('votacao');
    request.flush([]);
  });

  it('vota e desvota na mesma pergunta', () => {
    service.vote('2026-08-09__uid-1').subscribe();
    const voto = http.expectOne((req) =>
      req.url.endsWith('/mural/perguntas/2026-08-09__uid-1/voto')
    );
    expect(voto.request.method).toBe('POST');
    voto.flush(null);

    service.unvote('2026-08-09__uid-1').subscribe();
    const desvoto = http.expectOne((req) =>
      req.url.endsWith('/mural/perguntas/2026-08-09__uid-1/voto')
    );
    expect(desvoto.request.method).toBe('DELETE');
    desvoto.flush(null);
  });

  /**
   * Os três erros que a tela precisa distinguir. Tratá-los como um só é o atalho
   * que arruína a decisão 3: o 403 é o único que precisa vender, e os outros
   * dois pedem ações completamente diferentes de quem está lendo.
   */
  it('propaga 403, 409 e 400 com status distinto', () => {
    const statuses: number[] = [];
    const captura = (error: { status: number }) => statuses.push(error.status);

    service
      .createQuestion({ badgeId: 'poo', title: 'Uma pergunta qualquer' })
      .subscribe({ error: captura });
    http
      .expectOne((req) => req.url.endsWith('/mural/perguntas'))
      .flush('', { status: 403, statusText: 'Forbidden' });

    service
      .createQuestion({ badgeId: 'poo', title: 'Outra pergunta qualquer' })
      .subscribe({ error: captura });
    http
      .expectOne((req) => req.url.endsWith('/mural/perguntas'))
      .flush('', { status: 409, statusText: 'Conflict' });

    service
      .updateQuestion('2026-08-09__uid-1', { title: 'Editando na votação' })
      .subscribe({ error: captura });
    http
      .expectOne((req) => req.url.endsWith('/mural/perguntas/2026-08-09__uid-1'))
      .flush('', { status: 409, statusText: 'Conflict' });

    expect(statuses).toEqual([403, 409, 409]);
  });

  it('modera pela rota de admin', () => {
    service.removeQuestion('2026-08-09__uid-1').subscribe();

    const request = http.expectOne((req) =>
      req.url.endsWith('/admin/mural/perguntas/2026-08-09__uid-1')
    );
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
