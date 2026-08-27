import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminMuralPage } from './mural-admin.page';
import { MuralQuestion, MuralWinner } from '../../../models/mural.model';

function question(overrides: Partial<MuralQuestion> = {}): MuralQuestion {
  return {
    id: '2026-08-09__uid-1',
    weekId: '2026-08-09',
    phase: 'votacao',
    badgeId: 'poo',
    authorName: 'Leno',
    title: 'Como saber quando usar herança?',
    body: null,
    voteCount: 7,
    hasVoted: false,
    isMine: false,
    answerVideoId: null,
    promotedTo: null,
    createdAt: '2026-08-09T18:00:00.000Z',
    ...overrides
  };
}

describe('AdminMuralPage', () => {
  let http: HttpTestingController;

  function setup(
    votacao: MuralQuestion[],
    coleta: MuralQuestion[] = [],
    winners: MuralWinner[] = []
  ) {
    TestBed.configureTestingModule({
      imports: [AdminMuralPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(AdminMuralPage);
    fixture.detectChanges();

    // As três saem juntas num `forkJoin` (spec 016): a pauta fica acima das
    // listas e, encadeada, seria a última a aparecer.
    const perguntas = http.match((req) =>
      req.url.endsWith('/mural/perguntas')
    );
    expect(perguntas.length).toBe(2);

    const porFase = (fase: string) =>
      perguntas.find((req) => req.request.params.get('fase') === fase)!;

    porFase('votacao').flush(votacao);
    porFase('coleta').flush(coleta);
    http
      .expectOne((req) => req.url.endsWith('/mural/vencedoras'))
      .flush(winners);
    fixture.detectChanges();

    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  /** O primeiro botão da tela com este rótulo. */
  function botao(el: HTMLElement, rotulo: string): HTMLButtonElement {
    return Array.from(el.querySelectorAll('.row__actions .btn')).find((node) =>
      node.textContent?.includes(rotulo)
    ) as HTMLButtonElement;
  }

  function confirmar(el: HTMLElement, rotulo: string): void {
    const acao = Array.from(el.querySelectorAll('.modal .btn')).find((node) =>
      node.textContent?.includes(rotulo)
    ) as HTMLButtonElement;
    acao.click();
  }

  function secao(el: HTMLElement, id: string): HTMLElement {
    return el.querySelector(`section[aria-labelledby="${id}"]`) as HTMLElement;
  }

  it('lista as perguntas das duas semanas vivas', () => {
    const { el } = setup(
      [question({ id: 'a', title: 'Em votação agora' })],
      [question({ id: 'b', title: 'Escrita esta semana', phase: 'coleta' })]
    );

    expect(el.textContent).toContain('Em votação agora');
    expect(el.textContent).toContain('Escrita esta semana');
  });

  /**
   * A remoção é irreversível e leva os votos junto. Confirmar sem ver o que se
   * apaga é confirmar no escuro — e numa lista de trinta cartões, "tem certeza?"
   * sozinho não diz qual deles vai sumir.
   */
  it('mostra o texto da pergunta no diálogo de confirmação', () => {
    const { fixture, el } = setup([
      question({ title: 'Uma pergunta bem específica' })
    ]);

    (el.querySelector('.btn--danger') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.modal__message')?.textContent).toContain(
      'Uma pergunta bem específica'
    );
  });

  it('remove só depois de confirmar', () => {
    const { fixture, el } = setup([question()]);

    (el.querySelector('.btn--danger') as HTMLButtonElement).click();
    fixture.detectChanges();

    // Cancelar não pode disparar requisição nenhuma — o http.verify() do
    // afterEach não existe aqui, mas o expectOne abaixo reprovaria uma segunda.
    const cancelar = Array.from(el.querySelectorAll('.modal .btn')).find((node) =>
      node.textContent?.includes('Cancelar')
    ) as HTMLButtonElement;
    cancelar.click();
    fixture.detectChanges();

    (el.querySelector('.btn--danger') as HTMLButtonElement).click();
    fixture.detectChanges();

    const confirmar = Array.from(el.querySelectorAll('.modal .btn')).find(
      (node) => node.textContent?.includes('Remover')
    ) as HTMLButtonElement;
    confirmar.click();

    http
      .expectOne((req) => req.url.includes('/admin/mural/perguntas/'))
      .flush(null);
  });

  /**
   * O fluxo mais repetido do admin: toda semana tem uma vencedora para virar
   * vídeo. O atalho já chega no formulário com a insígnia certa.
   */
  it('oferece o atalho para cadastrar o vídeo da vencedora', () => {
    const { el } = setup(
      [],
      [],
      [
        {
          weekId: '2026-08-02',
          origem: 'voto',
          question: question({ badgeId: 'angular', title: 'A vencedora' })
        }
      ]
    );

    const atalho = Array.from(el.querySelectorAll('a')).find((node) =>
      node.textContent?.includes('Cadastrar o vídeo')
    );
    expect(atalho?.getAttribute('href')).toContain(
      '/dashboard/admin/trilha/angular'
    );
  });

  /**
   * O cartão troca de seção com a resposta do `PATCH`, e sem recarregar a tela.
   */
  it('a pergunta adiantada sai da coleta e entra na votação', () => {
    const { fixture, el } = setup(
      [],
      [question({ id: 'x', title: 'Vai ser adiantada', phase: 'coleta' })]
    );

    const adiantar = botao(el, 'Adiantar para votação');
    adiantar.click();
    fixture.detectChanges();

    confirmar(el, 'Adiantar');

    http
      .expectOne((req) => req.url.endsWith('/admin/mural/perguntas/x/fase'))
      .flush(
        question({
          id: 'x',
          title: 'Vai ser adiantada',
          phase: 'votacao',
          promotedTo: 'votacao'
        })
      );
    fixture.detectChanges();

    const votacao = secao(el, 'votacao-titulo');
    const coleta = secao(el, 'coleta-titulo');

    expect(votacao.textContent).toContain('Vai ser adiantada');
    expect(coleta.textContent).not.toContain('Vai ser adiantada');
    // Nenhuma recarga: só o PATCH saiu.
    http.verify();
  });

  it('falhando o adiantamento, o cartão volta para onde estava e a mensagem aparece', () => {
    const { fixture, el } = setup(
      [],
      [question({ id: 'x', title: 'Vai falhar', phase: 'coleta' })]
    );

    botao(el, 'Adiantar para votação').click();
    fixture.detectChanges();
    confirmar(el, 'Adiantar');

    http
      .expectOne((req) => req.url.endsWith('/admin/mural/perguntas/x/fase'))
      .flush({ message: 'nao deu' }, { status: 500, statusText: 'Erro' });
    fixture.detectChanges();

    expect(secao(el, 'coleta-titulo').textContent).toContain('Vai falhar');
    expect(secao(el, 'votacao-titulo').textContent).not.toContain('Vai falhar');
    expect(el.querySelector('[role="alert"]')?.textContent).toContain(
      'Não consegui adiantar'
    );
  });

  /**
   * **A invariante do adiantamento, virada em asserção de tela.** O `PATCH`
   * devolve uma pergunta e **substitui um item**; recarregar tudo depois seria
   * o atalho que faz o admin achar que o ciclo inteiro andou.
   */
  it('só um cartão se move, e nenhuma recarga é disparada', () => {
    const { fixture, el } = setup(
      [],
      [
        question({ id: 'q1', title: 'Primeira', phase: 'coleta' }),
        question({ id: 'q2', title: 'Segunda', phase: 'coleta' }),
        question({ id: 'q3', title: 'Terceira', phase: 'coleta' }),
        question({ id: 'q4', title: 'Quarta', phase: 'coleta' })
      ]
    );

    // O primeiro "Adiantar para votação" da tela é o da pergunta q1.
    botao(el, 'Adiantar para votação').click();
    fixture.detectChanges();
    confirmar(el, 'Adiantar');

    http
      .expectOne((req) => req.url.endsWith('/admin/mural/perguntas/q1/fase'))
      .flush(
        question({
          id: 'q1',
          title: 'Primeira',
          phase: 'votacao',
          promotedTo: 'votacao'
        })
      );
    fixture.detectChanges();

    const restantes = Array.from(
      secao(el, 'coleta-titulo').querySelectorAll('.row__title')
    ).map((node) => node.textContent?.trim());

    expect(restantes).toEqual(['Segunda', 'Terceira', 'Quarta']);
    // Nenhuma requisição de recarregamento foi disparada.
    http.verify();
  });

  /**
   * O front não oferece o que a API responde 409: uma pergunta já em votação
   * não tem para onde ser adiantada além de "responder logo".
   */
  it('pergunta já em votação não tem o botão de adiantar para votação', () => {
    const { el } = setup([question({ id: 'v', title: 'Já em votação' })]);

    const rotulos = Array.from(el.querySelectorAll('.row__actions .btn')).map(
      (node) => node.textContent?.trim()
    );

    expect(rotulos).not.toContain('Adiantar para votação');
    expect(rotulos).toContain('Responder logo');
  });

  it('pergunta já adiantada para responder não tem botão de promoção nenhum', () => {
    const { el } = setup([
      question({
        id: 'p',
        title: 'Já na pauta',
        phase: 'encerrada',
        promotedTo: 'encerrada'
      })
    ]);

    const rotulos = Array.from(el.querySelectorAll('.row__actions .btn')).map(
      (node) => node.textContent?.trim()
    );

    expect(rotulos).toEqual(['Remover']);
  });

  it('não oferece atalho quando a vencedora já tem vídeo', () => {
    const { el } = setup(
      [],
      [],
      [
        {
          weekId: '2026-08-02',
          origem: 'voto',
          question: question({ answerVideoId: 'angular__aaaaaaaaaaa' })
        }
      ]
    );

    expect(el.textContent).not.toContain('Cadastrar o vídeo');
  });
});
